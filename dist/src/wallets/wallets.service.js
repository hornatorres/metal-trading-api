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
var WalletsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const business_exception_1 = require("../common/exceptions/business.exception");
let WalletsService = WalletsService_1 = class WalletsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WalletsService_1.name);
    }
    async getWalletsByUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException(`User ${userId} not found`);
        const wallets = await this.prisma.wallet.findMany({
            where: { userId },
            include: { metal: true },
            orderBy: { createdAt: 'asc' },
        });
        return {
            userId,
            wallets: wallets.map((w) => ({
                id: w.id,
                type: w.metalId ? 'metal' : 'usd',
                metal: w.metal
                    ? { id: w.metal.id, name: w.metal.name, symbol: w.metal.symbol }
                    : null,
                balance: Number(w.balance),
                unit: w.metal ? w.metal.unit : 'USD',
            })),
        };
    }
    async getUsdBalance(userId, tx) {
        const client = tx ?? this.prisma;
        const wallet = await client.wallet.findFirst({
            where: { userId, metalId: null },
        });
        return wallet ? Number(wallet.balance) : 0;
    }
    async getMetalBalance(userId, metalId, tx) {
        const client = tx ?? this.prisma;
        const wallet = await client.wallet.findFirst({
            where: { userId, metalId },
        });
        return wallet ? Number(wallet.balance) : 0;
    }
    async debitUsd(userId, amount, tx) {
        const wallet = await tx.wallet.findFirst({
            where: { userId, metalId: null },
        });
        const currentBalance = wallet ? Number(wallet.balance) : 0;
        if (currentBalance < amount) {
            throw new business_exception_1.InsufficientFundsException(`debitUsd guard: required $${amount}, available $${currentBalance}`);
        }
        await tx.wallet.updateMany({
            where: { userId, metalId: null },
            data: { balance: { decrement: amount } },
        });
    }
    async creditUsd(userId, amount, tx) {
        await tx.wallet.updateMany({
            where: { userId, metalId: null },
            data: { balance: { increment: amount } },
        });
    }
    async debitMetal(userId, metalId, amount, tx) {
        const wallet = await tx.wallet.findFirst({
            where: { userId, metalId },
        });
        const currentBalance = wallet ? Number(wallet.balance) : 0;
        if (currentBalance < amount) {
            throw new business_exception_1.InsufficientMetalBalanceException(currentBalance, amount, 'metal');
        }
        await tx.wallet.updateMany({
            where: { userId, metalId },
            data: { balance: { decrement: amount } },
        });
    }
    async creditMetal(userId, metalId, amount, tx) {
        await tx.wallet.upsert({
            where: { userId_metalId: { userId, metalId } },
            create: { userId, metalId, balance: amount },
            update: { balance: { increment: amount } },
        });
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = WalletsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map