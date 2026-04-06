"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WithdrawalsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const wallets_service_1 = require("../wallets/wallets.service");
const prisma_enums_1 = require("../common/enums/prisma.enums");
const business_exception_1 = require("../common/exceptions/business.exception");
const crypto_1 = require("crypto");
let WithdrawalsService = WithdrawalsService_1 = class WithdrawalsService {
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.logger = new common_1.Logger(WithdrawalsService_1.name);
    }
    async create(dto) {
        this.logger.log(`WITHDRAWAL ▶ user=${dto.userId}  metal=${dto.metalId}  amount=${dto.amountKg} kg`);
        const [user, metal] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: dto.userId } }),
            this.prisma.metal.findUnique({ where: { id: dto.metalId } }),
        ]);
        if (!user)
            throw new common_1.NotFoundException(`User ${dto.userId} not found`);
        if (!metal)
            throw new common_1.NotFoundException(`Metal ${dto.metalId} not found`);
        const metalBalance = await this.walletService.getMetalBalance(dto.userId, dto.metalId);
        if (metalBalance < dto.amountKg) {
            throw new business_exception_1.InsufficientMetalBalanceException(metalBalance, dto.amountKg, metal.symbol);
        }
        const pickupCode = (0, crypto_1.randomBytes)(4).toString('hex').toUpperCase();
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
        const withdrawal = await this.prisma.$transaction(async (tx) => {
            await this.walletService.debitMetal(dto.userId, dto.metalId, dto.amountKg, tx);
            const w = await tx.withdrawal.create({
                data: {
                    userId: dto.userId,
                    metalId: dto.metalId,
                    amountKg: dto.amountKg,
                    status: prisma_enums_1.WithdrawalStatus.PENDING,
                    pickupCode,
                    expiresAt,
                },
            });
            await tx.inventory.update({
                where: { metalId: dto.metalId },
                data: { reservedStock: { increment: dto.amountKg },
                    availableStock: { decrement: dto.amountKg } },
            });
            await tx.transaction.create({
                data: {
                    userId: dto.userId,
                    type: prisma_enums_1.TransactionType.WITHDRAWAL,
                    metalId: dto.metalId,
                    amount: dto.amountKg,
                    referenceId: w.id,
                    metadata: { pickupCode, expiresAt: expiresAt.toISOString() },
                },
            });
            this.logger.log(`WITHDRAWAL ✔  id=${w.id}  code=${pickupCode}`);
            return w;
        });
        return {
            success: true,
            message: `Withdrawal scheduled. Present pickup code at facility.`,
            withdrawalId: withdrawal.id,
            pickupCode: withdrawal.pickupCode,
            amountKg: Number(withdrawal.amountKg),
            metal: { name: metal.name, symbol: metal.symbol },
            status: withdrawal.status,
            expiresAt: withdrawal.expiresAt,
        };
    }
    async confirm(pickupCode) {
        const w = await this.prisma.withdrawal.findUnique({ where: { pickupCode } });
        if (!w)
            throw new common_1.NotFoundException(`Withdrawal with code ${pickupCode} not found`);
        if (w.status !== prisma_enums_1.WithdrawalStatus.PENDING && w.status !== prisma_enums_1.WithdrawalStatus.READY_FOR_PICKUP) {
            throw new common_1.BadRequestException(`Withdrawal is already ${w.status}`);
        }
        if (w.expiresAt && w.expiresAt < new Date()) {
            await this.prisma.withdrawal.update({
                where: { id: w.id },
                data: { status: prisma_enums_1.WithdrawalStatus.EXPIRED },
            });
            throw new common_1.BadRequestException(`Pickup code ${pickupCode} has expired`);
        }
        const confirmed = await this.prisma.$transaction(async (tx) => {
            await tx.inventory.update({
                where: { metalId: w.metalId },
                data: { totalStock: { decrement: Number(w.amountKg) },
                    reservedStock: { decrement: Number(w.amountKg) } },
            });
            return tx.withdrawal.update({
                where: { id: w.id },
                data: { status: prisma_enums_1.WithdrawalStatus.COMPLETED },
            });
        });
        this.logger.log(`WITHDRAWAL CONFIRMED  id=${w.id}  code=${pickupCode}`);
        return { success: true, status: confirmed.status, withdrawalId: w.id };
    }
    async findByUser(userId) {
        const rows = await this.prisma.withdrawal.findMany({
            where: { userId },
            include: { metal: true },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map((w) => ({
            id: w.id,
            metal: { name: w.metal.name, symbol: w.metal.symbol },
            amountKg: Number(w.amountKg),
            status: w.status,
            pickupCode: w.pickupCode,
            expiresAt: w.expiresAt,
            createdAt: w.createdAt,
        }));
    }
};
exports.WithdrawalsService = WithdrawalsService;
exports.WithdrawalsService = WithdrawalsService = WithdrawalsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallets_service_1.WalletsService])
], WithdrawalsService);
//# sourceMappingURL=withdrawals.service.js.map