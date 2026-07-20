'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PaginationBar } from '@/components/pagination-bar';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

const PAGE_SIZE = 50;

interface ProductRow {
  id: string;
  title: string;
  price: string | number;
  status: string;
}

interface ProductListResponse {
  items: ProductRow[];
  total: number;
  page: number;
  limit: number;
}

interface FeaturedListingResponse {
  productId: string;
  product: {
    id: string;
    title: string;
    price: string | number;
    status: string;
  };
}

export default function AdminFeaturedPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFeatured = useCallback(async () => {
    if (!token) return;
    const featured = await apiFetch<FeaturedListingResponse[]>('/admin/featured', { token });
    setSelected(featured.map((item) => item.productId));
  }, [token]);

  const loadProducts = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch<ProductListResponse>(
        `/admin/products?page=${page}&limit=${PAGE_SIZE}`,
        { token },
      );
      setProducts(res.items);
      setTotal(res.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/admin/featured', {
        method: 'POST',
        token,
        body: JSON.stringify({ productIds: selected }),
      });
      await loadFeatured();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save featured products');
    } finally {
      setSaving(false);
    }
  }

  function toggleProduct(productId: string) {
    setSelected((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 8) {
        setError('Only 8 featured products are allowed');
        return prev;
      }
      setError(null);
      return [...prev, productId];
    });
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-outfit text-2xl font-extrabold">Featured products</h1>
          <p className="text-sm text-gray mt-1">
            Select up to 8 products shown on buyer home. Selected: {selected.length}/8
          </p>
        </div>
        <button type="button" className="btn btn-purple btn-sm" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save featured'}
        </button>
      </div>

      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Featured</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const checked = selected.includes(product.id);
              return (
                <tr key={product.id} className="border-t">
                  <td className="p-3">
                    <input type="checkbox" checked={checked} onChange={() => toggleProduct(product.id)} />
                  </td>
                  <td className="p-3 font-medium">{product.title}</td>
                  <td className="p-3">${Number(product.price).toFixed(2)}</td>
                  <td className="p-3">{product.status}</td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray">
                  No products available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
    </main>
  );
}
