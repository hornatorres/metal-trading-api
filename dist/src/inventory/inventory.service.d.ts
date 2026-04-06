import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
type TxClient = Prisma.TransactionClient;
export declare class InventoryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getAll(): Promise<{
        metalId: string;
        metal: {
            name: string;
            symbol: string;
        };
        totalStock: number;
        reservedStock: number;
        availableStock: number;
    }[]>;
    getByMetalId(metalId: string): Promise<{
        metal: {
            symbol: string;
            id: string;
            name: string;
            unit: string;
            createdAt: Date;
        };
    } & {
        metalId: string;
        id: string;
        totalStock: Prisma.Decimal;
        reservedStock: Prisma.Decimal;
        availableStock: Prisma.Decimal;
        updatedAt: Date;
    }>;
    reserveStock(metalId: string, amountKg: number, tx: TxClient): Promise<void>;
    confirmStockReduction(metalId: string, amountKg: number, tx: TxClient): Promise<void>;
    releaseReservedStock(metalId: string, amountKg: number, tx: TxClient): Promise<void>;
    restockFromSale(metalId: string, amountKg: number, tx: TxClient): Promise<void>;
}
export {};
