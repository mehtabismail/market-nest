'use client';

import { useCallback, useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface AdminOrder {
  id: string;
  status: string;
  paymentMethod: string;
  total: string | number;
  createdAt: string;
  buyer: { fullName: string | null } | null;
  _count?: { items: number };
}

export function OrdersClient() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch<AdminOrder[]>('/admin/orders', { token });
      setOrders(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <TableSkeleton rows={8} cols={7} />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between mb-6">
        <h1 className="font-outfit text-2xl font-extrabold">All platform orders</h1>
        <button type="button" className="btn btn-purple btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Order</th>
              <th className="p-3 text-left">Buyer</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Payment</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-3 font-medium">{order.id.slice(0, 8)}</td>
                <td className="p-3 text-gray">{order.buyer?.fullName ?? 'Guest'}</td>
                <td className="p-3">{order._count?.items ?? 0}</td>
                <td className="p-3">${Number(order.total).toFixed(2)}</td>
                <td className="p-3">{order.paymentMethod}</td>
                <td className="p-3">{order.status}</td>
                <td className="p-3 text-xs text-gray">{new Date(order.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
