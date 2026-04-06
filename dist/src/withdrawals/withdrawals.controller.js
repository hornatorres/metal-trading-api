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
exports.WithdrawalsController = void 0;
const common_1 = require("@nestjs/common");
const withdrawals_service_1 = require("./withdrawals.service");
const create_withdrawal_dto_1 = require("./dto/create-withdrawal.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let WithdrawalsController = class WithdrawalsController {
    constructor(withdrawalsService) {
        this.withdrawalsService = withdrawalsService;
    }
    create(dto, user) {
        return this.withdrawalsService.create({ ...dto, userId: user.userId });
    }
    confirm(code) {
        return this.withdrawalsService.confirm(code);
    }
    findMyWithdrawals(user) {
        return this.withdrawalsService.findByUser(user.userId);
    }
};
exports.WithdrawalsController = WithdrawalsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_withdrawal_dto_1.CreateWithdrawalDto, Object]),
    __metadata("design:returntype", void 0)
], WithdrawalsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('confirm/:pickupCode'),
    __param(0, (0, common_1.Param)('pickupCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WithdrawalsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WithdrawalsController.prototype, "findMyWithdrawals", null);
exports.WithdrawalsController = WithdrawalsController = __decorate([
    (0, common_1.Controller)('withdrawals'),
    __metadata("design:paramtypes", [withdrawals_service_1.WithdrawalsService])
], WithdrawalsController);
//# sourceMappingURL=withdrawals.controller.js.map