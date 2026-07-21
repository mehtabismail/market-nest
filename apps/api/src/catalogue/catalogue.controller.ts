import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BannersService } from './banners.service';

@ApiTags('catalogue')
@Controller()
export class CatalogueController {
  constructor(private readonly banners: BannersService) {}

  @Public()
  @Get('banners')
  listBanners() {
    return this.banners.listActive();
  }

  @Public()
  @Get('featured')
  listFeatured() {
    return this.banners.listFeatured();
  }

  @ApiBearerAuth()
  @Roles('superadmin')
  @Get('admin/banners')
  adminListBanners() {
    return this.banners.listAll();
  }

  @ApiBearerAuth()
  @Roles('superadmin')
  @Post('admin/banners')
  createBanner(@Body() body: Record<string, unknown>) {
    return this.banners.create(body as Parameters<BannersService['create']>[0]);
  }

  @ApiBearerAuth()
  @Roles('superadmin')
  @Patch('admin/banners/:id')
  updateBanner(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.banners.update(id, body as Parameters<BannersService['update']>[1]);
  }

  @ApiBearerAuth()
  @Roles('superadmin')
  @Delete('admin/banners/:id')
  deleteBanner(@Param('id') id: string) {
    return this.banners.remove(id);
  }

  @ApiBearerAuth()
  @Roles('superadmin')
  @Get('admin/featured')
  adminListFeatured() {
    return this.banners.listFeatured();
  }

  @ApiBearerAuth()
  @Roles('superadmin')
  @Post('admin/featured')
  setFeatured(@Body() body: { productIds: string[] }) {
    return this.banners.setFeatured(body.productIds);
  }
}
