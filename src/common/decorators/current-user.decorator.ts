// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Permite obtener el usuario autenticado en cualquier endpoint:
//   @Get('profile')
//   getProfile(@CurrentUser() user: CurrentUserType) { ... }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export interface CurrentUserType {
  userId: string;
  email:  string;
  status: string;
}
