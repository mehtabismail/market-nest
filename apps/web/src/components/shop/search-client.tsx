'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Search, Sparkles, X } from 'lucide-react';

interface SearchClientProps {
  initialQuery: string;
  useSemantic: boolean;
  sort: string;
  searchParams: { q?: string; semantic?: string; sort?: string };
}

function queryString(
  searchParams: { q?: string; semantic?: string; sort?: string },
  overrides?: Partial<{ q: string; semantic: string; sort: string }>
) {
  const merged = { ...searchParams, ...overrides };
  const query = new URLSearchParams();
  if (merged.q) query.set('q', merged.q);
  if (merged.semantic === 'true') query.set('semantic', 'true');
  if (merged.sort && merged.sort !== 'relevance') query.set('sort', merged.sort);
  const built = query.toString();
  return built ? `/shop/search?${built}` : '/shop/search';
}

export function SearchClient({ initialQuery, useSemantic, sort, searchParams }: SearchClientProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="animate-fade-in">
      <h1 className="brand-text mb-2 text-2xl text-mn-ink sm:text-3xl">Search products</h1>
      <p className="mb-6 text-sm text-mn-mid">
        {useSemantic
          ? 'AI semantic search finds products by meaning (requires indexed products).'
          : 'Keyword search across titles and descriptions.'}
      </p>

      <form
        className={`mb-5 flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-3 shadow-lg transition-all duration-300 ${
          isFocused
            ? 'border-mn-teal/50 shadow-xl shadow-mn-teal/10 ring-4 ring-mn-teal/10'
            : 'border-border/60 shadow-md'
        }`}
        action="/shop/search"
        method="get"
      >
        <div className="relative min-w-[220px] flex-1">
          <Search
            className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
              isFocused ? 'text-mn-teal' : 'text-mn-mid'
            }`}
          />
          <input
            ref={inputRef}
            className="input border-0 bg-transparent pl-9 focus:ring-0"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search products, categories, and styles..."
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-mn-mid transition-colors hover:bg-gray-light hover:text-mn-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button type="submit" className="btn btn-primary rounded-full shadow-md shadow-mn-teal/20 transition-shadow hover:shadow-lg hover:shadow-mn-teal/30">
          Search
        </button>

        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all ${
            useSemantic
              ? 'border-mn-teal bg-gradient-to-r from-mn-teal-soft to-mn-teal-soft/80 text-mn-teal'
              : 'border-border bg-gray-light text-mn-mid hover:border-mn-teal/50'
          }`}
        >
          <input
            type="checkbox"
            name="semantic"
            value="true"
            defaultChecked={useSemantic}
            className="sr-only"
          />
          <Sparkles className="h-3.5 w-3.5" />
          AI semantic
        </label>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-mn-mid">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort
        </span>

        {['relevance', 'price-asc', 'price-desc'].map((sortOption) => {
          const isActive = sort === sortOption;
          const labels: Record<string, string> = {
            relevance: 'Relevance',
            'price-asc': 'Price low to high',
            'price-desc': 'Price high to low',
          };

          return (
            <Link
              key={sortOption}
              href={queryString(searchParams, { sort: sortOption })}
              className={`relative overflow-hidden rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'border-mn-teal bg-mn-teal text-white shadow-md shadow-mn-teal/20'
                  : 'border-border bg-white text-mn-ink hover:border-mn-teal/35 hover:bg-mn-teal-soft'
              }`}
            >
              {labels[sortOption]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
