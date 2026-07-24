import {
  BadRequestException,
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { RequestUser } from '../auth/auth.types';
import { UploadService } from './upload.service';
import { UploadBase64Dto } from './dto/upload-base64.dto';

interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@ApiTags('upload')
@ApiBearerAuth()
// Buyers need this during KYC onboarding; sellers for listing photos.
@Roles('buyer', 'seller', 'superadmin')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Multipart upload — fine for web. React Native's FormData + fetch often
   * fails with a bare "Network request failed", so mobile uses `image-base64`.
   */
  @Post('image')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: UploadedImageFile, @CurrentUser() user: RequestUser) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.uploadService.uploadImage(file, user);
  }

  /** JSON base64 upload — the path mobile uses (avoids RN multipart bugs). */
  @Post('image-base64')
  uploadImageBase64(@Body() dto: UploadBase64Dto, @CurrentUser() user: RequestUser) {
    return this.uploadService.uploadBase64(dto, user);
  }
}
