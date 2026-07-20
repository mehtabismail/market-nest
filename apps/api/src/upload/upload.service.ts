import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../auth/supabase.service';
import type { RequestUser } from '../auth/auth.types';

// Supabase Storage bucket "marketnest" must exist (see storage bucket migration).
const BUCKET_NAME = 'marketnest';
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
    if (fromName && fromName.length <= 8) {
      return fromName;
    }

    const mimeExt = file.mimetype.split('/')[1]?.toLowerCase().trim();
    return mimeExt || 'jpg';
  }
}
