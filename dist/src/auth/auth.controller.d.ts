import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CurrentUserType } from '../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        token_type: string;
        user: {
            id: string;
            email: string;
            status: "ACTIVE";
        };
    }>;
    getProfile(user: CurrentUserType): Promise<{
        wallets: ({
            metal: {
                symbol: string;
                id: string;
                name: string;
                unit: string;
                createdAt: Date;
            };
        } & {
            userId: string;
            metalId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            balance: import("@prisma/client/runtime/library").Decimal;
        })[];
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
}
