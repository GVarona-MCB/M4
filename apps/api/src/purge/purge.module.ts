import { Module } from '@nestjs/common';
import { PurgeService } from './purge.service';
import { PurgeScheduler } from './purge.scheduler';
import { PurgeController } from './purge.controller';

@Module({
  controllers: [PurgeController],
  providers: [PurgeService, PurgeScheduler],
  exports: [PurgeService],
})
export class PurgeModule {}
