import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuReadService } from './menu.read.service';

@Module({
  controllers: [MenuController],
  providers: [MenuReadService],
  exports: [MenuReadService],
})
export class MenuModule {}
