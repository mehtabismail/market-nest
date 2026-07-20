import Link from 'next/link';

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams?: { orderId?: string };
}) {
  const orderId = searchParams?.orderId;

  return (
    <main className="p-6 max-w-2xl mx-auto w-full">
      <div className="card p-8 text-center">
        <h1 className="brand-text text-2xl text-teal mb-3">Order confirmed</h1>
        <p className="text-sm text-gray mb-6">
          Thank you for your purchase. We have received your order and will update its status shortly.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {orderId ? (
            <Link href={`/shop/orders/${orderId}`} className="btn btn-blue">
              View order details
            </Link>
          ) : (
            <Link href="/shop/orders" className="btn btn-blue">
              View orders
            </Link>
          )}
          <Link href="/shop" className="btn btn-outline">
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
