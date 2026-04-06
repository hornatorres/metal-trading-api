import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /api/v1/users
   * Creates a new user with a USD wallet (balance = 0)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * GET /api/v1/users/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
