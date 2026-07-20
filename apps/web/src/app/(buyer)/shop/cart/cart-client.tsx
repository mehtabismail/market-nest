'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, Package } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ensureGuestSession } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import type { CartDTO } from '@marketnest/shared-types/buyer';

export function CartClient() {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureGuestSession();
      const data = await apiFetch<CartDTO>('/cart');
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateQty(productId: string, quantity: number, variantId?: string | null) {
    const itemKey = `${productId}-${variantId ?? ''}`;
    setUpdatingItems((prev) => new Set(prev).add(itemKey));

    try {
      await apiFetch<CartDTO>('/cart/items', {
        method: 'PATCH',
        body: JSON.stringify({ productId, quantity, variantId }),
      });
      await load();
      window.dispatchEvent(new Event('cart-updated'));
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="grid animate-fade-in gap-8 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card flex gap-4 p-4">
              <Skeleton className="h-24 w-24 rounded-xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-40 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="card h-fit p-6">
          <Skeleton className="mb-5 h-5 w-1/2" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-4 h-10 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="card animate-slide-up p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mn-teal-soft">
          <ShoppingBag className="h-7 w-7 text-mn-teal" />
        </div>
        <p className="mb-5 text-sm text-mn-mid">Your cart is empty</p>
        <Link href="/shop" className="btn btn-primary inline-flex items-center gap-2">
          <Package className="h-4 w-4" />
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        {cart.items.map((line) => {
          const itemKey = `${line.productId}-${line.variantId ?? ''}`;
          const isUpdating = updatingItems.has(itemKey);

          return (
            <div
              key={itemKey}
              className={`card flex gap-4 p-4 transition-opacity ${isUpdating ? 'opacity-60' : ''}`}
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-mn-cream">
                {line.product.thumbnail ? (
                  <img
                    src={line.product.thumbnail}
                    alt={line.product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-mn-cream" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-sm font-semibold text-mn-ink">{line.product.title}</div>
                <div className="mt-1 text-sm font-bold text-mn-teal">${line.unitPrice.toFixed(2)}</div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="inline-flex items-center rounded-full border border-mn-border bg-white p-1">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-mn-mid transition-colors hover:bg-mn-teal-soft hover:text-mn-teal"
                      onClick={() => updateQty(line.productId, line.quantity - 1, line.variantId)}
                      aria-label="Decrease quantity"
                      disabled={isUpdating}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-mn-ink">{line.quantity}</span>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-mn-mid transition-colors hover:bg-mn-teal-soft hover:text-mn-teal"
                      onClick={() => updateQty(line.productId, line.quantity + 1, line.variantId)}
                      aria-label="Increase quantity"
                      disabled={isUpdating}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-mn-accent transition-colors hover:text-mn-accent/80"
                    onClick={() => updateQty(line.productId, 0, line.variantId)}
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-sm font-bold text-mn-ink">${line.lineTotal.toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      <div className="card sticky top-28 h-fit p-6">
        <h2 className="mb-4 font-outfit text-lg font-bold text-mn-ink">Order summary</h2>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-mn-mid">Subtotal</span>
          <span className="font-bold">${cart.subtotal.toFixed(2)}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="text-mn-mid">Shipping (est.)</span>
          <span>$5.00</span>
        </div>
        <div className="mb-6 flex justify-between border-t border-mn-border pt-4 font-bold">
          <span className="text-mn-ink">Total</span>
          <span className="text-lg text-mn-teal">${(cart.subtotal + 5).toFixed(2)}</span>
        </div>
        <Link
          href={isAuthenticated ? '/shop/checkout' : '/shop/login?next=/shop/checkout'}
          className="btn btn-primary w-full"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
