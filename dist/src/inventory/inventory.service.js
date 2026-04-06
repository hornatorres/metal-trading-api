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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const business_exception_1 = require("../common/exceptions/business.exception");
let InventoryService = InventoryService_1 = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(InventoryService_1.name);
    }
    async getAll() {
        const inventory = await this.prisma.inventory.findMany({
            include: { metal: true },
            orderBy: { metal: { symbol: 'asc' } },
        });
        return inventory.map((i) => ({
            metalId: i.metalId,
            metal: { name: i.metal.name, symbol: i.metal.symbol },
            totalStock: Number(i.totalStock),
            reservedStock: Number(i.reservedStock),
            availableStock: Number(i.availableStock),
        }));
    }
    async getByMetalId(metalId) {
        const inv = await this.prisma.inventory.findUnique({
            where: { metalId },
            include: { metal: true },
        });
        if (!inv)
            throw new common_1.NotFoundException(`Inventory for metal ${metalId} not found`);
        return inv;
    }
    async reserveStock(metalId, amountKg, tx) {
        const inv = await tx.inventory.findUnique({ where: { metalId } });
        if (!inv) {
            throw new common_1.NotFoundException(`Inventory for metal ${metalId} not found`);
        }
        const available = Number(inv.availableStock);
        if (available < amountKg) {
            throw new business_exception_1.InsufficientInventoryException(available, amountKg);
        }
        const total = Number(inv.totalStock);
        const reserved = Number(inv.reservedStock);
        if (reserved + amountKg > total) {
            this.logger.error(`Inventory inconsistency on metal=${metalId}: ` +
                `total=${total}, reserved=${reserved}, requested=${amountKg}`);
            throw new common_1.InternalServerErrorException('Inventory state inconsistency detected. Contact support.');
        }
        await tx.inventory.update({
            where: { metalId },
            data: {
                reservedStock: { increment: amountKg },
                availableStock: { decrement: amountKg },
            },
        });
        this.logger.debug(`Reserved ${amountKg} kg for metal ${metalId}`);
    }
    async confirmStockReduction(metalId, amountKg, tx) {
        const inv = await tx.inventory.findUnique({ where: { metalId } });
        if (!inv) {
            throw new common_1.NotFoundException(`Inventory for metal ${metalId} not found`);
        }
        const reserved = Number(inv.reservedStock);
        if (reserved < amountKg) {
            this.logger.error(`confirmStockReduction: reserved=${reserved} < requested=${amountKg} on metal=${metalId}`);
            throw new common_1.InternalServerErrorException('Cannot confirm stock reduction: reserved stock insufficient.');
        }
        await tx.inventory.update({
            where: { metalId },
            data: {
                totalStock: { decrement: amountKg },
                reservedStock: { decrement: amountKg },
            },
        });
        this.logger.debug(`Confirmed stock reduction of ${amountKg} kg for metal ${metalId}`);
    }
    async releaseReservedStock(metalId, amountKg, tx) {
        const inv = await tx.inventory.findUnique({ where: { metalId } });
        if (!inv) {
            throw new common_1.NotFoundException(`Inventory for metal ${metalId} not found`);
        }
        const reserved = Number(inv.reservedStock);
        if (reserved < amountKg) {
            this.logger.error(`releaseReservedStock: reserved=${reserved} < requested=${amountKg} on metal=${metalId}`);
            throw new common_1.InternalServerErrorException('Cannot release more stock than currently reserved.');
        }
        await tx.inventory.update({
            where: { metalId },
            data: {
                reservedStock: { decrement: amountKg },
                availableStock: { increment: amountKg },
            },
        });
        this.logger.debug(`Released ${amountKg} kg reservation for metal ${metalId}`);
    }
    async restockFromSale(metalId, amountKg, tx) {
        const inv = await tx.inventory.findUnique({ where: { metalId } });
        if (!inv) {
            throw new common_1.NotFoundException(`Inventory for metal ${metalId} not found`);
        }
        await tx.inventory.update({
            where: { metalId },
            data: {
                totalStock: { increment: amountKg },
                availableStock: { increment: amountKg },
            },
        });
        this.logger.debug(`Restocked ${amountKg} kg for metal ${metalId} from sale`);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map