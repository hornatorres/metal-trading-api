import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalStatus, TransactionType } from '../common/enums/prisma.enums';
import { InsufficientMetalBalanceException } from '../common/exceptions/business.exception';
import { randomBytes } from 'crypto';

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletsService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════
  //  CREATE WITHDRAWAL  —  user solicita retiro físico de metal
  //
  //  1. Validar usuario y metal
  //  2. Verificar balance suficiente
  //  3. Transacción atómica:
  //       a) Debitar metal del wallet
  //       b) Crear withdrawal con pickup_code
  //       c) Reservar inventario
  //       d) Escribir ledger
  // ═══════════════════════════════════════════════════════════════════
  async create(dto: CreateWithdrawalDto) {
    this.logger.log(
      `WITHDRAWAL ▶ user=${dto.userId}  metal=${dto.metalId}  amount=${dto.amountKg} kg`,
    );

    const [user, metal] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      this.prisma.metal.findUnique({ where: { id: dto.metalId } }),
    ]);

    if (!user)  throw new NotFoundException(`User ${dto.userId} not found`);
    if (!metal) throw new NotFoundException(`Metal ${dto.metalId} not found`);

    // Pre-flight: balance de metal
    const metalBalance = await this.walletService.getMetalBalance(dto.userId, dto.metalId);
    if (metalBalance < dto.amountKg) {
      throw new InsufficientMetalBalanceException(metalBalance, dto.amountKg, metal.symbol);
    }

    const pickupCode = randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F7C2B1"
    const expiresAt  = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 h

    const withdrawal = await this.prisma.$transaction(async (tx) => {

      // a) Debitar metal del wallet
      await this.walletService.debitMetal(dto.userId, dto.metalId, dto.amountKg, tx);

      // b) Crear withdrawal
      const w = await tx.withdrawal.create({
        data: {
          userId:     dto.userId,
          metalId:    dto.metalId,
          amountKg:   dto.amountKg,
          status:     WithdrawalStatus.PENDING,
          pickupCode,
          expiresAt,
        },
      });

      // c) Reservar en inventario (el metal ya fue debitado del wallet, pero
      //    físicamente sigue en almacén hasta el retiro)
      await tx.inventory.update({
        where: { metalId: dto.metalId },
        data:  { reservedStock: { increment: dto.amountKg },
                 availableStock: { decrement: dto.amountKg } },
      });

      // d) Ledger
      await tx.transaction.create({
        data: {
          userId:      dto.userId,
          type:        TransactionType.WITHDRAWAL,
          metalId:     dto.metalId,
          amount:      dto.amountKg,
          referenceId: w.id,
          metadata:    { pickupCode, expiresAt: expiresAt.toISOString() },
        },
      });

      this.logger.log(`WITHDRAWAL ✔  id=${w.id}  code=${pickupCode}`);
      return w;
    });

    return {
      success: true,
      message:     `Withdrawal scheduled. Present pickup code at facility.`,
      withdrawalId: withdrawal.id,
      pickupCode:   withdrawal.pickupCode,
      amountKg:     Number(withdrawal.amountKg),
      metal:        { name: metal.name, symbol: metal.symbol },
      status:       withdrawal.status,
      expiresAt:    withdrawal.expiresAt,
    };
  }

  // ── Confirmar retiro físico (operador escanea código) ─────────────
  async confirm(pickupCode: string) {
    const w = await this.prisma.withdrawal.findUnique({ where: { pickupCode } });

    if (!w) throw new NotFoundException(`Withdrawal with code ${pickupCode} not found`);

    if (w.status !== WithdrawalStatus.PENDING && w.status !== WithdrawalStatus.READY_FOR_PICKUP) {
      throw new BadRequestException(`Withdrawal is already ${w.status}`);
    }

    if (w.expiresAt && w.expiresAt < new Date()) {
      await this.prisma.withdrawal.update({
        where: { id: w.id },
        data:  { status: WithdrawalStatus.EXPIRED },
      });
      throw new BadRequestException(`Pickup code ${pickupCode} has expired`);
    }

    // Reducir stock total (ya no está en almacén)
    const confirmed = await this.prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { metalId: w.metalId },
        data:  { totalStock: { decrement: Number(w.amountKg) },
                 reservedStock: { decrement: Number(w.amountKg) } },
      });

      return tx.withdrawal.update({
        where: { id: w.id },
        data:  { status: WithdrawalStatus.COMPLETED },
      });
    });

    this.logger.log(`WITHDRAWAL CONFIRMED  id=${w.id}  code=${pickupCode}`);
    return { success: true, status: confirmed.status, withdrawalId: w.id };
  }

  async findByUser(userId: string) {
    const rows = await this.prisma.withdrawal.findMany({
      where:   { userId },
      include: { metal: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((w) => ({
      id:         w.id,
      metal:      { name: w.metal.name, symbol: w.metal.symbol },
      amountKg:   Number(w.amountKg),
      status:     w.status,
      pickupCode: w.pickupCode,
      expiresAt:  w.expiresAt,
      createdAt:  w.createdAt,
    }));
  }
}
