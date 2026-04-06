import { PricingService } from './pricing.service';
declare class UpdatePriceDto {
    metalId: string;
    buyPrice: number;
    sellPrice: number;
}
export declare class PricingController {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    getAll(): Promise<import("./pricing.service").MetalPrice[]>;
    getOne(metalId: string): Promise<import("./pricing.service").MetalPrice>;
    update(dto: UpdatePriceDto): Promise<import("./pricing.service").MetalPrice>;
}
export {};
