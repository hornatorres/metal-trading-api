import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
type TxClient = Prisma.TransactionClient;
export declare class WalletsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getWalletsByUser(userId: string): Promise<{
        userId: string;
        wallets: {
            id: string;
            type: string;
            metal: {
                id: string;
                name: string;
                symbol: string;
            };
            balance: number;
            unit: string;
        }[];
    }>;
    getUsdBalance(userId: string, tx?: TxClient): Promise<number>;
    getMetalBalance(userId: string, metalId: string, tx?: TxClient): Promise<number>;
    debitUsd(userId: string, amount: number, tx: TxClient): Promise<void>;
    creditUsd(userId: string, amount: number, tx: TxClient): Promise<void>;
    debitMetal(userId: string, metalId: string, amount: number, tx: TxClient): Promise<void>;
    creditMetal(userId: string, metalId: string, amount: number, tx: TxClient): Promise<void>;
}
export {};
