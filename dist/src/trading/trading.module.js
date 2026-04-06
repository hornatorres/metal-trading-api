"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingModule = void 0;
const common_1 = require("@nestjs/common");
const trading_controller_1 = require("./trading.controller");
const trading_service_1 = require("./trading.service");
const wallets_module_1 = require("../wallets/wallets.module");
const inventory_module_1 = require("../inventory/inventory.module");
const pricing_module_1 = require("../pricing/pricing.module");
let TradingModule = class TradingModule {
};
exports.TradingModule = TradingModule;
exports.TradingModule = TradingModule = __decorate([
    (0, common_1.Module)({
        imports: [wallets_module_1.WalletsModule, inventory_module_1.InventoryModule, pricing_module_1.PricingModule],
        controllers: [trading_controller_1.TradingController],
        providers: [trading_service_1.TradingService],
        exports: [trading_service_1.TradingService],
    })
], TradingModule);
//# sourceMappingURL=trading.module.js.map