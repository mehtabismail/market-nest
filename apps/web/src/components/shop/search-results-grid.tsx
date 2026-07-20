'use client';

import { Search } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types/buyer';

interface SearchResultsGridProps {
  items: BuyerProductListItemDTO[];
  query: string;
  searchMode?: string;
}

export function SearchResultsGrid({ items, query, searchMode }: SearchResultsGridProps) {
  if (!query) {
    return (
      <div className="py-16 text-center shop-reveal">
        <Search className="mx-auto mb-4 h-10 w-10 text-mn-mid/50" />
        <p className="text-sm text-mn-mid">Enter a search term to find products</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="shop-card p-8 text-center shop-reveal">
        <p className="font-outfit text-lg font-bold text-mn-ink">No results for &quot;{query}&quot;</p>
        <p className="mt-2 text-sm text-mn-mid">
          {searchMode === 'semantic' ? 'Try different wording — AI search understands meaning.' : 'Try another keyword or browse categories.'}
        </p>
      </div>
    );
  }

  return (
    <div className="shop-reveal">
      <p className="mb-5 text-sm text-mn-mid">
        {items.length} result{items.length === 1 ? '' : 's'}
        {searchMode === 'semantic' ? ' (AI search)' : ''}
      </p>
      <div className="grid grid-cols-2 auto-rows-fr gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {items.map((p, index) => (
          <div key={p.id} className="h-full">
            <ProductCard product={p} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
