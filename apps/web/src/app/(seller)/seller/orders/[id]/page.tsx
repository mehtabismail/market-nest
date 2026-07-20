'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, MapPin, PackageCheck, Truck, UserRound } from 'lucide-react';
import { SkeletonCard, TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface SellerOrderGroup {
  orderId: string;
  status: string;
  createdAt: string;
  buyerName: string | null;
  buyerPhone: string | null;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: {
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
    status: string;
    trackingNumber?: string | null;
    courierName?: string | null;
  }[];
  sellerTotal: number;
}

export default function SellerOrderDetailPage({ params }: { params: { id: string } }) {
  const { token } = useAuth();
  const [order, setOrder] = useState<SellerOrderGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await apiFetch<SellerOrderGroup[]>('/seller/orders', { token });
      setOrder(rows.find((row) => row.orderId === params.id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [params.id, token]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

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
    await loadOrder();
  }

  if (loading) {
    return (
      <main className="p-8">
        <div className="space-y-6">
          <div className="h-8 w-56 rounded bg-gray-light/70" />
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <TableSkeleton rows={4} cols={5} />
        </div>
      </main>
    );
  }
  if (error) return <main className="p-8 text-sm text-coral">{error}</main>;
  if (!order) return <main className="p-8 text-sm text-gray">Order not found.</main>;

  return (
    <main className="max-w-4xl animate-fade-in space-y-6 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="brand-text text-2xl text-teal-dark">
            Order #{order.orderId.slice(0, 8)}
          </h1>
          <p className="text-sm text-gray">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className="badge bg-teal-light text-teal-dark">{order.status}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card border border-teal-light/40 p-4">
          <h2 className="mb-2 inline-flex items-center gap-2 font-semibold text-teal-dark">
            <UserRound className="h-4 w-4" />
            Buyer
          </h2>
          <p className="text-sm">{order.buyerName ?? '-'}</p>
          <p className="text-sm text-gray">{order.buyerPhone ?? 'No phone'}</p>
          <p className="text-xs text-gray mt-2">Payment: {order.paymentMethod.toUpperCase()}</p>
        </div>

        <div className="card border border-teal-light/40 p-4">
          <h2 className="mb-2 inline-flex items-center gap-2 font-semibold text-teal-dark">
            <MapPin className="h-4 w-4" />
            Shipping address
          </h2>
          <p className="text-sm">{order.shippingAddress?.fullName}</p>
          <p className="text-sm text-gray">
            {order.shippingAddress?.line1}
            {order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}
          </p>
          <p className="text-sm text-gray">
            {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
            {order.shippingAddress?.postalCode}
          </p>
          <p className="text-sm text-gray">{order.shippingAddress?.country}</p>
        </div>
      </div>

      <div className="card mb-5 overflow-hidden border border-teal-light/40">
        <table className="w-full text-sm">
          <thead className="bg-teal-light/40 text-left text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t border-border/40">
                <td className="p-3">
                  <div className="inline-flex items-center gap-2 font-medium">
                    <PackageCheck className="h-4 w-4 text-teal-dark" />
                    {item.title}
                  </div>
                  {(item.trackingNumber || item.courierName) && (
                    <p className="text-xs text-gray mt-1">
                      {item.courierName ?? 'Courier'} - {item.trackingNumber ?? 'Tracking pending'}
                    </p>
                  )}
                </td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">${(item.unitPrice * item.quantity).toFixed(2)}</td>
                <td className="p-3">{item.status}</td>
                <td className="p-3">
                  {item.status !== 'shipped' && item.status !== 'delivered' ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal"
                      onClick={() => markShipped(item.id)}
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Mark shipped
                    </button>
                  ) : (
                    <span className="text-xs text-gray">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/seller/orders" className="btn btn-outline inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <p className="text-sm font-bold">Seller total: ${order.sellerTotal.toFixed(2)}</p>
      </div>
    </main>
  );
}
