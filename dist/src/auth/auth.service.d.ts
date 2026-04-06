import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        token_type: string;
        user: {
            id: string;
            email: string;
            status: "ACTIVE";
        };
    }>;
    getProfile(userId: string): Promise<{
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
