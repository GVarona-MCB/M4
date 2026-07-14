import { Controller, Get, Post } from '@nestjs/common';
import { Rol } from '@prisma/client';
import type { RegistroDepuracion } from '@prisma/client';
import { PurgeService } from './purge.service';
import { Roles } from '../auth/roles.decorator';

@Controller('purge')
@Roles(Rol.ADMIN)
export class PurgeController {
  constructor(private readonly purge: PurgeService) {}

  // Ejecución manual de respaldo (FR-032).
  @Post()
  run(): Promise<RegistroDepuracion> {
    return this.purge.purge('MANUAL');
  }

  @Get('history')
  history(): Promise<RegistroDepuracion[]> {
    return this.purge.history();
  }
}
