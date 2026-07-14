import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Rol } from '@prisma/client';
import type { OpcionPlato } from '@prisma/client';
import { MenuReadService, type MenuProviderGroup } from './menu.read.service';
import { MenuService } from './menu.service';
import { CreateMenuOptionDto, UpdateMenuOptionDto } from './dto/menu-option.dto';
import { Roles } from '../auth/roles.decorator';
import { businessDayDate } from '../common/time/tz.util';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuRead: MenuReadService,
    private readonly menu: MenuService,
  ) {}

  // Cualquier usuario autenticado ve el menú del día (FR-013).
  @Get()
  getMenu(@Query('fecha') fecha?: string): Promise<MenuProviderGroup[]> {
    const day = fecha ? new Date(`${fecha}T00:00:00.000Z`) : businessDayDate();
    return this.menuRead.getMenuByDay(day);
  }

  // Gestión del menú: solo Secretaría (FR-010..FR-013).
  @Post('options')
  @Roles(Rol.SECRETARIA)
  createOption(@Body() dto: CreateMenuOptionDto): Promise<OpcionPlato> {
    return this.menu.createOption(dto);
  }

  @Patch('options/:id')
  @Roles(Rol.SECRETARIA)
  updateOption(@Param('id') id: string, @Body() dto: UpdateMenuOptionDto): Promise<OpcionPlato> {
    return this.menu.updateOption(id, dto);
  }

  @Delete('options/:id')
  @Roles(Rol.SECRETARIA)
  deleteOption(@Param('id') id: string): Promise<{ ok: true }> {
    return this.menu.deleteOption(id);
  }
}
