import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Rol } from '@prisma/client';
import type { Proveedor } from '@prisma/client';
import { ProvidersService } from './providers.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  // Lectura: Administrador y Secretaría (FR-009).
  @Get()
  @Roles(Rol.ADMIN, Rol.SECRETARIA)
  findAll(): Promise<Proveedor[]> {
    return this.providers.findAll();
  }

  // Gestión: solo Administrador. La cantidad de proveedores la determina el Administrador.
  @Post()
  @Roles(Rol.ADMIN)
  create(@Body() dto: CreateProviderDto): Promise<Proveedor> {
    return this.providers.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProviderDto): Promise<Proveedor> {
    return this.providers.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  remove(@Param('id') id: string): Promise<{ ok: true }> {
    return this.providers.remove(id);
  }
}
