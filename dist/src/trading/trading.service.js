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
var TradingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const prisma_service_1 = require("../prisma/prisma.service");
const wallets_service_1 = require("../wallets/wallets.service");
const inventory_service_1 = require("../inventory/inventory.service");
const pricing_service_1 = require("../pricing/pricing.service");
const prisma_enums_1 = require("../common/enums/prisma.enums");
const business_exception_1 = require("../common/exceptions/business.exception");
const TX_OPTIONS = {
    isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
    timeout: 15_000,
};
let TradingService = TradingService_1 = class TradingService {
    constructor(prisma, walletService, inventoryService, pricingService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.inventoryService = inventoryService;
        this.pricingService = pricingService;
        this.logger = new common_1.Logger(TradingService_1.name);
    }
    async buy(dto) {
        this.logger.log(`BUY ▶ user=${dto.userId}  metal=${dto.metalId}  amount=${dto.amountKg} kg`);
        const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (!user) {
            throw new common_1.NotFoundException(`User ${dto.userId} not found`);
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.ForbiddenException(`User account is ${user.status}. Trading is not allowed.`);
        }
        const price = await this.pricingService.getCurrentPrice(dto.metalId);
        const executionPrice = price.buyPrice;
        const totalUsd = new library_1.Decimal(dto.amountKg.toString())
            .mul(new library_1.Decimal(executionPrice.toString()))
            .toDecimalPlaces(8)
            .toNumber();
        const result = await this.prisma.$transaction(async (tx) => {
            const freshWallet = await tx.wallet.findFirst({
                where: { userId: dto.userId, metalId: null },
            });
            const freshUsdBalance = freshWallet ? Number(freshWallet.balance) : 0;
            if (freshUsdBalance < totalUsd) {
                throw new business_exception_1.InsufficientFundsException(`Required $${totalUsd.toFixed(2)}, available $${freshUsdBalance.toFixed(2)}`);
            }
            const freshInv = await tx.inventory.findUnique({
                where: { metalId: dto.metalId },
            });
            if (!freshInv) {
                throw new common_1.NotFoundException(`Inventory for metal ${dto.metalId} not found`);
            }
            if (Number(freshInv.availableStock) < dto.amountKg) {
                throw new business_exception_1.InsufficientInventoryException(Number(freshInv.availableStock), dto.amountKg);
            }
            const order = await tx.order.create({
                data: {
                    userId: dto.userId,
                    type: prisma_enums_1.OrderType.BUY,
                    metalId: dto.metalId,
                    amountKg: dto.amountKg,
                    price: executionPrice,
                    totalUsd,
                    status: prisma_enums_1.OrderStatus.PENDING,
                },
            });
            await this.inventoryService.reserveStock(dto.metalId, dto.amountKg, tx);
            await this.walletService.debitUsd(dto.userId, totalUsd, tx);
            await this.walletService.creditMetal(dto.userId, dto.metalId, dto.amountKg, tx);
            await this.inventoryService.confirmStockReduction(dto.metalId, dto.amountKg, tx);
            const executedOrder = await tx.order.update({
                where: { id: order.id },
                data: { status: prisma_enums_1.OrderStatus.EXECUTED, executedAt: new Date() },
            });
            const ledgerEntry = await tx.transaction.create({
                data: {
                    userId: dto.userId,
                    type: prisma_enums_1.TransactionType.BUY,
                    metalId: dto.metalId,
                    amount: dto.amountKg,
                    price: executionPrice,
                    totalUsd,
                    referenceId: order.id,
                    metadata: {
                        spread: price.spread,
                        symbol: price.symbol,
                        executionPrice,
                        executedAt: new Date().toISOString(),
                    },
                },
            });
            this.logger.log(`BUY ✔  order=${order.id}  ${dto.amountKg} kg @ $${executionPrice} = $${totalUsd}`);
            return { order: executedOrder, transaction: ledgerEntry };
        }, TX_OPTIONS);
        return this.formatTradeResult(result, price.symbol, dto.amountKg);
    }
    async sell(dto) {
        this.logger.log(`SELL ▶ user=${dto.userId}  metal=${dto.metalId}  amount=${dto.amountKg} kg`);
        const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (!user) {
            throw new common_1.NotFoundException(`User ${dto.userId} not found`);
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.ForbiddenException(`User account is ${user.status}. Trading is not allowed.`);
        }
        const price = await this.pricingService.getCurrentPrice(dto.metalId);
        const executionPrice = price.sellPrice;
        const totalUsd = new library_1.Decimal(dto.amountKg.toString())
            .mul(new library_1.Decimal(executionPrice.toString()))
            .toDecimalPlaces(8)
            .toNumber();
        const result = await this.prisma.$transaction(async (tx) => {
            const freshMetalWallet = await tx.wallet.findFirst({
                where: { userId: dto.userId, metalId: dto.metalId },
            });
            const freshMetalBalance = freshMetalWallet ? Number(freshMetalWallet.balance) : 0;
            if (freshMetalBalance < dto.amountKg) {
                throw new business_exception_1.InsufficientMetalBalanceException(freshMetalBalance, dto.amountKg, price.symbol);
            }
            const order = await tx.order.create({
                data: {
                    userId: dto.userId,
                    type: prisma_enums_1.OrderType.SELL,
                    metalId: dto.metalId,
                    amountKg: dto.amountKg,
                    price: executionPrice,
                    totalUsd,
                    status: prisma_enums_1.OrderStatus.PENDING,
                },
            });
            await this.walletService.debitMetal(dto.userId, dto.metalId, dto.amountKg, tx);
            await this.walletService.creditUsd(dto.userId, totalUsd, tx);
            await this.inventoryService.restockFromSale(dto.metalId, dto.amountKg, tx);
            const executedOrder = await tx.order.update({
                where: { id: order.id },
                data: { status: prisma_enums_1.OrderStatus.EXECUTED, executedAt: new Date() },
            });
            const ledgerEntry = await tx.transaction.create({
                data: {
                    userId: dto.userId,
                    type: prisma_enums_1.TransactionType.SELL,
                    metalId: dto.metalId,
                    amount: dto.amountKg,
                    price: executionPrice,
                    totalUsd,
                    referenceId: order.id,
                    metadata: {
                        spread: price.spread,
                        symbol: price.symbol,
                        executionPrice,
                        executedAt: new Date().toISOString(),
                    },
                },
            });
            this.logger.log(`SELL ✔  order=${order.id}  ${dto.amountKg} kg @ $${executionPrice} = $${totalUsd}`);
            return { order: executedOrder, transaction: ledgerEntry };
        }, TX_OPTIONS);
        return this.formatTradeResult(result, price.symbol, dto.amountKg);
    }
    async getLedger(userId, cursor, take = 50) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException(`User ${userId} not found`);
        const pageSize = Math.min(Math.max(take, 1), 100);
        const entries = await this.prisma.transaction.findMany({
            where: { userId },
            include: { metal: true },
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
        });
        const nextCursor = entries.length === pageSize
            ? entries[entries.length - 1].id
            : null;
        return {
            userId,
            count: entries.length,
            nextCursor,
            entries: entries.map((e) => ({
                id: e.id,
                type: e.type,
                metal: e.metal
                    ? { name: e.metal.name, symbol: e.metal.symbol }
                    : null,
                amount: Number(e.amount),
                price: e.price ? Number(e.price) : null,
                totalUsd: e.totalUsd ? Number(e.totalUsd) : null,
                referenceId: e.referenceId,
                metadata: e.metadata,
                createdAt: e.createdAt,
            })),
        };
    }
    formatTradeResult(result, symbol, amountKg) {
        const { order, transaction } = result;
        return {
            success: true,
            message: `${order.type === prisma_enums_1.OrderType.BUY ? 'Purchased' : 'Sold'} ${amountKg} kg of ${symbol}`,
            order: {
                id: order.id,
                type: order.type,
                amountKg: Number(order.amountKg),
                price: Number(order.price),
                totalUsd: Number(order.totalUsd),
                status: order.status,
                executedAt: order.executedAt,
            },
            ledger: {
                transactionId: transaction.id,
                createdAt: transaction.createdAt,
            },
        };
    }
};
exports.TradingService = TradingService;
exports.TradingService = TradingService = TradingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallets_service_1.WalletsService,
        inventory_service_1.InventoryService,
        pricing_service_1.PricingService])
], TradingService);
//# sourceMappingURL=trading.service.js.map