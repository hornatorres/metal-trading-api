import { Controller, Get, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * GET /api/v1/inventory
   * Returns real-time inventory snapshot for all metals.
   */
  @Get()
  getAll() {
    return this.inventoryService.getAll();
  }

  /**
   * GET /api/v1/inventory/:metalId
   */
  @Get(':metalId')
  getOne(@Param('metalId') metalId: string) {
    return this.inventoryService.getByMetalId(metalId);
  }
}
