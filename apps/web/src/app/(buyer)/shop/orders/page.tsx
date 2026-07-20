'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth/auth-modal';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import type { OrderSummaryDTO } from '@marketnest/shared-types';

export default function BuyerOrdersPage() {
  const { token, loading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch<OrderSummaryDTO[]>('/orders', { token })
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  if (authLoading || (isAuthenticated && loading)) {
    return (
      <main className="p-6 max-w-4xl mx-auto w-full space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="p-6 max-w-4xl mx-auto w-full">
        <AuthGate
          title="Sign in to view orders"
          message="Track deliveries, order status, and purchase history."
          loginHref="/shop/login?next=/shop/orders"
          signupHref="/shop/signup"
        />
      </main>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto w-full animate-fade-in">
      <h1 className="brand-text text-2xl mb-2">Your orders</h1>
      <p className="text-sm text-gray mb-6">Track current and past purchases in one place.</p>

      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      {orders.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray mb-4">No orders yet.</p>
          <Link href="/shop" className="btn btn-blue btn-sm">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/shop/orders/${order.id}`}
              className="card p-4 block hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="font-mono text-xs text-gray">#{order.id.slice(0, 8)}</p>
                <span className="badge bg-blue-light text-blue">{order.status.replaceAll('_', ' ')}</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-dark">
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span>{order.itemCount} items</span>
                <span className="font-semibold">${order.total.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
