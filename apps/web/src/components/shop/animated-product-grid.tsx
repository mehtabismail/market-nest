'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types/buyer';

interface AnimatedProductGridProps {
  title: string;
  products: BuyerProductListItemDTO[];
  showSeeMore?: boolean;
  emptyMessage?: string;
  columns?: 3 | 4;
}

export function AnimatedProductGrid({
  title,
  products,
  showSeeMore = false,
  emptyMessage,
  columns = 4,
}: AnimatedProductGridProps) {
  const gridCols =
    columns === 4
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-2 lg:grid-cols-4';

  if (products.length === 0 && emptyMessage) {
    return (
      <section className="mb-10 shop-reveal">
        <h2 className="shop-section-title mb-4">{title}</h2>
        <p className="shop-card p-6 text-sm text-mn-mid">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="mb-10 shop-reveal">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="shop-section-title">{title}</h2>
        {showSeeMore && (
          <Link
            href="/shop/search"
            className="inline-flex items-center gap-1 text-sm font-semibold text-mn-teal transition-colors hover:text-mn-accent"
          >
            See more
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className={`grid ${gridCols} auto-rows-fr gap-4 md:gap-5`}>
        {products.map((p, index) => (
          <div key={p.id} className="h-full">
            <ProductCard product={p} index={index} />
          </div>
        ))}
      </div>
    </section>
  );
}
