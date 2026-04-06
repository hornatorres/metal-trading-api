import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password: string;
}
