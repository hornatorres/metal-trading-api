import { WalletsService } from './wallets.service';
import { CurrentUserType } from '../common/decorators/current-user.decorator';
export declare class WalletsController {
    private readonly walletsService;
    constructor(walletsService: WalletsService);
    getMyWallets(user: CurrentUserType): Promise<{
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
}
