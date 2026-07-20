'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ClipboardList,
  Clock,
  ExternalLink,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

interface SellerOrderGroup {
  orderId: string;
  status: string;
  buyerName: string | null;
  items: { id: string; title: string; quantity: number; status: string }[];
  sellerTotal: number;
}

function StatusBadge({ status }: { status: string }) {
  const isPending = status === 'pending' || status === 'processing';
  const isShipped = status === 'shipped';
  const isDelivered = status === 'delivered';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        isPending
          ? 'bg-amber/15 text-amber'
          : isShipped
          ? 'bg-blue-100 text-blue-600'
          : isDelivered
          ? 'bg-mn-teal-soft text-mn-teal'
          : 'bg-gray-light text-mn-mid'
      }`}
    >
      {isPending && <span className="h-1.5 w-1.5 rounded-full bg-amber" />}
      {status}
    </span>
  );
}

function OrderCard({
  order,
  onMarkShipped,
}: {
  order: SellerOrderGroup;
  onMarkShipped: (itemId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card overflow-hidden rounded-xl border border-mn-teal/20 bg-gradient-to-br from-white to-mn-teal-soft/20 transition-shadow hover:shadow-lg">
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded bg-gray-light/50 px-2 py-1 font-mono text-xs text-mn-mid">
              #{order.orderId.slice(0, 8)}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-1.5 transition-colors hover:bg-mn-teal-soft"
          >
            <span className={`inline-block transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-4 w-4 text-mn-mid" />
            </span>
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-mn-ink">
            <span className="text-mn-mid">Buyer:</span> {order.buyerName ?? 'Guest buyer'}
          </p>
          <p className="text-lg font-bold text-mn-teal">${order.sellerTotal.toFixed(2)}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-mn-mid">
            <PackageCheck className="h-3.5 w-3.5" />
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </div>
          <Link
            href={`/seller/orders/${order.orderId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-mn-teal transition-colors hover:text-mn-teal/80"
          >
            <ExternalLink className="h-3 w-3" />
            View details
          </Link>
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-hidden border-t border-mn-teal/20 bg-mn-teal-soft/20">
          <div className="space-y-3 p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-mn-mid">
              Order Items
            </h4>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mn-teal-soft/50">
                    <PackageCheck className="h-4 w-4 text-mn-teal" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-mn-ink">{item.title}</p>
                    <p className="text-xs text-mn-mid">Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} />
                  {item.status !== 'shipped' && item.status !== 'delivered' && (
                    <button
                      type="button"
                      className="btn btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                      onClick={() => onMarkShipped(item.id)}
                    >
                      <Truck className="h-3 w-3" />
                      Ship
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SellerOrdersClient() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<SellerOrderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await apiFetch<SellerOrderGroup[]>('/seller/orders', { token });
        setOrders(data);
        setError(null);
      } catch (e) {
        setOrders([]);
        setError(e instanceof Error ? e.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [token]);

  async function markShipped(itemId: string) {
    if (!token) return;
    const tracking = prompt('Tracking number?');
    const courier = prompt('Courier name?');
    if (!tracking || !courier) return;
    await apiFetch(`/seller/orders/items/${itemId}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status: 'shipped', trackingNumber: tracking, courierName: courier }),
    });
    const data = await apiFetch<SellerOrderGroup[]>('/seller/orders', { token });
    setOrders(data);
  }

  return (
    <div className="animate-fade-in space-y-6 p-6">
      <div>
        <h1 className="brand-text flex items-center gap-2 text-2xl text-mn-teal">
          Orders
          <Clock className="h-5 w-5 text-mn-teal" />
        </h1>
        <p className="mt-1 text-sm text-mn-mid">Track order items and quickly move them to shipped status.</p>
      </div>

      {error && (
        <div className="animate-slide-up rounded-xl border border-mn-accent/20 bg-mn-accent-soft p-4">
          <p className="text-sm text-mn-accent">{error}</p>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : orders.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 rounded-xl border border-dashed border-mn-teal/30 p-12 text-center">
          <ClipboardList className="h-12 w-12 text-mn-teal" />
          <p className="text-lg font-semibold text-mn-teal">No orders yet</p>
          <p className="text-sm text-mn-mid">New buyer orders will appear here once placed.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} onMarkShipped={markShipped} />
          ))}
        </div>
      )}
    </div>
  );
}
