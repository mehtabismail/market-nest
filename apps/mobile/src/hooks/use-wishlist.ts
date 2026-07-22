import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/auth-context';

interface WishlistValue {
  ids: Set<string>;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
}

const WishlistContext = createContext<WishlistValue | null>(null);

/**
 * Wishlist membership, held as a set so a grid can ask "is this saved?" per
 * tile without a request each.
 *
 * Toggles are optimistic: the heart is a high-frequency, low-stakes control,
 * and waiting a round trip to fill it in makes the whole grid feel broken. A
 * failed write rolls the single id back rather than refetching the list.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    void api
      .request<string[]>('/wishlist/ids')
      .then((list) => {
        if (!cancelled) setIds(new Set(list));
      })
      .catch(() => {
        // Signed in but the read failed — an empty set renders unfilled hearts,
        // which is recoverable; a thrown error would take the whole grid down.
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(
    (productId: string) => {
      if (!user) return;

      const saved = ids.has(productId);
      setIds((current) => {
        const next = new Set(current);
        if (saved) next.delete(productId);
        else next.add(productId);
        return next;
      });

      void api
        .request(`/wishlist/${productId}`, { method: saved ? 'DELETE' : 'POST' })
        .catch(() => {
          setIds((current) => {
            const rolledBack = new Set(current);
            if (saved) rolledBack.add(productId);
            else rolledBack.delete(productId);
            return rolledBack;
          });
        });
    },
    [ids, user],
  );

  const value = useMemo<WishlistValue>(
    () => ({ ids, has: (id) => ids.has(id), toggle }),
    [ids, toggle],
  );

  return createElement(WishlistContext.Provider, { value }, children);
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}
