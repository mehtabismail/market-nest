'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { apiFetch, ensureGuestSession } from '@/lib/api';
import type { CartDTO } from '@marketnest/shared-types/buyer';

export function CartLink() {
  const [count, setCount] = useState(0);

  async function refresh() {
    try {
      await ensureGuestSession();
      const cart = await apiFetch<CartDTO>('/cart');
      setCount(cart.itemCount);
    } catch {
      setCount(0);
    }
  }

  useEffect(() => {
    refresh();
    window.addEventListener('cart-updated', refresh);
    return () => window.removeEventListener('cart-updated', refresh);
  }, []);

  return (
    <Link
      href="/shop/cart"
      className="relative inline-flex items-center gap-2 rounded-full border border-mn-border bg-white px-3.5 py-2 text-sm font-semibold text-mn-ink transition-colors hover:border-mn-teal hover:text-mn-teal"
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-mn-accent px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
