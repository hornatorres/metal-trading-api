// src/trading/trading.controller.ts  —  VERSIÓN CON JWT
//
// Cambios respecto a la versión anterior:
// - @UseGuards(JwtAuthGuard) protege /buy, /sell y /ledger
// - userId ya NO viene del body — se extrae del token con @CurrentUser()
// - Esto impide que un usuario opere en nombre de otro
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TradingService }                   from './trading.service';
import { BuyDto }                           from './dto/buy.dto';
import { SellDto }                          from './dto/sell.dto';
import { JwtAuthGuard }                     from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType }     from '../common/decorators/current-user.decorator';

@Controller()
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  /**
   * POST /api/v1/buy
   * Requiere JWT. El userId se toma del token, no del body.
   */
  @Post('buy')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  buy(
    @Body() dto: BuyDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tradingService.buy({ ...dto, userId: user.userId });
  }

  /**
   * POST /api/v1/sell
   * Requiere JWT. El userId se toma del token.
   */
  @Post('sell')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  sell(
    @Body() dto: SellDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tradingService.sell({ ...dto, userId: user.userId });
  }

  /**
   * GET /api/v1/ledger
   * Requiere JWT. Solo devuelve el ledger del usuario autenticado.
   */
  @Get('ledger')
  @UseGuards(JwtAuthGuard)
  getLedger(
    @CurrentUser() user: CurrentUserType,
    @Query('cursor') cursor?: string,
    @Query('take')   take?:   string,
  ) {
    return this.tradingService.getLedger(
      user.userId,
      cursor,
      take ? parseInt(take, 10) : 50,
    );
  }
}
