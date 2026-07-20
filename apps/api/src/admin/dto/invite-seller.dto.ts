import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class InviteSellerDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  storeName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ default: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate!: number;
}
