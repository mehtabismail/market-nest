import { CartClient } from './cart-client';

export default function CartPage() {
  return (
    <main className="p-6 max-w-5xl mx-auto w-full">
      <h1 className="brand-text text-2xl mb-6">Your cart</h1>
      <CartClient />
    </main>
  );
}
