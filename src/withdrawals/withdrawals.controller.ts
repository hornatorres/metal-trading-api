// src/withdrawals/withdrawals.controller.ts  —  VERSIÓN CON JWT
import { Controller, Post, Get, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { WithdrawalsService }               from './withdrawals.service';
import { CreateWithdrawalDto }              from './dto/create-withdrawal.dto';
import { JwtAuthGuard }                     from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType }     from '../common/decorators/current-user.decorator';

@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  /**
   * POST /api/v1/withdrawals
   * Requiere JWT. userId viene del token.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateWithdrawalDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.withdrawalsService.create({ ...dto, userId: user.userId });
  }

  /**
   * PATCH /api/v1/withdrawals/confirm/:pickupCode
   * Endpoint para el operador del almacén (en producción proteger con rol OPERATOR).
   */
  @Patch('confirm/:pickupCode')
  confirm(@Param('pickupCode') code: string) {
    return this.withdrawalsService.confirm(code);
  }

  /**
   * GET /api/v1/withdrawals
   * Requiere JWT. Solo muestra los retiros del usuario autenticado.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findMyWithdrawals(@CurrentUser() user: CurrentUserType) {
    return this.withdrawalsService.findByUser(user.userId);
  }
}
