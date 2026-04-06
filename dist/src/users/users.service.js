"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
const SALT_ROUNDS = 12;
let UsersService = UsersService_1 = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async create(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException(`Email ${dto.email} is already registered`);
        }
        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { email: dto.email, passwordHash },
            });
            await tx.wallet.create({
                data: { userId: newUser.id, metalId: null, balance: 0 },
            });
            this.logger.log(`New user created: ${newUser.email} (${newUser.id})`);
            return newUser;
        });
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(`User ${id} not found`);
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map