import { PrismaService } from '../prisma/prisma.service';
export interface MetalPrice {
    metalId: string;
    symbol: string;
    buyPrice: number;
    sellPrice: number;
    spread: number;
}
export declare class PricingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getCurrentPrice(metalId: string): Promise<MetalPrice>;
    getAllPrices(): Promise<MetalPrice[]>;
    updatePrice(metalId: string, buyPrice: number, sellPrice: number): Promise<MetalPrice>;
}
