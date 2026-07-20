'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ImageUpload } from '@/components/image-upload';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
}

type CategoryDrafts = Record<string, Partial<Category>>;

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [drafts, setDrafts] = useState<CategoryDrafts>({});
  const [createFormKey, setCreateFormKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Category[]>('/categories');
      setCategories(res);
      setDrafts({});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateDraft(id: string, patch: Partial<Category>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    try {
      await apiFetch('/categories', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: fd.get('name'),
          slug: fd.get('slug'),
          imageUrl: fd.get('imageUrl') || undefined,
          sortOrder: Number(fd.get('sortOrder') || 0),
        }),
      });
      form.reset();
      setCreateFormKey((k) => k + 1);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  }

  async function saveCategory(id: string) {
    if (!token) return;
    const patch = drafts[id];
    if (!patch) return;
    setError(null);
    try {
      await apiFetch(`/categories/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          name: patch.name,
          slug: patch.slug,
          imageUrl: patch.imageUrl || null,
        }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  }

  async function removeCategory(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/categories/${id}`, { method: 'DELETE', token });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  if (loading) {
    return (
      <main className="p-8 animate-fade-in">
        <TableSkeleton rows={8} cols={4} />
      </main>
    );
  }

  return (
    <main className="p-8 animate-fade-in">
      <h1 className="font-outfit text-2xl font-extrabold mb-6">Categories</h1>
      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <form onSubmit={handleCreate} className="card p-6 mb-6 max-w-3xl grid gap-3 md:grid-cols-2">
        <input className="input" name="name" placeholder="Category name" required />
        <input className="input" name="slug" placeholder="Slug" required />
        <ImageUpload key={createFormKey} token={token} name="imageUrl" label="Category image" className="md:col-span-2" />
        <input className="input" name="sortOrder" type="number" placeholder="Sort order" defaultValue={0} />
        <button type="submit" className="btn btn-purple md:col-span-2">
          Create category
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const draft = drafts[category.id] ?? {};
              const name = draft.name ?? category.name;
              const slug = draft.slug ?? category.slug;
              const imageUrl = draft.imageUrl ?? category.imageUrl ?? '';

              return (
                <tr key={category.id} className="border-t align-top">
                  <td className="p-3">
                    <input
                      className="input"
                      value={name}
                      onChange={(e) => updateDraft(category.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="input"
                      value={slug}
                      onChange={(e) => updateDraft(category.id, { slug: e.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="input"
                      value={imageUrl}
                      onChange={(e) => updateDraft(category.id, { imageUrl: e.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-purple btn-sm" onClick={() => saveCategory(category.id)}>
                        Save
                      </button>
                      <button type="button" className="btn btn-sm" onClick={() => removeCategory(category.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
