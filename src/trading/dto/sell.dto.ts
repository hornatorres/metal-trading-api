// src/trading/dto/sell.dto.ts  —  userId eliminado del body (viene del token JWT)
import { IsUUID, IsNumber, IsPositive, Max } from 'class-validator';

export class SellDto {
  // userId ya no se recibe del body — se inyecta desde el token en el controller
  userId?: string;

  @IsUUID('4', { message: 'metalId must be a valid UUID' })
  metalId: string;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive({ message: 'amountKg must be positive' })
  @Max(10000, { message: 'Max single sale is 10,000 kg' })
  amountKg: number;
}
