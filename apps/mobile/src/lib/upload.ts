import * as ImagePicker from 'expo-image-picker';
import { api } from './api';

export interface UploadedImage {
  path: string;
  publicUrl: string;
}

type UploadResponse = UploadedImage;

/**
 * Picks one image from the library and uploads it.
 *
 * Uses base64 JSON (`POST /upload/image-base64`) instead of multipart FormData.
 * RN's FormData + fetch path fails with a bare "Network request failed" on this
 * stack even when every other JSON call to the same API works — that surfaces
 * as "Could not reach the server" on KYC and product photos.
 *
 * Returns `null` when the user cancels.
 */
export async function pickAndUploadImage(): Promise<UploadedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo access is needed to add an image. Enable it in Settings.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    // Keep payloads small — base64 is ~33% larger than binary, and the API
    // rejects anything over 5MB decoded.
    quality: 0.7,
    allowsEditing: true,
    base64: true,
  });

  if (result.canceled || result.assets.length === 0) return null;

  return uploadAsset(result.assets[0]);
}

/** Uploads an already-picked asset (must include `base64` when using this path). */
export async function uploadAsset(asset: ImagePicker.ImagePickerAsset): Promise<UploadedImage> {
  const base64 = asset.base64;
  if (!base64) {
    throw new Error('Could not read that image. Please try another photo.');
  }

  const mimeType = asset.mimeType?.startsWith('image/') ? asset.mimeType : 'image/jpeg';
  const fileName = normalizeFileName(asset.fileName, asset.uri, mimeType);

  // Approximate decoded size: 3 bytes per 4 base64 chars.
  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > 5 * 1024 * 1024) {
    throw new Error('Image must be 5MB or smaller. Try a clearer, smaller photo.');
  }

  return api.request<UploadResponse>('/upload/image-base64', {
    method: 'POST',
    body: JSON.stringify({
      data: base64,
      mimeType,
      fileName,
    }),
  });
}

function normalizeFileName(
  fileName: string | null | undefined,
  uri: string,
  mimeType: string,
): string {
  const fromName = fileName?.trim();
  if (fromName && /\.[a-z0-9]+$/i.test(fromName)) return fromName;

  const fromUri = uri.split('?')[0]?.split('/').pop();
  if (fromUri && /\.(jpe?g|png|webp|heic|gif)$/i.test(fromUri)) return fromUri;

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return `upload-${Date.now()}.${ext}`;
}
