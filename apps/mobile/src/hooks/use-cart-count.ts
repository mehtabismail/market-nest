import { useCart } from '../contexts/cart-context';

/** Convenience read for the tab badge, which needs the count and nothing else. */
export function useCartCount(): number {
  return useCart().count;
}
