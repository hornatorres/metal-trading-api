"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingController = void 0;
const common_1 = require("@nestjs/common");
const trading_service_1 = require("./trading.service");
const buy_dto_1 = require("./dto/buy.dto");
const sell_dto_1 = require("./dto/sell.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let TradingController = class TradingController {
    constructor(tradingService) {
        this.tradingService = tradingService;
    }
    buy(dto, user) {
        return this.tradingService.buy({ ...dto, userId: user.userId });
    }
    sell(dto, user) {
        return this.tradingService.sell({ ...dto, userId: user.userId });
    }
    getLedger(user, cursor, take) {
        return this.tradingService.getLedger(user.userId, cursor, take ? parseInt(take, 10) : 50);
    }
};
exports.TradingController = TradingController;
__decorate([
    (0, common_1.Post)('buy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [buy_dto_1.BuyDto, Object]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "buy", null);
__decorate([
    (0, common_1.Post)('sell'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sell_dto_1.SellDto, Object]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "sell", null);
__decorate([
    (0, common_1.Get)('ledger'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('cursor')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "getLedger", null);
exports.TradingController = TradingController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [trading_service_1.TradingService])
], TradingController);
//# sourceMappingURL=trading.controller.js.map