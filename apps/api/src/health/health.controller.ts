import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

// Liveness/health para medir disponibilidad (SC-005). Público, sin datos sensibles.
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health(): { status: string; ts: string } {
    return { status: 'ok', ts: new Date().toISOString() };
  }
}
