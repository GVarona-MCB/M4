import { Controller, Get } from '@nestjs/common';
import { Rol } from '@prisma/client';
import type { Proveedor } from '@prisma/client';
import { ProvidersService } from './providers.service';
import { Roles } from '../auth/roles.decorator';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  // Lectura: Administrador y Secretaría (FR-009). La gestión (CRUD) se agrega en US6.
  @Get()
  @Roles(Rol.ADMIN, Rol.SECRETARIA)
  findAll(): Promise<Proveedor[]> {
    return this.providers.findAll();
  }
}
