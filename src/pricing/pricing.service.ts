import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MetalPrice {
  metalId: string;
  symbol: string;
  buyPrice: number;   // Platform sells to user at this price
  sellPrice: number;  // Platform buys from user at this price
  spread: number;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gets the current active price for a metal.
   * "Active" = most recent price with validTo = null OR validTo > now().
   *
   * NOTE: In production, replace this with a real feed (LME, Reuters, etc.)
   * The Price table is already prepared to store time-series prices.
   */
  async getCurrentPrice(metalId: string): Promise<MetalPrice> {
    const price = await this.prisma.price.findFirst({
      where: {
        metalId,
        OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
      },
      include: { metal: true },
      orderBy: { validFrom: 'desc' },
    });

    if (!price) {
      throw new NotFoundException(`No active price found for metal ${metalId}`);
    }

    return {
      metalId: price.metalId,
      symbol: price.metal.symbol,
      buyPrice: Number(price.buyPrice),
      sellPrice: Number(price.sellPrice),
      spread: Number(price.spread),
    };
  }

  /**
   * Returns current prices for all metals.
   */
  async getAllPrices(): Promise<MetalPrice[]> {
    const metals = await this.prisma.metal.findMany();
    return Promise.all(metals.map((m) => this.getCurrentPrice(m.id)));
  }

  /**
   * Sets a new price for a metal (market maker update).
   * Expires the previous price automatically.
   */
  async updatePrice(
    metalId: string,
    buyPrice: number,
    sellPrice: number,
  ): Promise<MetalPrice> {
    const spread = parseFloat(((buyPrice - sellPrice) / buyPrice).toFixed(4));

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // Expire existing active prices
      await tx.price.updateMany({
        where: { metalId, validTo: null },
        data: { validTo: now },
      });

      // Create new price
      const newPrice = await tx.price.create({
        data: { metalId, buyPrice, sellPrice, spread, validFrom: now },
        include: { metal: true },
      });

      this.logger.log(
        `Price updated for ${newPrice.metal.symbol}: buy=${buyPrice}, sell=${sellPrice}`,
      );

      return {
        metalId: newPrice.metalId,
        symbol: newPrice.metal.symbol,
        buyPrice: Number(newPrice.buyPrice),
        sellPrice: Number(newPrice.sellPrice),
        spread: Number(newPrice.spread),
      };
    });
  }
}
