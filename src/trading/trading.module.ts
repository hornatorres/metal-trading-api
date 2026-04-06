import { Module } from '@nestjs/common';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';
import { WalletsModule } from '../wallets/wallets.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [WalletsModule, InventoryModule, PricingModule],
  controllers: [TradingController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}
