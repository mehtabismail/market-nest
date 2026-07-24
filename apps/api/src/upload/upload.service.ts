import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../auth/supabase.service';
import type { RequestUser } from '../auth/auth.types';
import type { UploadBase64Dto } from './dto/upload-base64.dto';

// Supabase Storage bucket "marketnest" must exist (see storage bucket migration).
const BUCKET_NAME = 'marketnest';
const MAX_BYTES = 5 * 1024 * 1024;

interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Injectable()
export class UploadService {
  constructor(private readonly supabase: SupabaseService) {}

  async uploadImage(file: UploadedImageFile, user: RequestUser) {
    if (!file?.buffer) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }

    if (file.buffer.byteLength > MAX_BYTES) {
      throw new BadRequestException('Image must be 5MB or smaller');
    }

    return this.store(file, user);
  }

  /**
   * Mobile-friendly path: JSON body with base64 bytes.
   *
   * RN multipart FormData routinely fails with "Network request failed" even
   * when JSON calls to the same host succeed — base64 avoids that entirely.
   */
  async uploadBase64(dto: UploadBase64Dto, user: RequestUser) {
    const raw = dto.data.includes(',') ? dto.data.split(',').pop()! : dto.data;
    let buffer: Buffer;
    try {
      buffer = Buffer.from(raw, 'base64');
    } catch {
      throw new BadRequestException('Invalid image data');
    }

    if (!buffer.byteLength) {
      throw new BadRequestException('Image file is required');
    }
    if (buffer.byteLength > MAX_BYTES) {
      throw new BadRequestException('Image must be 5MB or smaller');
    }

    const mimetype = dto.mimeType?.startsWith('image/') ? dto.mimeType : 'image/jpeg';
    const originalname = dto.fileName?.trim() || `upload-${Date.now()}.jpg`;

    return this.store({ buffer, mimetype, originalname }, user);
  }

  private async store(file: UploadedImageFile, user: RequestUser) {
    const extension = this.resolveExtension(file);
    const path = `images/${user.role}/${user.id}/${Date.now()}-${randomUUID()}.${extension}`;

    const { error } = await this.supabase
      .getClient()
      .storage.from(BUCKET_NAME)
      .upload(path, file.buffer, {
        cacheControl: '3600',
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data } = this.supabase.getClient().storage.from(BUCKET_NAME).getPublicUrl(path);

    return {
      path,
      publicUrl: data.publicUrl,
    };
  }

  private resolveExtension(file: UploadedImageFile) {
    const fromName = file.originalname.split('.').pop()?.toLowerCase().trim();
    if (fromName && fromName.length <= 8 && fromName !== 'jpeg') {
      return fromName === 'jpg' ? 'jpg' : fromName;
    }
    if (fromName === 'jpeg') return 'jpg';

    const mimeExt = file.mimetype.split('/')[1]?.toLowerCase().trim();
    if (mimeExt === 'jpeg') return 'jpg';
    return mimeExt || 'jpg';
  }
}
