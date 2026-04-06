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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        const dummyHash = '$2a$12$dummyhashtopreventtimingattack000000000000000000000000';
        const isValid = await bcrypt.compare(dto.password, user?.passwordHash ?? dummyHash);
        if (!user || !isValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.ForbiddenException(`Account is ${user.status}`);
        }
        const payload = { sub: user.id, email: user.email };
        const token = await this.jwtService.signAsync(payload);
        this.logger.log(`Login exitoso: ${user.email}`);
        return {
            access_token: token,
            token_type: 'Bearer',
            user: {
                id: user.id,
                email: user.email,
                status: user.status,
            },
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallets: { include: { metal: true } } },
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map