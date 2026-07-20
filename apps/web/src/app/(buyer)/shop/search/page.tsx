import { Suspense } from 'react';
import { fetchProducts } from '@/lib/api-server';
import { SearchClient } from '@/components/shop/search-client';
import { SearchResultsGrid } from '@/components/shop/search-results-grid';
import { SearchResultsSkeleton } from '@/components/shop/search-results-skeleton';

type SearchParams = { q?: string; semantic?: string; sort?: 'relevance' | 'price-asc' | 'price-desc' };

async function SearchResults({ q, useSemantic, sort }: { q: string; useSemantic: boolean; sort: string }) {
  const { items, searchMode } = q
    ? await fetchProducts({ search: q, semantic: useSemantic }).then((r) => ({
        items: r.items,
        searchMode: (r as { searchMode?: string }).searchMode,
      }))
    : { items: [], searchMode: undefined };

  const sorted = [...items];
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);

  return (
    <SearchResultsGrid
      items={sorted}
      query={q}
      searchMode={searchMode}
    />
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = searchParams.q ?? '';
  const useSemantic = searchParams.semantic === 'true';
  const sort = searchParams.sort ?? 'relevance';

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <SearchClient
        initialQuery={q}
        useSemantic={useSemantic}
        sort={sort}
        searchParams={searchParams}
      />

      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults q={q} useSemantic={useSemantic} sort={sort} />
      </Suspense>
    </main>
  );
}
