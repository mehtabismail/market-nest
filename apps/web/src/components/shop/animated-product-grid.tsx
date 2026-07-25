'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { Reveal } from '@/components/ui/motion';
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
      <Reveal as="section" className="mb-12">
        <SectionHead title={title} />
        <p className="shop-card p-8 text-center text-sm text-mn-mid">{emptyMessage}</p>
      </Reveal>
    );
  }

  return (
    <Reveal as="section" className="mb-12">
      <div className="mb-6 flex items-center justify-between">
        <SectionHead title={title} />
        {showSeeMore && (
          <Link
            href="/shop/search"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-mn-accent transition-colors hover:text-mn-accent-2"
          >
            See more
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
    </Reveal>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-6 w-1.5 rounded-full bg-accent-grad" aria-hidden />
      <h2 className="shop-section-title">{title}</h2>
    </div>
  );
}
