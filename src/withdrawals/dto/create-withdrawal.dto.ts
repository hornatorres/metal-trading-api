import { IsUUID, IsNumber, IsPositive, Max } from 'class-validator';

export class CreateWithdrawalDto {
  @IsUUID('4')
  userId: string;

  @IsUUID('4')
  metalId: string;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  @Max(5000)
  amountKg: number;
}
