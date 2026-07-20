'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, PackagePlus } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface SellerProduct {
  id: string;
  title: string;
  sku: string | null;
  price: string | number;
  stockQty: number;
  status: string;
}

export default function SellerInventoryPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch<SellerProduct[]>('/seller/products', { token })
      .then((rows) => setProducts(rows.filter((row) => row.stockQty < 10)))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load inventory'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <main className="animate-fade-in space-y-6 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="brand-text text-2xl text-teal-dark">Low stock inventory</h1>
          <p className="text-sm text-gray">Products that need replenishment soon (stock less than 10).</p>
        </div>
        <Link href="/seller/products" className="btn btn-outline inline-flex items-center gap-2">
          <PackagePlus className="h-4 w-4" />
          Manage products
        </Link>
      </div>

      {loading && <TableSkeleton rows={5} cols={5} />}
      {error && <p className="text-sm text-coral">{error}</p>}

      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 border border-dashed border-teal-light p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-teal" />
              <p className="font-semibold text-teal-dark">No low-stock products</p>
              <p className="text-sm text-gray">Inventory levels are healthy across your listings.</p>
            </div>
          ) : (
            <div className="card overflow-hidden border border-teal-light/40">
              <table className="w-full text-sm">
                <thead className="bg-teal-light/40 text-left text-[11px] uppercase text-gray">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-border/40">
                      <td className="p-3 font-medium">{product.title}</td>
                      <td className="p-3">{product.sku ?? '-'}</td>
                      <td className="p-3">${Number(product.price).toFixed(2)}</td>
                      <td className="p-3 font-semibold text-coral">{product.stockQty}</td>
                      <td className="p-3 capitalize">{product.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
