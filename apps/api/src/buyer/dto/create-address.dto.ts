import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @MinLength(2)
  label!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: '+1 555-123-4567' })
  @IsString()
  @MinLength(7)
  phone!: string;

  @ApiProperty({ example: '123 Market Street' })
  @IsString()
  @MinLength(3)
  line1!: string;

  @ApiPropertyOptional({ example: 'Apt 6B' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'Lahore' })
  @IsString()
  @MinLength(2)
  city!: string;

  @ApiProperty({ example: 'Punjab' })
  @IsString()
  @MinLength(2)
  state!: string;

  @ApiProperty({ example: '54000' })
  @IsString()
  @MinLength(3)
  postalCode!: string;

  @ApiProperty({ example: 'PK' })
  @IsString()
  @MinLength(2)
  country!: string;
}
