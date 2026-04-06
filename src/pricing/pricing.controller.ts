import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { IsUUID, IsNumber, IsPositive } from 'class-validator';

class UpdatePriceDto {
  @IsUUID('4')
  metalId: string;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  buyPrice: number;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  sellPrice: number;
}

@Controller('prices')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  /**
   * GET /api/v1/prices
   * Precios actuales de todos los metales (bid/ask + spread).
   */
  @Get()
  getAll() {
    return this.pricingService.getAllPrices();
  }

  /**
   * GET /api/v1/prices/:metalId
   */
  @Get(':metalId')
  getOne(@Param('metalId') metalId: string) {
    return this.pricingService.getCurrentPrice(metalId);
  }

  /**
   * POST /api/v1/prices
   * Actualiza el precio de un metal (market maker).
   * Expira el precio anterior automáticamente.
   */
  @Post()
  update(@Body() dto: UpdatePriceDto) {
    return this.pricingService.updatePrice(dto.metalId, dto.buyPrice, dto.sellPrice);
  }
}
