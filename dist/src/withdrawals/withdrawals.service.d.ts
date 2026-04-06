import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
export declare class WithdrawalsService {
    private readonly prisma;
    private readonly walletService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletsService);
    create(dto: CreateWithdrawalDto): Promise<{
        success: boolean;
        message: string;
        withdrawalId: string;
        pickupCode: string;
        amountKg: number;
        metal: {
            name: string;
            symbol: string;
        };
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        expiresAt: Date;
    }>;
    confirm(pickupCode: string): Promise<{
        success: boolean;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        withdrawalId: string;
    }>;
    findByUser(userId: string): Promise<{
        id: string;
        metal: {
            name: string;
            symbol: string;
        };
        amountKg: number;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        pickupCode: string;
        expiresAt: Date;
        createdAt: Date;
    }[]>;
}
