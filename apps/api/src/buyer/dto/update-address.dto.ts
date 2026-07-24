import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  label?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiPropertyOptional({ example: '+1 555-123-4567' })
  @IsOptional()
  @IsString()
  @MinLength(7)
  phone?: string;

  @ApiPropertyOptional({ example: '123 Market Street' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  line1?: string;

  @ApiPropertyOptional({ example: 'Apt 6B' })
  @IsOptional()
  @IsString()
  line2?: string | null;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  city?: string;

  @ApiPropertyOptional({ example: 'Punjab' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  state?: string;

  @ApiPropertyOptional({ example: '54000' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'PK' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  country?: string;
}
