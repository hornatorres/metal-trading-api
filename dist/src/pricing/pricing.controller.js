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
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const pricing_service_1 = require("./pricing.service");
const class_validator_1 = require("class-validator");
class UpdatePriceDto {
}
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], UpdatePriceDto.prototype, "metalId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 8 }),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdatePriceDto.prototype, "buyPrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 8 }),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdatePriceDto.prototype, "sellPrice", void 0);
let PricingController = class PricingController {
    constructor(pricingService) {
        this.pricingService = pricingService;
    }
    getAll() {
        return this.pricingService.getAllPrices();
    }
    getOne(metalId) {
        return this.pricingService.getCurrentPrice(metalId);
    }
    update(dto) {
        return this.pricingService.updatePrice(dto.metalId, dto.buyPrice, dto.sellPrice);
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':metalId'),
    __param(0, (0, common_1.Param)('metalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdatePriceDto]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "update", null);
exports.PricingController = PricingController = __decorate([
    (0, common_1.Controller)('prices'),
    __metadata("design:paramtypes", [pricing_service_1.PricingService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map