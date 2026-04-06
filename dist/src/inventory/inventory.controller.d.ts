import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getAll(): Promise<{
        metalId: string;
        metal: {
            name: string;
            symbol: string;
        };
        totalStock: number;
        reservedStock: number;
        availableStock: number;
    }[]>;
    getOne(metalId: string): Promise<{
        metal: {
            symbol: string;
            id: string;
            name: string;
            unit: string;
            createdAt: Date;
        };
    } & {
        metalId: string;
        id: string;
        totalStock: import("@prisma/client/runtime/library").Decimal;
        reservedStock: import("@prisma/client/runtime/library").Decimal;
        availableStock: import("@prisma/client/runtime/library").Decimal;
        updatedAt: Date;
    }>;
}
