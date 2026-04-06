import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto): Promise<{
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
    findById(id: string): Promise<{
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
}
