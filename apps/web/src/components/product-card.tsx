'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, ShoppingCart, Check } from 'lucide-react';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types/buyer';
import { OfficialBadge } from './official-badge';
import { apiFetch, ensureGuestSession } from '@/lib/api';

export function ProductCard({ product, index = 0 }: { product: BuyerProductListItemDTO; index?: number }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imgError, setImgError] = useState(false);

  const comparePrice = typeof product.comparePrice === 'number' ? product.comparePrice : null;
  const hasDiscount = comparePrice !== null && comparePrice > product.price;
  const comparePriceLabel = comparePrice !== null ? comparePrice.toFixed(2) : null;
  const discountPercent =
    hasDiscount && comparePrice !== null
      ? Math.round(((comparePrice - product.price) / comparePrice) * 100)
      : 0;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAddingToCart || addedToCart) return;

    setIsAddingToCart(true);
    try {
      await ensureGuestSession();
      await apiFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      window.dispatchEvent(new Event('cart-updated'));
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch {
      // guest cart may fail silently
    } finally {
      setIsAddingToCart(false);
    }
  };

  const revealDelay = Math.min(index * 40, 200);

  return (
    <Link
      href={`/shop/products/${product.id}`}
      className="group flex h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-mn-teal/40 rounded-[20px]"
      style={{ animationDelay: `${revealDelay}ms` }}
    >
      <article className="shop-card shop-reveal flex h-full w-full flex-col overflow-hidden">
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden bg-mn-cream">
          {product.thumbnail && !imgError ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-mn-cream via-mn-teal-soft/30 to-mn-accent-soft/20" />
          )}

          <button
            type="button"
            onClick={handleFavorite}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-110"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorite ? 'fill-mn-accent text-mn-accent' : 'text-mn-mid'
              }`}
            />
          </button>

          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-mn-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-2 bg-gradient-to-t from-mn-ink/80 to-transparent p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="text-xs font-semibold text-white">View details</span>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart || addedToCart}
              className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                addedToCart ? 'bg-mn-teal text-white' : 'bg-white text-mn-ink hover:bg-mn-accent hover:text-white'
              }`}
            >
              {isAddingToCart ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-mn-ink/20 border-t-mn-ink" />
              ) : addedToCart ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5" />
              )}
              {addedToCart ? 'Added' : 'Add'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-mn-ink">
            {product.title}
          </h3>

          <div className="mt-auto pt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-outfit text-lg font-extrabold tracking-tight text-mn-teal">
                ${product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-mn-mid line-through">${comparePriceLabel}</span>
              )}
            </div>
            <div className="mt-2 flex min-h-[1.5rem] items-center">
              {product.isMarketNestOfficial ? <OfficialBadge /> : null}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
