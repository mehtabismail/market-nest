import { notFound } from 'next/navigation';
import { fetchProduct } from '@/lib/api-server';
import { ProductDetailClient } from '@/components/shop/product-detail-client';

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await fetchProduct(params.slug);
  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
