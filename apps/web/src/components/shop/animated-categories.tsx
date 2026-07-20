'use client';

import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function AnimatedCategories({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  return (
    <section className="mb-10 shop-reveal">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="shop-section-title">Shop by category</h2>
        <Link
          href="/shop/search"
          className="text-sm font-semibold text-mn-teal transition-colors hover:text-mn-accent"
        >
          Browse all
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={activeSlug ? 'shop-chip' : 'shop-chip shop-chip-active'}
        >
          All
        </Link>
        {categories.map((c) => {
          const isActive = activeSlug === c.slug;
          return (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className={isActive ? 'shop-chip shop-chip-active' : 'shop-chip'}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
