import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartDTO } from '@marketnest/shared-types';
import { api } from '../lib/api';
import { useAuth } from './auth-context';

interface CartContextValue {
  cart: CartDTO | null;
  loading: boolean;
  /** Total units, for the tab badge. */
  count: number;
  refresh: () => Promise<void>;
  add: (productId: string, quantity?: number, variantId?: string | null) => Promise<void>;
  setQuantity: (productId: string, quantity: number, variantId?: string | null) => Promise<void>;
  remove: (productId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * One cart, shared by the tab badge, the cart screen, and every "add to cart"
 * button.
 *
 * Context rather than a `useApi` call per consumer: the badge and the cart
 * screen must never disagree, and independent fetches would both duplicate
 * requests and let the two drift after a mutation.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refresh = useCallback(async () => {
    try {
      setCart(await api.request<CartDTO>('/cart'));
    } catch {
      // A failed cart read must not blank the badge the user is looking at —
      // keep the last known good cart and let the next mutation retry.
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-read on sign-in and sign-out: the guest cart merges into the user's on
  // sign-in, and signing out must not leave someone else's lines on screen.
  useEffect(() => {
    void refresh();
  }, [refresh, user?.id]);

  /**
   * Mutations re-read the server cart rather than patching local state. Pricing,
   * stock clamping, and line merging all happen server-side, so a local guess
   * would be wrong exactly when it matters.
   */
  const mutate = useCallback(
    async (run: () => Promise<unknown>) => {
      await run();
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      count: cart?.itemCount ?? 0,
      refresh,
      add: (productId, quantity = 1, variantId = null) =>
        mutate(() =>
          api.request('/cart/items', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity, variantId }),
          }),
        ),
      setQuantity: (productId, quantity, variantId = null) =>
        quantity <= 0
          ? mutate(() => api.request(`/cart/items/${productId}`, { method: 'DELETE' }))
          : mutate(() =>
              api.request('/cart/items', {
                method: 'PATCH',
                body: JSON.stringify({ productId, quantity, variantId }),
              }),
            ),
      remove: (productId) =>
        mutate(() => api.request(`/cart/items/${productId}`, { method: 'DELETE' })),
    }),
    [cart, loading, mutate, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
