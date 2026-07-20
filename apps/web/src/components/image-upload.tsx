'use client';

import { ChangeEvent, useState } from 'react';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';

interface UploadImageResponse {
  path: string;
  publicUrl: string;
}

interface ImageUploadProps {
  token: string | null;
  name: string;
  label?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}

export function ImageUpload({
  token,
  name,
  label = 'Image',
  defaultValue = '',
  required,
  className,
}: ImageUploadProps) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!token) {
      setError('Sign in is required before uploading images.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch<UploadImageResponse>('/upload/image', {
        method: 'POST',
        token,
        body: formData,
      });
      setUrl(res.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      event.target.value = '';
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <label className="text-xs uppercase tracking-wide text-gray">{label}</label>
      <input type="hidden" name={name} value={url} required={required} />
      <div className="mt-2 space-y-2">
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          disabled={uploading || !token}
        />
        <input
          className="input"
          value={url}
          placeholder="Uploaded image URL will appear here"
          onChange={(event) => setUrl(event.target.value)}
        />
      </div>
      {uploading && <p className="text-xs text-gray mt-2">Uploading image...</p>}
      {error && <p className="text-xs text-coral mt-2">{error}</p>}
      {url && (
        <div className="mt-3">
          <Image
            src={url}
            alt="Uploaded preview"
            width={96}
            height={96}
            className="h-24 w-24 rounded-md border border-border/50 object-cover"
          />
        </div>
      )}
    </div>
  );
}
