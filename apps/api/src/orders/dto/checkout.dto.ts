import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

class ShippingAddressDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsString()
  line1!: string;

  // Optional in TypeScript AND at runtime. Without @IsOptional() the validator
  // required it despite the `?`, so any client that omitted line2 got a 400.
  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  postalCode!: string;

  @IsString()
  country!: string;
}

export class CheckoutBodyDto {
  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  /**
   * Promo code to apply. Optional. Re-validated server-side at checkout — the
   * cart screen's earlier quote is a preview, and trusting it would let a client
   * apply a code that expired between preview and purchase.
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
