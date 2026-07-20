import { Module } from '@nestjs/common';
import { CatalogueController } from './catalogue.controller';
import { BannersService } from './banners.service';

@Module({
  controllers: [CatalogueController],
  providers: [BannersService],
  exports: [BannersService],
})
export class CatalogueModule {}
