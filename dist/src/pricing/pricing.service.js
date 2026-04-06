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
var PricingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PricingService = PricingService_1 = class PricingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PricingService_1.name);
    }
    async getCurrentPrice(metalId) {
        const price = await this.prisma.price.findFirst({
            where: {
                metalId,
                OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
            },
            include: { metal: true },
            orderBy: { validFrom: 'desc' },
        });
        if (!price) {
            throw new common_1.NotFoundException(`No active price found for metal ${metalId}`);
        }
        return {
            metalId: price.metalId,
            symbol: price.metal.symbol,
            buyPrice: Number(price.buyPrice),
            sellPrice: Number(price.sellPrice),
            spread: Number(price.spread),
        };
    }
    async getAllPrices() {
        const metals = await this.prisma.metal.findMany();
        return Promise.all(metals.map((m) => this.getCurrentPrice(m.id)));
    }
    async updatePrice(metalId, buyPrice, sellPrice) {
        const spread = parseFloat(((buyPrice - sellPrice) / buyPrice).toFixed(4));
        return this.prisma.$transaction(async (tx) => {
            const now = new Date();
            await tx.price.updateMany({
                where: { metalId, validTo: null },
                data: { validTo: now },
            });
            const newPrice = await tx.price.create({
                data: { metalId, buyPrice, sellPrice, spread, validFrom: now },
                include: { metal: true },
            });
            this.logger.log(`Price updated for ${newPrice.metal.symbol}: buy=${buyPrice}, sell=${sellPrice}`);
            return {
                metalId: newPrice.metalId,
                symbol: newPrice.metal.symbol,
                buyPrice: Number(newPrice.buyPrice),
                sellPrice: Number(newPrice.sellPrice),
                spread: Number(newPrice.spread),
            };
        });
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = PricingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map