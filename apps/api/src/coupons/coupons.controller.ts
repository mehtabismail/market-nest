import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CouponsService } from './coupons.service';

class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;
}

class CreateCouponDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['percentage', 'fixed'])
  type!: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSubtotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number | null;

  @IsOptional()
  @IsString()
  startsAt?: string | null;

  @IsOptional()
  @IsString()
  endsAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;
}

class UpdateCouponDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

@ApiTags('coupons')
@ApiBearerAuth()
@Controller()
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  /**
   * Previews a code against the buyer's subtotal.
   *
   * A POST rather than a GET despite being read-only: the code and subtotal are
   * cart state, and putting a promo code in a URL leaves it in logs and history.
   */
  @Roles('buyer', 'seller')
  @Post('coupons/validate')
  validate(@Body() dto: ValidateCouponDto) {
    return this.coupons.quote(dto.code, dto.subtotal);
  }

  /** Browseable promos for the Rewards screen — no auth required. */
  @Public()
  @Get('coupons')
  listPublic() {
    return this.coupons.listPublic();
  }

  @Roles('superadmin')
  @Get('admin/coupons')
  list() {
    return this.coupons.list();
  }

  @Roles('superadmin')
  @Post('admin/coupons')
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Roles('superadmin')
  @Patch('admin/coupons/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }

  @Roles('superadmin')
  @Delete('admin/coupons/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.coupons.remove(id);
  }
}
