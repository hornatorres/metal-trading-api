// ─────────────────────────────────────────────────────────────────────────────
//  wallets.service.ts  —  VERSIÓN CORREGIDA
//
//  Correcciones respecto al original:
//
//  [FIX-W1] debitUsd y debitMetal validan el balance DENTRO del tx antes de
//           decrementar. Esto actúa como segunda línea de defensa aunque
//           trading.service ya re-lea el balance dentro del mismo tx. El
//           constraint CHECK en DB es la tercera capa (ver migration SQL).
//
//  [FIX-W2] debitMetal ya no usa upsert con balance:0 si el wallet no existe,
//           porque debitar de un wallet inexistente es siempre un error.
//           Se lanza InsufficientMetalBalanceException (0 disponible).
//
//  [FIX-W3] Se elimina metalId: '' del upsert del wallet USD —
//           la clave única es (userId, metalId=null), no metalId vacío.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma }        from '@prisma/client';
import {
  InsufficientFundsException,
  InsufficientMetalBalanceException,
} from '../common/exceptions/business.exception';

// Tipo corto para el cliente interactivo de Prisma dentro de $transaction
type TxClient = Prisma.TransactionClient;

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Vista pública ──────────────────────────────────────────────────────────

  /**
   * Devuelve todas las wallets del usuario con sus saldos y detalle de metal.
   */
  async getWalletsByUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const wallets = await this.prisma.wallet.findMany({
      where:   { userId },
      include: { metal: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      userId,
      wallets: wallets.map((w) => ({
        id:      w.id,
        type:    w.metalId ? 'metal' : 'usd',
        metal:   w.metal
          ? { id: w.metal.id, name: w.metal.name, symbol: w.metal.symbol }
          : null,
        balance: Number(w.balance),
        unit:    w.metal ? w.metal.unit : 'USD',
      })),
    };
  }

  // ── Lecturas de balance (para pre-checks fuera del tx) ─────────────────────

  async getUsdBalance(userId: string, tx?: TxClient): Promise<number> {
    const client = tx ?? this.prisma;
    const wallet = await client.wallet.findFirst({
      where: { userId, metalId: null },
    });
    return wallet ? Number(wallet.balance) : 0;
  }

  async getMetalBalance(
    userId:  string,
    metalId: string,
    tx?:     TxClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const wallet = await client.wallet.findFirst({
      where: { userId, metalId },
    });
    return wallet ? Number(wallet.balance) : 0;
  }

  // ── Operaciones de débito ──────────────────────────────────────────────────
  // IMPORTANTE: siempre llamar desde dentro de un prisma.$transaction().
  // La validación interna es una segunda capa de defensa; la primera es la
  // re-lectura en trading.service; la tercera es el CHECK constraint en DB.

  /**
   * Debita USD del wallet del usuario.
   * Lanza InsufficientFundsException si el balance fresco < amount. [FIX-W1]
   */
  async debitUsd(
    userId: string,
    amount: number,
    tx:     TxClient,
  ): Promise<void> {
    // [FIX-W1] Re-leer balance para segunda capa de defensa
    const wallet = await tx.wallet.findFirst({
      where: { userId, metalId: null },
    });
    const currentBalance = wallet ? Number(wallet.balance) : 0;

    if (currentBalance < amount) {
      throw new InsufficientFundsException(
        `debitUsd guard: required $${amount}, available $${currentBalance}`,
      );
    }

    await tx.wallet.updateMany({
      where: { userId, metalId: null },
      data:  { balance: { decrement: amount } },
    });
  }

  /**
   * Acredita USD al wallet del usuario.
   */
  async creditUsd(
    userId: string,
    amount: number,
    tx:     TxClient,
  ): Promise<void> {
    await tx.wallet.updateMany({
      where: { userId, metalId: null },
      data:  { balance: { increment: amount } },
    });
  }

  /**
   * Debita metal del wallet del usuario.
   * Lanza InsufficientMetalBalanceException si no existe o si el balance < amount. [FIX-W1] [FIX-W2]
   */
  async debitMetal(
    userId:  string,
    metalId: string,
    amount:  number,
    tx:      TxClient,
  ): Promise<void> {
    // [FIX-W2] Si el wallet no existe, no hay nada que debitar
    const wallet = await tx.wallet.findFirst({
      where: { userId, metalId },
    });
    const currentBalance = wallet ? Number(wallet.balance) : 0;

    if (currentBalance < amount) {
      // No tenemos el symbol aquí; se pasa 'metal' como placeholder.
      // El error real ya fue lanzado con el symbol correcto desde trading.service.
      throw new InsufficientMetalBalanceException(currentBalance, amount, 'metal');
    }

    // [FIX-W2] Solo updateMany, nunca upsert con balance negativo
    await tx.wallet.updateMany({
      where: { userId, metalId },
      data:  { balance: { decrement: amount } },
    });
  }

  /**
   * Acredita metal al wallet del usuario. Crea la wallet si no existe.
   */
  async creditMetal(
    userId:  string,
    metalId: string,
    amount:  number,
    tx:      TxClient,
  ): Promise<void> {
    await tx.wallet.upsert({
      where:  { userId_metalId: { userId, metalId } },
      create: { userId, metalId, balance: amount },
      update: { balance: { increment: amount } },
    });
  }
}
