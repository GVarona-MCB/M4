import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Rol } from '@prisma/client';
import type { Usuario } from '@prisma/client';
import { UsersService, type PublicUser } from './users.service';
import { CreateUserDto, SetActiveDto, UpdateUserDto } from './dto/user.dto';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
@Roles(Rol.ADMIN)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll(): Promise<PublicUser[]> {
    return this.users.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.users.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: Usuario,
  ): Promise<PublicUser> {
    return this.users.update(id, dto, actor.id);
  }

  @Patch(':id/estado')
  setActive(
    @Param('id') id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() actor: Usuario,
  ): Promise<PublicUser> {
    return this.users.setActive(id, dto.activo, actor.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: Usuario): Promise<{ ok: true }> {
    return this.users.remove(id, actor.id);
  }
}
