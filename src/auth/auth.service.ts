// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService }    from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto }      from './dto/login.dto';
import * as bcrypt       from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:     PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Login ──────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    // 1. Buscar usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // 2. Verificar que existe y que la contraseña es correcta
    // Usamos un hash ficticio si el usuario no existe para evitar timing attacks
    const dummyHash = '$2a$12$dummyhashtopreventtimingattack000000000000000000000000';
    const isValid   = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? dummyHash,
    );

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Verificar status
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(`Account is ${user.status}`);
    }

    // 4. Generar token JWT
    const payload = { sub: user.id, email: user.email };
    const token   = await this.jwtService.signAsync(payload);

    this.logger.log(`Login exitoso: ${user.email}`);

    return {
      access_token: token,
      token_type:   'Bearer',
      user: {
        id:     user.id,
        email:  user.email,
        status: user.status,
      },
    };
  }

  // ── Perfil del usuario autenticado ────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where:   { id: userId },
      include: { wallets: { include: { metal: true } } },
    });

    if (!user) throw new UnauthorizedException();

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
