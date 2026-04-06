// src/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Must be a valid email' })
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
