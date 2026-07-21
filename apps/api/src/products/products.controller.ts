import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQuery } from './dto/list-products.query';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get()
  listBuyer(@Query() query: ListProductsQuery) {
    return this.products.listForBuyer(query);
  }

  @Public()
  @Get(':id')
  getBuyer(@Param('id') id: string) {
    return this.products.getForBuyer(id);
  }
}

@ApiTags('seller-products')
@ApiBearerAuth()
@Roles('seller')
@Controller('seller/products')
export class SellerProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.products.listForSeller(user);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateProductDto) {
    return this.products.createForSeller(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.updateForSeller(user, id, dto);
  }

  @Delete(':id')
  archive(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.products.archiveForSeller(user, id);
  }

  @Get(':id/variants')
  listVariants(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.products.listVariantsForSeller(user, id);
  }

  @Post(':id/variants')
  createVariant(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.products.createVariantForSeller(user, id, dto);
  }

  @Patch(':id/variants/:variantId')
  updateVariant(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.products.updateVariantForSeller(user, id, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  deleteVariant(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ) {
    return this.products.deleteVariantForSeller(user, id, variantId);
  }
}
