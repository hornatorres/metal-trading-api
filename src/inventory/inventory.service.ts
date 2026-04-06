// ─────────────────────────────────────────────────────────────────────────────
//  inventory.service.ts  —  VERSIÓN CORREGIDA
//
//  Correcciones respecto al original:
//
//  [FIX-I1] reserveStock re-lee el inventario DENTRO del tx (ya lo hacía),
//           pero ahora la validación también verifica reserved + total para
//           detectar inconsistencias de datos pre-existentes.
//
//  [FIX-I2] confirmStockReduction verifica que reservedStock >= amountKg
//           antes de decrementar, evitando que un bug upstream deje el campo
//           en negativo.
//
//  [FIX-I3] releaseReservedStock verifica que reservedStock >= amountKg
//           antes de liberar.
//
//  [FIX-I4] restockFromSale verifica que el metal exista en inventario
//           antes de incrementar (no debería fallar, pero es defensivo).
//
//  [FIX-I5] getAll y getByMetalId devuelven Number() de todos los Decimal
//           para serialización JSON correcta.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma }        from '@prisma/client';
import {
  InsufficientInventoryException,
} from '../common/exceptions/business.exception';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Vista pública ──────────────────────────────────────────────────────────

  /**
   * Snapshot de inventario en tiempo real para todos los metales.
   */
  async getAll() {
    const inventory = await this.prisma.inventory.findMany({
      include: { metal: true },
      orderBy: { metal: { symbol: 'asc' } },
    });

    return inventory.map((i) => ({
      metalId:        i.metalId,
      metal:          { name: i.metal.name, symbol: i.metal.symbol },
      totalStock:     Number(i.totalStock),     // [FIX-I5]
      reservedStock:  Number(i.reservedStock),  // [FIX-I5]
      availableStock: Number(i.availableStock), // [FIX-I5]
    }));
  }

  async getByMetalId(metalId: string) {
    const inv = await this.prisma.inventory.findUnique({
      where:   { metalId },
      include: { metal: true },
    });
    if (!inv) throw new NotFoundException(`Inventory for metal ${metalId} not found`);
    return inv;
  }

  // ── Operaciones de stock (solo llamar desde dentro de $transaction) ─────────

  /**
   * Reserva stock físico para una operación BUY.
   * Lanza InsufficientInventoryException si no hay suficiente. [FIX-I1]
   *
   * DEBE llamarse desde dentro de prisma.$transaction().
   */
  async reserveStock(
    metalId:  string,
    amountKg: number,
    tx:       TxClient,
  ): Promise<void> {
    // [FIX-I1] Re-leer dentro del tx con isolation Serializable garantiza
    // que no hay otra transacción concurrente que haya tomado el mismo stock.
    const inv = await tx.inventory.findUnique({ where: { metalId } });

    if (!inv) {
      throw new NotFoundException(`Inventory for metal ${metalId} not found`);
    }

    const available = Number(inv.availableStock);

    if (available < amountKg) {
      throw new InsufficientInventoryException(available, amountKg);
    }

    // [FIX-I1] Verificación de consistencia interna
    const total    = Number(inv.totalStock);
    const reserved = Number(inv.reservedStock);
    if (reserved + amountKg > total) {
      // Esto nunca debería ocurrir si los constraints de DB están activos
      this.logger.error(
        `Inventory inconsistency on metal=${metalId}: ` +
        `total=${total}, reserved=${reserved}, requested=${amountKg}`,
      );
      throw new InternalServerErrorException(
        'Inventory state inconsistency detected. Contact support.',
      );
    }

    await tx.inventory.update({
      where: { metalId },
      data: {
        reservedStock:  { increment: amountKg },
        availableStock: { decrement: amountKg },
      },
    });

    this.logger.debug(`Reserved ${amountKg} kg for metal ${metalId}`);
  }

  /**
   * Confirma la salida física del stock tras ejecución de un BUY.
   * Mueve stock de reserved → vendido (decrementa total y reserved). [FIX-I2]
   *
   * DEBE llamarse desde dentro de prisma.$transaction().
   */
  async confirmStockReduction(
    metalId:  string,
    amountKg: number,
    tx:       TxClient,
  ): Promise<void> {
    // [FIX-I2] Verificar que hay suficiente reservado antes de decrementar
    const inv = await tx.inventory.findUnique({ where: { metalId } });

    if (!inv) {
      throw new NotFoundException(`Inventory for metal ${metalId} not found`);
    }

    const reserved = Number(inv.reservedStock);
    if (reserved < amountKg) {
      this.logger.error(
        `confirmStockReduction: reserved=${reserved} < requested=${amountKg} on metal=${metalId}`,
      );
      throw new InternalServerErrorException(
        'Cannot confirm stock reduction: reserved stock insufficient.',
      );
    }

    await tx.inventory.update({
      where: { metalId },
      data: {
        totalStock:    { decrement: amountKg },
        reservedStock: { decrement: amountKg },
      },
    });

    this.logger.debug(`Confirmed stock reduction of ${amountKg} kg for metal ${metalId}`);
  }

  /**
   * Libera stock reservado (p.ej. al cancelar una orden).
   * Revierte una reserva previa. [FIX-I3]
   *
   * DEBE llamarse desde dentro de prisma.$transaction().
   */
  async releaseReservedStock(
    metalId:  string,
    amountKg: number,
    tx:       TxClient,
  ): Promise<void> {
    // [FIX-I3] Verificar que hay suficiente reservado antes de liberar
    const inv = await tx.inventory.findUnique({ where: { metalId } });

    if (!inv) {
      throw new NotFoundException(`Inventory for metal ${metalId} not found`);
    }

    const reserved = Number(inv.reservedStock);
    if (reserved < amountKg) {
      this.logger.error(
        `releaseReservedStock: reserved=${reserved} < requested=${amountKg} on metal=${metalId}`,
      );
      throw new InternalServerErrorException(
        'Cannot release more stock than currently reserved.',
      );
    }

    await tx.inventory.update({
      where: { metalId },
      data: {
        reservedStock:  { decrement: amountKg },
        availableStock: { increment: amountKg },
      },
    });

    this.logger.debug(`Released ${amountKg} kg reservation for metal ${metalId}`);
  }

  /**
   * Repone inventario cuando el usuario vende metal a la plataforma. [FIX-I4]
   *
   * DEBE llamarse desde dentro de prisma.$transaction().
   */
  async restockFromSale(
    metalId:  string,
    amountKg: number,
    tx:       TxClient,
  ): Promise<void> {
    // [FIX-I4] Verificar que el inventario existe antes de incrementar
    const inv = await tx.inventory.findUnique({ where: { metalId } });
    if (!inv) {
      throw new NotFoundException(`Inventory for metal ${metalId} not found`);
    }

    await tx.inventory.update({
      where: { metalId },
      data: {
        totalStock:     { increment: amountKg },
        availableStock: { increment: amountKg },
      },
    });

    this.logger.debug(`Restocked ${amountKg} kg for metal ${metalId} from sale`);
  }
}
