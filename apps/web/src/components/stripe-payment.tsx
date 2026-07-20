'use client';

import { FormEvent, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface StripePaymentProps {
  clientSecret: string;
  onSuccess: () => void;
}

function StripePaymentForm({ onSuccess }: Pick<StripePaymentProps, 'onSuccess'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message ?? 'Payment failed. Please try again.');
      setLoading(false);
      return;
    }

    if (result.paymentIntent?.status === 'succeeded') {
      onSuccess();
      return;
    }

    setError('Payment is processing. Please wait a moment and try again.');
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-coral">{error}</p>}
      <button type="submit" className="btn btn-blue w-full" disabled={!stripe || loading}>
        {loading ? 'Processing payment...' : 'Pay now'}
      </button>
    </form>
  );
}

export function StripePayment({ clientSecret, onSuccess }: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <p className="text-sm text-coral">
        Online payments are unavailable right now. Please select Cash on Delivery to complete checkout.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm onSuccess={onSuccess} />
    </Elements>
  );
}
