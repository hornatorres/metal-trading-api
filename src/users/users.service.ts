import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // ── Uniqueness check ────────────────────────────────
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(`Email ${dto.email} is already registered`);
    }

    // ── Hash password ───────────────────────────────────
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // ── Create user + USD wallet atomically ─────────────
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email: dto.email, passwordHash },
      });

      // Every user starts with a USD wallet (metalId = null)
      await tx.wallet.create({
        data: { userId: newUser.id, metalId: null, balance: 0 },
      });

      this.logger.log(`New user created: ${newUser.email} (${newUser.id})`);
      return newUser;
    });

    // Never expose the hash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
