import { Controller, Get, Query } from '@nestjs/common';
import { MenuReadService, type MenuProviderGroup } from './menu.read.service';
import { businessDayDate } from '../common/time/tz.util';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuRead: MenuReadService) {}

  // Cualquier usuario autenticado ve el menú del día (FR-013).
  @Get()
  async getMenu(@Query('fecha') fecha?: string): Promise<MenuProviderGroup[]> {
    const day = fecha ? new Date(`${fecha}T00:00:00.000Z`) : businessDayDate();
    return this.menuRead.getMenuByDay(day);
  }
}
