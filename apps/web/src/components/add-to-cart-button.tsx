'use client';

import { useState } from 'react';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ensureGuestSession } from '@/lib/api';
import type { CartDTO } from '@marketnest/shared-types/buyer';

export function AddToCartButton({
  productId,
  variantId,
  className = 'btn btn-primary',
}: {
  productId: string;
  variantId?: string;
  className?: string;
}) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  async function handleClick() {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      await ensureGuestSession();
      await apiFetch<CartDTO>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, variantId, quantity: 1 }),
      });
      setDone(true);
      window.dispatchEvent(new Event('cart-updated'));
      setTimeout(() => setDone(false), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick} disabled={loading}>
        {loading ? 'Adding...' : done ? 'Added' : 'Add to cart'}
      </button>
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign in to add to cart"
        message="Please sign in or create an account before adding items to your cart."
        loginHref="/shop/login"
        signupHref="/shop/signup"
      />
    </>
  );
}
