import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuReadService } from './menu.read.service';
import { MenuService } from './menu.service';

@Module({
  controllers: [MenuController],
  providers: [MenuReadService, MenuService],
  exports: [MenuReadService, MenuService],
})
export class MenuModule {}
