'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ImageUpload } from '@/components/image-upload';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

type BannerDrafts = Record<string, Partial<Banner>>;

export default function AdminBannersPage() {
  const { token } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [drafts, setDrafts] = useState<BannerDrafts>({});
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch<Banner[]>('/admin/banners', { token });
      setBanners(res);
      setDrafts({});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function updateDraft(id: string, patch: Partial<Banner>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    try {
      await apiFetch('/admin/banners', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: fd.get('title') || null,
          imageUrl: fd.get('imageUrl'),
          linkUrl: fd.get('linkUrl') || null,
          sortOrder: Number(fd.get('sortOrder') || 0),
        }),
      });
      form.reset();
      setCreateFormKey((k) => k + 1);
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create banner');
    }
  }

  async function saveBanner(id: string) {
    if (!token) return;
    const patch = drafts[id];
    if (!patch) return;
    setError(null);
    try {
      await apiFetch(`/admin/banners/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(patch),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update banner');
    }
  }

  async function removeBanner(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/banners/${id}`, {
        method: 'DELETE',
        token,
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete banner');
    }
  }

  if (loading) {
    return (
      <main className="p-8 animate-fade-in">
        <TableSkeleton rows={8} cols={6} />
      </main>
    );
  }

  return (
    <main className="p-8 animate-fade-in">
      <div className="flex justify-between mb-6">
        <h1 className="font-outfit text-2xl font-extrabold">Banners</h1>
        <button type="button" className="btn btn-purple btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Close' : '+ New banner'}
        </button>
      </div>

      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      {showCreate && (
        <form onSubmit={handleCreate} className="card p-6 mb-6 max-w-2xl grid gap-3 md:grid-cols-2">
          <input className="input" name="title" placeholder="Title (optional)" />
          <input className="input" name="sortOrder" type="number" placeholder="Sort order" defaultValue={0} />
          <ImageUpload key={createFormKey} token={token} name="imageUrl" label="Banner image" required className="md:col-span-2" />
          <input className="input md:col-span-2" name="linkUrl" placeholder="Link URL (optional)" />
          <button type="submit" className="btn btn-purple md:col-span-2">
            Create banner
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Image URL</th>
              <th className="p-3 text-left">Link URL</th>
              <th className="p-3 text-left">Order</th>
              <th className="p-3 text-left">Active</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => {
              const draft = drafts[banner.id] ?? {};
              const title = draft.title ?? banner.title ?? '';
              const imageUrl = draft.imageUrl ?? banner.imageUrl;
              const linkUrl = draft.linkUrl ?? banner.linkUrl ?? '';
              const sortOrder = Number(draft.sortOrder ?? banner.sortOrder);
              const isActive = Boolean(draft.isActive ?? banner.isActive);

              return (
                <tr key={banner.id} className="border-t align-top">
                  <td className="p-3">
                    <input
                      className="input"
                      value={title}
                      onChange={(e) => updateDraft(banner.id, { title: e.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="input"
                      value={imageUrl}
                      onChange={(e) => updateDraft(banner.id, { imageUrl: e.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="input"
                      value={linkUrl}
                      onChange={(e) => updateDraft(banner.id, { linkUrl: e.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="input"
                      type="number"
                      value={sortOrder}
                      onChange={(e) => updateDraft(banner.id, { sortOrder: Number(e.target.value) })}
                    />
                  </td>
                  <td className="p-3">
                    <label className="text-xs text-gray flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => updateDraft(banner.id, { isActive: e.target.checked })}
                      />
                      Active
                    </label>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-purple btn-sm" onClick={() => saveBanner(banner.id)}>
                        Save
                      </button>
                      <button type="button" className="btn btn-sm" onClick={() => removeBanner(banner.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {banners.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray">
                  No banners yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
