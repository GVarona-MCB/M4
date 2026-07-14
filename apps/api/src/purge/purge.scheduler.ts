import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PurgeService } from './purge.service';

const APP_TZ = process.env.APP_TIMEZONE ?? 'America/Argentina/Buenos_Aires';

@Injectable()
export class PurgeScheduler {
  constructor(private readonly purge: PurgeService) {}

  // Todos los días a las 15:00 GMT-3 (FR-029, RNF-06).
  @Cron('0 0 15 * * *', { timeZone: APP_TZ })
  async handleDailyPurge(): Promise<void> {
    await this.purge.purge('AUTOMATICA');
  }
}
