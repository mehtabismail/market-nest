'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ImageUpload } from '@/components/image-upload';
import { PaginationBar } from '@/components/pagination-bar';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

const PAGE_SIZE = 20;

type OwnerType = 'platform_owned' | 'seller_assigned' | 'seller_owned';

interface ProductRow {
  id: string;
  title: string;
  price: string | number;
  stockQty: number;
  status: string;
  ownerType: OwnerType;
  seller: { id: string; storeName: string } | null;
  category: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductListResponse {
  items: ProductRow[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [ownerType, setOwnerType] = useState<OwnerType>('platform_owned');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [productRes, categoryRes] = await Promise.all([
        apiFetch<ProductListResponse>(`/admin/products?page=${page}&limit=${PAGE_SIZE}`, { token }),
        apiFetch<Category[]>('/categories'),
      ]);
      setProducts(productRes.items);
      setTotal(productRes.total);
      setCategories(categoryRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const nextOwnerType = String(fd.get('ownerType')) as OwnerType;
    const imageUrl = String(fd.get('imageUrl') ?? '').trim();
    setError(null);
    try {
      await apiFetch('/admin/products', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: fd.get('title'),
          description: fd.get('description'),
          categoryId: fd.get('categoryId') || undefined,
          price: Number(fd.get('price')),
          stockQty: Number(fd.get('stockQty') || 0),
          sku: fd.get('sku') || undefined,
          status: 'published',
          ownerType: nextOwnerType,
          sellerId: fd.get('sellerId') || undefined,
          images: imageUrl ? [imageUrl] : [],
        }),
      });
      form.reset();
      setCreateFormKey((k) => k + 1);
      setOwnerType('platform_owned');
      setShowCreate(false);
      setPage(1);
      if (page === 1) {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  }

  if (loading) {
    return (
      <main className="p-8 animate-fade-in">
        <TableSkeleton rows={8} cols={7} />
      </main>
    );
  }

  return (
    <main className="p-8 animate-fade-in">
      <div className="flex justify-between mb-6">
        <h1 className="font-outfit text-2xl font-extrabold">Products</h1>
        <button type="button" className="btn btn-purple btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Close' : '+ Add product'}
        </button>
      </div>

      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      {showCreate && (
        <form onSubmit={handleCreate} className="card p-6 mb-6 grid gap-3 md:grid-cols-2">
          <input className="input" name="title" placeholder="Title" required />
          <input className="input" name="price" type="number" step="0.01" placeholder="Price" required />
          <textarea className="input md:col-span-2" name="description" placeholder="Description" rows={3} />
          <ImageUpload key={createFormKey} token={token} name="imageUrl" label="Product image" className="md:col-span-2" />
          <input className="input" name="stockQty" type="number" placeholder="Stock" defaultValue={0} />
          <input className="input" name="sku" placeholder="SKU" />
          <select className="input" name="categoryId" defaultValue="">
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            name="ownerType"
            value={ownerType}
            onChange={(e) => setOwnerType(e.target.value as OwnerType)}
          >
            <option value="platform_owned">platform_owned</option>
            <option value="seller_assigned">seller_assigned</option>
            <option value="seller_owned">seller_owned</option>
          </select>
          {(ownerType === 'seller_assigned' || ownerType === 'seller_owned') && (
            <input className="input md:col-span-2" name="sellerId" placeholder="Seller ID (required)" required />
          )}
          <button type="submit" className="btn btn-purple md:col-span-2">
            Create product
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Owner</th>
              <th className="p-3 text-left">Seller</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-3 font-medium">{product.title}</td>
                <td className="p-3 text-gray">{product.category?.name ?? '—'}</td>
                <td className="p-3">{product.ownerType}</td>
                <td className="p-3 text-gray">{product.seller?.storeName ?? '—'}</td>
                <td className="p-3">${Number(product.price).toFixed(2)}</td>
                <td className="p-3">{product.stockQty}</td>
                <td className="p-3">{product.status}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray">
                  No products found.
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
