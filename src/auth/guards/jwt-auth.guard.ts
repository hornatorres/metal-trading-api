// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Aplicar este guard a cualquier endpoint que requiera autenticación:
//   @UseGuards(JwtAuthGuard)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
