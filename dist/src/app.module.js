"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const wallets_module_1 = require("./wallets/wallets.module");
const trading_module_1 = require("./trading/trading.module");
const inventory_module_1 = require("./inventory/inventory.module");
const pricing_module_1 = require("./pricing/pricing.module");
const withdrawals_module_1 = require("./withdrawals/withdrawals.module");
const auth_module_1 = require("./auth/auth.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            wallets_module_1.WalletsModule,
            trading_module_1.TradingModule,
            inventory_module_1.InventoryModule,
            pricing_module_1.PricingModule,
            withdrawals_module_1.WithdrawalsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map