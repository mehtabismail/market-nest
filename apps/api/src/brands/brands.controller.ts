import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BrandsService } from './brands.service';

class CreateBrandDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class UpdateBrandDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@ApiTags('brands')
@Controller()
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Public()
  @Get('brands')
  listPublic() {
    return this.brands.listPublic();
  }

  @Roles('superadmin')
  @Get('admin/brands')
  listAll() {
    return this.brands.listAll();
  }

  @Roles('superadmin')
  @Post('admin/brands')
  create(@Body() dto: CreateBrandDto) {
    return this.brands.create(dto);
  }

  @Roles('superadmin')
  @Patch('admin/brands/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto) {
    return this.brands.update(id, dto);
  }

  @Roles('superadmin')
  @Delete('admin/brands/:id')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.brands.deactivate(id);
  }
}
