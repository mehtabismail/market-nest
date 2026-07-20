import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum AuthPortal {
  buyer = 'buyer',
  seller = 'seller',
  admin = 'admin',
}

export class LoginDto {
  @ApiProperty({ example: 'admin@marketnest.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: AuthPortal, description: 'Restrict login to a specific portal role' })
  @IsOptional()
  @IsEnum(AuthPortal)
  portal?: AuthPortal;
}
