import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Rol } from '@prisma/client';
import {
  ConsolidationService,
  type ConsolidationGroup,
  type SendResult,
} from './consolidation.service';
import { SendDto } from './dto/send.dto';
import { Roles } from '../auth/roles.decorator';
import { businessDayDate } from '../common/time/tz.util';

@Controller('consolidation')
@Roles(Rol.SECRETARIA)
export class ConsolidationController {
  constructor(private readonly consolidation: ConsolidationService) {}

  @Get()
  getConsolidation(@Query('fecha') fecha?: string): Promise<ConsolidationGroup[]> {
    const day = fecha ? new Date(`${fecha}T00:00:00.000Z`) : businessDayDate();
    return this.consolidation.getConsolidation(day);
  }

  @Post('send')
  send(@Body() dto: SendDto): Promise<SendResult> {
    return this.consolidation.send(dto.proveedorId);
  }
}
