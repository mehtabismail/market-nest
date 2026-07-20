'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import type { OrderDetailDTO } from '@marketnest/shared-types/buyer';

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelState, setCancelState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { token } = useAuth();

  const loadOrder = useCallback(async (silent = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const nextOrder = await apiFetch<OrderDetailDTO>(`/orders/${params.id}`, { token });
      setOrder(nextOrder);
    } catch (e) {
      setOrder(null);
      setError(e instanceof Error ? e.message : 'Failed to load order');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [params.id, token]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!token) return;
    const intervalId = window.setInterval(() => {
      void loadOrder(true);
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [loadOrder, token]);

  const timeline = useMemo(() => {
    const stages = ['pending_payment', 'pending_cod', 'confirmed', 'shipped', 'delivered'];
    const status = order?.status ?? '';
    const activeIndex = Math.max(stages.indexOf(status), 0);

    return stages.map((step, index) => ({
      label: step.replaceAll('_', ' '),
      done: index <= activeIndex || status === 'cancelled',
    }));
  }, [order?.status]);

  async function cancelOrder() {
    if (!token) return;
    setCancelState('loading');

    try {
      await apiFetch(`/orders/${params.id}/cancel`, { method: 'POST', token });
      setCancelState('success');
      await loadOrder();
    } catch (e) {
      setCancelState('error');
    }
  }

  if (!token) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <p className="text-sm">
          <Link href="/shop/login" className="text-blue font-semibold">
            Sign in
          </Link>{' '}
          to view this order.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <p className="text-sm text-gray">Loading order...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <p className="text-sm text-coral">{error ?? 'Order not found'}</p>
      </main>
    );
  }

  const canCancel = !['cancelled', 'delivered', 'shipped'].includes(order.status);

  return (
    <main className="p-6 max-w-2xl mx-auto w-full">
      <div className="card p-8">
        <h1 className="brand-text text-2xl text-teal mb-2">Order details</h1>
        <p className="text-sm text-gray mb-6">Order #{order.id.slice(0, 8)}</p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6 text-xs text-gray">
          <div className="card p-3">
            <p className="uppercase tracking-wide text-[10px] mb-1">Placed</p>
            <p className="text-sm text-gray-dark">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="card p-3">
            <p className="uppercase tracking-wide text-[10px] mb-1">Payment</p>
            <p className="text-sm text-gray-dark">{order.paymentMethod.toUpperCase()}</p>
          </div>
        </div>

        <h2 className="font-semibold text-sm mb-2">Status timeline</h2>
        <ol className="mb-6 space-y-2">
          {timeline.map((step) => (
            <li key={step.label} className="flex items-center gap-2 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${step.done ? 'bg-teal' : 'bg-border'}`}
                aria-hidden
              />
              <span className={step.done ? 'text-gray-dark' : 'text-gray'}>{step.label}</span>
            </li>
          ))}
        </ol>

        <div className="space-y-2 text-sm mb-6">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between">
              <span>
                {i.title} x {i.quantity}
                {i.isMarketNestOfficial && (
                  <span className="badge badge-official ml-2">Official</span>
                )}
              </span>
              <span>${(i.unitPrice * i.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="font-bold text-lg border-t pt-4">Total: ${order.total.toFixed(2)}</div>
        <p className="text-xs text-gray mt-2">Status: {order.status}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/shop/orders" className="btn btn-outline">
            Back to orders
          </Link>
          <Link href="/shop" className="btn btn-blue">
            Continue shopping
          </Link>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!canCancel || cancelState === 'loading'}
            onClick={cancelOrder}
          >
            {cancelState === 'loading' ? 'Cancelling...' : 'Cancel order'}
          </button>
        </div>
        {cancelState === 'success' && (
          <p className="text-xs text-teal mt-3">Order cancellation requested successfully.</p>
        )}
        {cancelState === 'error' && (
          <p className="text-xs text-coral mt-3">Could not cancel this order right now.</p>
        )}
      </div>
    </main>
  );
}
