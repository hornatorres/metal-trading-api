// src/wallets/wallets.controller.ts  —  VERSIÓN CON JWT
import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletsService }             from './wallets.service';
import { JwtAuthGuard }               from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  /**
   * GET /api/v1/wallets
   * Requiere JWT. Devuelve solo las wallets del usuario autenticado.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  getMyWallets(@CurrentUser() user: CurrentUserType) {
    return this.walletsService.getWalletsByUser(user.userId);
  }
}
