'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/motion';

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
  const chips = [{ id: '__all', name: 'All', slug: '' }, ...categories];

  return (
    <Reveal as="section" className="mb-12">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="shop-section-title">Shop by category</h2>
        <Link
          href="/shop/search"
          className="group inline-flex items-center gap-1 text-sm font-semibold text-mn-accent transition-colors hover:text-mn-accent-2"
        >
          Browse all
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {chips.map((c) => {
          const isActive = c.slug ? activeSlug === c.slug : !activeSlug;
          const href = c.slug ? `/shop?category=${c.slug}` : '/shop';
          return (
            <Link
              key={c.id}
              href={href}
              className={isActive ? 'shop-chip shop-chip-active' : 'shop-chip'}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </Reveal>
  );
}
