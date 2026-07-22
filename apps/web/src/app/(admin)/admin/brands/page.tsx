'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export default function AdminBrandsPage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      // The admin list is unfiltered and carries product counts; the public
      // `/brands` hides empty and inactive brands, so it is the wrong source here.
      setBrands(await apiFetch<Brand[]>('/admin/brands', { token }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    try {
      await apiFetch('/admin/brands', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: fd.get('name'),
          slug: (fd.get('slug') as string) || undefined,
          logoUrl: (fd.get('logoUrl') as string) || undefined,
          sortOrder: Number(fd.get('sortOrder') || 0),
        }),
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brand');
    }
  }

  async function deactivate(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/brands/${id}`, { method: 'DELETE', token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate brand');
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
      <h1 className="font-outfit text-2xl font-extrabold mb-6">Brands</h1>
      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <form onSubmit={handleCreate} className="card p-6 mb-6 max-w-3xl grid gap-3 md:grid-cols-2">
        <input className="input" name="name" placeholder="Brand name" required />
        <input className="input" name="slug" placeholder="Slug (optional — derived from name)" />
        <input className="input" name="logoUrl" placeholder="Logo URL (optional)" />
        <input className="input" name="sortOrder" type="number" placeholder="Sort order" defaultValue={0} />
        <button type="submit" className="btn btn-purple md:col-span-2">
          Create brand
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-left">Products</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id} className="border-t border-gray-light">
                <td className="p-3 font-medium">{brand.name}</td>
                <td className="p-3 text-gray">{brand.slug}</td>
                <td className="p-3">{brand._count?.products ?? 0}</td>
                <td className="p-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      brand.isActive ? 'bg-teal/10 text-teal' : 'bg-gray-light text-gray'
                    }`}
                  >
                    {brand.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3">
                  {brand.isActive ? (
                    <button className="btn btn-outline text-coral" onClick={() => deactivate(brand.id)}>
                      Deactivate
                    </button>
                  ) : (
                    <span className="text-gray text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray" colSpan={5}>
                  No brands yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
