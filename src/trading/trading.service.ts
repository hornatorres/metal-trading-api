// ─────────────────────────────────────────────────────────────────────────────
//  trading.service.ts  —  VERSIÓN CORREGIDA
//
//  Correcciones aplicadas respecto al original:
//
//  [FIX-1] TOCTOU / doble gasto
//          Los pre-flight de balance USD e inventario (que estaban FUERA del
//          $transaction) se movieron DENTRO del mismo, con una re-lectura fresca
//          de la DB justo antes de cada operación crítica.
//
//  [FIX-2] Isolation level SERIALIZABLE
//          Ambas transacciones (buy/sell) especifican ahora
//          Prisma.TransactionIsolationLevel.Serializable para que Postgres
//          detecte y rechace lecturas concurrentes inconsistentes (impide
//          phantom reads y lost updates).
//
//  [FIX-3] Wrong exception en inventario insuficiente
//          Se reemplaza NotFoundException (HTTP 404) por
//          InsufficientInventoryException (HTTP 422), que es el tipo correcto.
//
//  [FIX-4] Aritmética Decimal en lugar de JS float
//          Se usa Decimal de @prisma/client/runtime/library para multiplicar
//          amountKg × executionPrice, eliminando errores de IEEE 754.
//
//  [FIX-5] Verificación de status del usuario
//          Un usuario SUSPENDED o PENDING_VERIFICATION ya no puede operar.
//
//  [FIX-6] Paginación por cursor en getLedger
//          Se eliminó el take:100 hardcodeado; el caller puede pasar cursor y
//          take (máximo 100). El response incluye nextCursor para paginar.
//
//  [FIX-7] Tipado fuerte en formatTradeResult
//          Reemplaza { order: any; transaction: any } con los tipos de Prisma.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Order, Transaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService }    from '../prisma/prisma.service';
import { WalletsService }   from '../wallets/wallets.service';
import { InventoryService } from '../inventory/inventory.service';
import { PricingService }   from '../pricing/pricing.service';
import { BuyDto }           from './dto/buy.dto';
import { SellDto }          from './dto/sell.dto';
import {
  OrderStatus,
  OrderType,
  TransactionType,
} from '../common/enums/prisma.enums';
import {
  InsufficientFundsException,
  InsufficientMetalBalanceException,
  InsufficientInventoryException,
} from '../common/exceptions/business.exception';

