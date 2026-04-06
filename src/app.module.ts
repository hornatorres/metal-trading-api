// src/app.module.ts
import { Module }        from '@nestjs/common';
import { ConfigModule }  from '@nestjs/config';
import { PrismaModule }  from './prisma/prisma.module';
import { UsersModule }   from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { TradingModule } from './trading/trading.module';
import { InventoryModule }   from './inventory/inventory.module';
import { PricingModule }     from './pricing/pricing.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { AuthModule }        from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    TradingModule,
    InventoryModule,
    PricingModule,
    WithdrawalsModule,
  ],
})
export class AppModule {}
