import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UploadBase64Dto {
  @ApiProperty({ description: 'Raw base64 image bytes (no data: URL prefix)' })
  @IsString()
  @MinLength(8)
  data!: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 'id-front.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;
}
