import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { InventoryService } from '../inventory/inventory.service';
import { PricingService } from '../pricing/pricing.service';
import { BuyDto } from './dto/buy.dto';
import { SellDto } from './dto/sell.dto';
export declare class TradingService {
    private readonly prisma;
    private readonly walletService;
    private readonly inventoryService;
    private readonly pricingService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletsService, inventoryService: InventoryService, pricingService: PricingService);
    buy(dto: BuyDto): Promise<{
        success: boolean;
        message: string;
        order: {
            id: string;
            type: import(".prisma/client").$Enums.OrderType;
            amountKg: number;
            price: number;
            totalUsd: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            executedAt: Date;
        };
        ledger: {
            transactionId: string;
            createdAt: Date;
        };
    }>;
    sell(dto: SellDto): Promise<{
        success: boolean;
        message: string;
        order: {
            id: string;
            type: import(".prisma/client").$Enums.OrderType;
            amountKg: number;
            price: number;
            totalUsd: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            executedAt: Date;
        };
        ledger: {
            transactionId: string;
            createdAt: Date;
        };
    }>;
    getLedger(userId: string, cursor?: string, take?: number): Promise<{
        userId: string;
        count: number;
        nextCursor: string;
        entries: {
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            metal: {
                name: string;
                symbol: string;
            };
            amount: number;
            price: number;
            totalUsd: number;
            referenceId: string;
            metadata: Prisma.JsonValue;
            createdAt: Date;
        }[];
    }>;
    private formatTradeResult;
}
