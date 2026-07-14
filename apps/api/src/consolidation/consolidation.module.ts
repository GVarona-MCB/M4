import { Module } from '@nestjs/common';
import { ConsolidationController } from './consolidation.controller';
import { ConsolidationService } from './consolidation.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [ConsolidationController],
  providers: [ConsolidationService],
  exports: [ConsolidationService],
})
export class ConsolidationModule {}
