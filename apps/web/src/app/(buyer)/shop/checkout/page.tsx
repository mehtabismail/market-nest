import { CheckoutForm } from './checkout-form';

export default function CheckoutPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto w-full">
      <h1 className="brand-text text-2xl mb-2">Checkout</h1>
      <p className="text-sm text-gray mb-8">Sign in to complete your order (BU-08)</p>
      <CheckoutForm />
    </main>
  );
}
