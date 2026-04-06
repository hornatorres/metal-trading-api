import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { CurrentUserType } from '../common/decorators/current-user.decorator';
export declare class WithdrawalsController {
    private readonly withdrawalsService;
    constructor(withdrawalsService: WithdrawalsService);
    create(dto: CreateWithdrawalDto, user: CurrentUserType): Promise<{
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
    confirm(code: string): Promise<{
        success: boolean;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        withdrawalId: string;
    }>;
    findMyWithdrawals(user: CurrentUserType): Promise<{
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