// Opciones compartidas para ambas transacciones
const TX_OPTIONS: Parameters<PrismaService['$transaction']>[1] = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // [FIX-2]
  timeout:        15_000,
};

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private readonly prisma:            PrismaService,
    private readonly walletService:     WalletsService,
    private readonly inventoryService:  InventoryService,
    private readonly pricingService:    PricingService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  //  BUY FLOW  —  user envía USD → recibe metal kg
  //
  //  1. Validar usuario (existencia + status ACTIVE)
  //  2. Obtener precio vigente (ask del platform → buyPrice)
  //  3. Calcular totalUsd con aritmética Decimal [FIX-4]
  //  4. Transacción SERIALIZABLE:  [FIX-1] [FIX-2]
  //       i)   Re-leer balance USD dentro del tx
  //       ii)  Re-leer inventario dentro del tx
  //       a)   Crear Order  → PENDING
  //       b)   Reservar inventario
  //       c)   Debitar USD del wallet
  //       d)   Acreditar metal kg al wallet
  //       e)   Confirmar reducción de stock
  //       f)   Order → EXECUTED
  //       g)   Escribir entrada en ledger (append-only)
  // ═══════════════════════════════════════════════════════════════════════════
  async buy(dto: BuyDto) {
    this.logger.log(
      `BUY ▶ user=${dto.userId}  metal=${dto.metalId}  amount=${dto.amountKg} kg`,
    );

    // ── 1. Validar usuario ─────────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }
    // [FIX-5] Bloquear cuentas no activas
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `User account is ${user.status}. Trading is not allowed.`,
      );
    }

    // ── 2. Precio vigente ──────────────────────────────────────────────────
    // Se lee fuera del tx porque es un dato de referencia aceptado al momento
    // de la solicitud. Si el precio cambia entre la lectura y la ejecución,
    // el usuario opera al precio acordado al inicio (comportamiento intencional).
    const price = await this.pricingService.getCurrentPrice(dto.metalId);
    const executionPrice = price.buyPrice;

    // ── 3. Calcular totalUsd con Decimal [FIX-4] ───────────────────────────
    const totalUsd = new Decimal(dto.amountKg.toString())
      .mul(new Decimal(executionPrice.toString()))
      .toDecimalPlaces(8)
      .toNumber();

    // ── 4. Transacción atómica SERIALIZABLE ───────────────────────────────
    const result = await this.prisma.$transaction(async (tx) => {

      // ── i) Re-leer balance USD DENTRO del tx [FIX-1] ────────────────────
      // Esta lectura ocurre con el lock del nivel Serializable, por lo que
      // ninguna transacción concurrente puede modificar el wallet entre esta
      // lectura y el UPDATE posterior.
      const freshWallet = await tx.wallet.findFirst({
        where: { userId: dto.userId, metalId: null },
      });
      const freshUsdBalance = freshWallet ? Number(freshWallet.balance) : 0;

      if (freshUsdBalance < totalUsd) {
        throw new InsufficientFundsException(
          `Required $${totalUsd.toFixed(2)}, available $${freshUsdBalance.toFixed(2)}`,
        );
      }

      // ── ii) Re-leer inventario DENTRO del tx [FIX-1] [FIX-3] ────────────
      const freshInv = await tx.inventory.findUnique({
        where: { metalId: dto.metalId },
      });

      if (!freshInv) {
        throw new NotFoundException(`Inventory for metal ${dto.metalId} not found`);
      }

      if (Number(freshInv.availableStock) < dto.amountKg) {
        // [FIX-3] InsufficientInventoryException (422) en lugar de NotFoundException (404)
        throw new InsufficientInventoryException(
          Number(freshInv.availableStock),
          dto.amountKg,
        );
      }

      // ── a) Crear Order PENDING ────────────────────────────────────────────
      const order = await tx.order.create({
        data: {
          userId:   dto.userId,
          type:     OrderType.BUY,
          metalId:  dto.metalId,
          amountKg: dto.amountKg,
          price:    executionPrice,
          totalUsd,
          status:   OrderStatus.PENDING,
        },
      });

      // ── b) Reservar inventario físico ─────────────────────────────────────
      await this.inventoryService.reserveStock(dto.metalId, dto.amountKg, tx);

      // ── c) Debitar USD del wallet ──────────────────────────────────────────
      await this.walletService.debitUsd(dto.userId, totalUsd, tx);

      // ── d) Acreditar metal kg al wallet ───────────────────────────────────
      await this.walletService.creditMetal(dto.userId, dto.metalId, dto.amountKg, tx);

      // ── e) Confirmar reducción de stock (reserved → sold) ─────────────────
      await this.inventoryService.confirmStockReduction(dto.metalId, dto.amountKg, tx);

      // ── f) Order → EXECUTED ───────────────────────────────────────────────
      const executedOrder = await tx.order.update({
        where: { id: order.id },
        data:  { status: OrderStatus.EXECUTED, executedAt: new Date() },
      });

      // ── g) Ledger — append-only, NUNCA UPDATE ni DELETE ───────────────────
      const ledgerEntry = await tx.transaction.create({
        data: {
          userId:      dto.userId,
          type:        TransactionType.BUY,
          metalId:     dto.metalId,
          amount:      dto.amountKg,
          price:       executionPrice,
          totalUsd,
          referenceId: order.id,
          metadata: {
            spread:        price.spread,
            symbol:        price.symbol,
            executionPrice,
            executedAt:    new Date().toISOString(),
          },
        },
      });

      this.logger.log(
        `BUY ✔  order=${order.id}  ${dto.amountKg} kg @ $${executionPrice} = $${totalUsd}`,
      );

      return { order: executedOrder, transaction: ledgerEntry };

    }, TX_OPTIONS); // [FIX-2] Serializable

    return this.formatTradeResult(result, price.symbol, dto.amountKg);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SELL FLOW  —  user envía metal kg → recibe USD
  //
  //  1. Validar usuario (existencia + status ACTIVE)
  //  2. Obtener precio vigente (bid del platform → sellPrice)
  //  3. Calcular totalUsd con aritmética Decimal [FIX-4]
  //  4. Transacción SERIALIZABLE:  [FIX-1] [FIX-2]
  //       i)   Re-leer balance de metal dentro del tx
  //       a)   Crear Order  → PENDING
  //       b)   Debitar metal del wallet
  //       c)   Acreditar USD al wallet
  //       d)   Restock de inventario
  //       e)   Order → EXECUTED
  //       f)   Escribir entrada en ledger (append-only)
  // ═══════════════════════════════════════════════════════════════════════════
  async sell(dto: SellDto) {
    this.logger.log(
      `SELL ▶ user=${dto.userId}  metal=${dto.metalId}  amount=${dto.amountKg} kg`,
    );

    // ── 1. Validar usuario ─────────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }
    // [FIX-5] Bloquear cuentas no activas
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `User account is ${user.status}. Trading is not allowed.`,
      );
    }

    // ── 2. Precio vigente ──────────────────────────────────────────────────
    const price = await this.pricingService.getCurrentPrice(dto.metalId);
    const executionPrice = price.sellPrice;

    // ── 3. Calcular totalUsd con Decimal [FIX-4] ───────────────────────────
    const totalUsd = new Decimal(dto.amountKg.toString())
      .mul(new Decimal(executionPrice.toString()))
      .toDecimalPlaces(8)
      .toNumber();

    // ── 4. Transacción atómica SERIALIZABLE ───────────────────────────────
    const result = await this.prisma.$transaction(async (tx) => {

      // ── i) Re-leer balance de metal DENTRO del tx [FIX-1] ───────────────
      // Misma razón que en buy(): la lectura stale fuera del tx abría una
      // ventana de doble-gasto en concurrent requests.
      const freshMetalWallet = await tx.wallet.findFirst({
        where: { userId: dto.userId, metalId: dto.metalId },
      });
      const freshMetalBalance = freshMetalWallet ? Number(freshMetalWallet.balance) : 0;

      if (freshMetalBalance < dto.amountKg) {
        throw new InsufficientMetalBalanceException(
          freshMetalBalance,
          dto.amountKg,
          price.symbol,
        );
      }

      // ── a) Crear Order PENDING ────────────────────────────────────────────
      const order = await tx.order.create({
        data: {
          userId:   dto.userId,
          type:     OrderType.SELL,
          metalId:  dto.metalId,
          amountKg: dto.amountKg,
          price:    executionPrice,
          totalUsd,
          status:   OrderStatus.PENDING,
        },
      });

      // ── b) Debitar metal del wallet ───────────────────────────────────────
      await this.walletService.debitMetal(dto.userId, dto.metalId, dto.amountKg, tx);

      // ── c) Acreditar USD al wallet ─────────────────────────────────────────
      await this.walletService.creditUsd(dto.userId, totalUsd, tx);

      // ── d) Restock de inventario ──────────────────────────────────────────
      await this.inventoryService.restockFromSale(dto.metalId, dto.amountKg, tx);

      // ── e) Order → EXECUTED ───────────────────────────────────────────────
      const executedOrder = await tx.order.update({
        where: { id: order.id },
        data:  { status: OrderStatus.EXECUTED, executedAt: new Date() },
      });

      // ── f) Ledger — append-only, NUNCA UPDATE ni DELETE ───────────────────
      const ledgerEntry = await tx.transaction.create({
        data: {
          userId:      dto.userId,
          type:        TransactionType.SELL,
          metalId:     dto.metalId,
          amount:      dto.amountKg,
          price:       executionPrice,
          totalUsd,
          referenceId: order.id,
          metadata: {
            spread:        price.spread,
            symbol:        price.symbol,
            executionPrice,
            executedAt:    new Date().toISOString(),
          },
        },
      });

      this.logger.log(
        `SELL ✔  order=${order.id}  ${dto.amountKg} kg @ $${executionPrice} = $${totalUsd}`,
      );

      return { order: executedOrder, transaction: ledgerEntry };

    }, TX_OPTIONS); // [FIX-2] Serializable

    return this.formatTradeResult(result, price.symbol, dto.amountKg);
  }

  // ── Ledger read-only con paginación por cursor [FIX-6] ──────────────────
  async getLedger(userId: string, cursor?: string, take = 50) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // Máximo 100 registros por página para proteger memoria
    const pageSize = Math.min(Math.max(take, 1), 100);

    const entries = await this.prisma.transaction.findMany({
      where:   { userId },
      include: { metal: true },
      orderBy: { createdAt: 'desc' },
      take:    pageSize,
      ...(cursor && {
        cursor: { id: cursor },
        skip:   1,             // saltar el cursor mismo
      }),
    });

    // Si se devolvió una página completa hay potencialmente más registros
    const nextCursor =
      entries.length === pageSize
        ? entries[entries.length - 1].id
        : null;

    return {
      userId,
      count:      entries.length,
      nextCursor, // null = última página
      entries: entries.map((e) => ({
        id:          e.id,
        type:        e.type,
        metal:       e.metal
          ? { name: e.metal.name, symbol: e.metal.symbol }
          : null,
        amount:      Number(e.amount),
        price:       e.price    ? Number(e.price)    : null,
        totalUsd:    e.totalUsd ? Number(e.totalUsd) : null,
        referenceId: e.referenceId,
        metadata:    e.metadata,
        createdAt:   e.createdAt,
      })),
    };
  }

  // ── Helper de formato ─────────────────────────────────────────────────────
  // [FIX-7] Tipado fuerte con los modelos de Prisma en lugar de `any`
  private formatTradeResult(
    result: { order: Order; transaction: Transaction },
    symbol:   string,
    amountKg: number,
  ) {
    const { order, transaction } = result;
    return {
      success: true,
      message: `${order.type === OrderType.BUY ? 'Purchased' : 'Sold'} ${amountKg} kg of ${symbol}`,
      order: {
        id:         order.id,
        type:       order.type,
        amountKg:   Number(order.amountKg),
        price:      Number(order.price),
        totalUsd:   Number(order.totalUsd),
        status:     order.status,
        executedAt: order.executedAt,
      },
      ledger: {
        transactionId: transaction.id,
        createdAt:     transaction.createdAt,
      },
    };
  }
}
