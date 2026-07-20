'use client';

import { useCallback, useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface FulfilmentItem {
  id: string;
  orderId: string;
  quantity: number;
  status: string;
  trackingNumber: string | null;
  courierName: string | null;
  createdAt: string;
  product: { title: string; sku: string | null } | null;
  order: { status: string } | null;
}

export default function AdminFulfilmentPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<FulfilmentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch<FulfilmentItem[]>('/admin/fulfilment', { token });
      setItems(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fulfilment queue');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

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
        <h1 className="font-outfit text-2xl font-extrabold">Platform fulfilment queue</h1>
        <button type="button" className="btn btn-purple btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Order</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Tracking</th>
              <th className="p-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3 font-medium">{item.product?.title ?? 'Untitled product'}</td>
                <td className="p-3 text-gray">{item.orderId.slice(0, 8)}</td>
                <td className="p-3 text-gray">{item.product?.sku ?? '—'}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{item.status}</td>
                <td className="p-3 text-xs">
                  {item.courierName || item.trackingNumber
                    ? `${item.courierName ?? ''} ${item.trackingNumber ?? ''}`.trim()
                    : 'Pending'}
                </td>
                <td className="p-3 text-xs text-gray">{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray">
                  No platform-owned items in queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
