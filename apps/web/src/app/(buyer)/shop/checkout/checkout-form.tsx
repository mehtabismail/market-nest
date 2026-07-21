'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthGate, WrongAccountGate } from '@/components/auth/auth-modal';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ensureGuestSession } from '@/lib/api';
import { StripePayment } from '@/components/stripe-payment';
import type { OrderDetailDTO, PaymentIntentResponse } from '@marketnest/shared-types/buyer';

export function CheckoutForm() {
  const router = useRouter();
  const { token, user, loading: authLoading, isAuthenticated } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [pendingPayment, setPendingPayment] = useState<{
    orderId: string;
    clientSecret: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    ensureGuestSession();
  }, []);

  async function handleCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const t = token;
    if (!t) {
      setError('Please sign in first');
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    try {
      await ensureGuestSession();
      const order = await apiFetch<OrderDetailDTO>('/orders/checkout', {
        method: 'POST',
        token: t,
        body: JSON.stringify({
          paymentMethod,
          shippingAddress: {
            fullName: fd.get('fullName'),
            phone: fd.get('phone'),
            line1: fd.get('line1'),
            line2: fd.get('line2') || undefined,
            city: fd.get('city'),
            state: fd.get('state'),
            postalCode: fd.get('postalCode'),
            country: fd.get('country') || 'US',
          },
        }),
      });

      if (paymentMethod === 'online') {
        if (!stripePublishableKey) {
          setError(
            'Online payments are currently unavailable. Please choose Cash on Delivery to complete checkout.',
          );
          return;
        }

        const pi = await apiFetch<PaymentIntentResponse>(`/orders/${order.id}/payment-intent`, {
          method: 'POST',
          token: t,
        });
        if (!pi.clientSecret) {
          setError(
            'We could not initialize online payment for this order. Please try again or use Cash on Delivery.',
          );
          return;
        }

        setPendingPayment({
          orderId: order.id,
          clientSecret: pi.clientSecret,
        });
        return;
      }

      router.push(`/shop/checkout/success?orderId=${encodeURIComponent(order.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  if (pendingPayment) {
    return (
      <div className="card p-6 space-y-4 max-w-lg">
        <h2 className="font-outfit font-bold">Complete payment</h2>
        <p className="text-sm text-gray">
          Your order has been created. Complete your secure Stripe payment to confirm it.
        </p>
        <StripePayment
          clientSecret={pendingPayment.clientSecret}
          onSuccess={() =>
            router.push(`/shop/checkout/success?orderId=${encodeURIComponent(pendingPayment.orderId)}`)
          }
        />
        <button
          type="button"
          className="btn btn-outline w-full"
          onClick={() => setPendingPayment(null)}
          disabled={loading}
        >
          Back to checkout form
        </button>
      </div>
    );
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <AuthGate
        title="Sign in to checkout"
        message="Create an account or sign in to complete your purchase securely."
        loginHref="/shop/login?next=/shop/checkout"
        signupHref="/shop/signup"
      />
    );
  }

  // Signed in, but not as a customer. The API rejects non-buyers at checkout,
  // so stop here rather than letting them fill the form and hit a 403.
  if (!authLoading && user && user.role !== 'buyer') {
    return (
      <WrongAccountGate
        role={user.role}
        action="complete a purchase"
        loginHref="/shop/login?next=/shop/checkout"
      />
    );
  }

  if (authLoading) {
    return null;
  }

  return (
    <form onSubmit={handleCheckout} className="card p-6 space-y-4 max-w-lg">
      <h2 className="font-outfit font-bold">Shipping address</h2>
      <input className="input" name="fullName" placeholder="Full name" required />
      <input className="input" name="phone" placeholder="Phone" required />
      <input className="input" name="line1" placeholder="Address line 1" required />
      <input className="input" name="line2" placeholder="Address line 2" />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" name="city" placeholder="City" required />
        <input className="input" name="state" placeholder="State" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className="input" name="postalCode" placeholder="Postal code" required />
        <input className="input" name="country" placeholder="Country" defaultValue="US" />
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">Payment method</p>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input
            type="radio"
            name="pm"
            checked={paymentMethod === 'cod'}
            onChange={() => setPaymentMethod('cod')}
          />
          Cash on Delivery
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="pm"
            checked={paymentMethod === 'online'}
            onChange={() => setPaymentMethod('online')}
          />
          Pay online (Stripe)
        </label>
        {paymentMethod === 'online' && !stripePublishableKey && (
          <p className="text-sm text-coral mt-2">
            Online checkout is not configured right now. Please use Cash on Delivery.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}
      <button type="submit" className="btn btn-blue w-full" disabled={loading}>
        {loading ? 'Placing order...' : paymentMethod === 'online' ? 'Continue to payment' : 'Place order'}
      </button>
      <Link href="/shop/cart" className="text-sm text-gray hover:text-blue block text-center">
        Back to cart
      </Link>
    </form>
  );
}
