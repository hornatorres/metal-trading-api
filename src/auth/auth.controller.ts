// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService }                        from './auth.service';
import { LoginDto }                           from './dto/login.dto';
import { JwtAuthGuard }                       from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType }       from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Devuelve un JWT token válido por 24h.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * GET /api/v1/auth/profile
   * Requiere token. Devuelve el perfil del usuario autenticado.
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: CurrentUserType) {
    return this.authService.getProfile(user.userId);
  }
}
