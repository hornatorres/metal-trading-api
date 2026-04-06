import { TradingService } from './trading.service';
import { BuyDto } from './dto/buy.dto';
import { SellDto } from './dto/sell.dto';
import { CurrentUserType } from '../common/decorators/current-user.decorator';
export declare class TradingController {
    private readonly tradingService;
    constructor(tradingService: TradingService);
    buy(dto: BuyDto, user: CurrentUserType): Promise<{
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
    sell(dto: SellDto, user: CurrentUserType): Promise<{
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
    getLedger(user: CurrentUserType, cursor?: string, take?: string): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
        }[];
    }>;
}
