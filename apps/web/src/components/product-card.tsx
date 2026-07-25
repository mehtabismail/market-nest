'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, ShoppingCart, Check } from 'lucide-react';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types/buyer';
import { OfficialBadge } from './official-badge';
import { TiltCard } from '@/components/ui/motion';
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
      className="group flex h-full rounded-[24px] focus:outline-none focus-visible:ring-2 focus-visible:ring-mn-accent/50"
      style={{ animationDelay: `${revealDelay}ms` }}
    >
      <TiltCard className="h-full w-full" max={5}>
        <article className="shop-card shop-reveal flex h-full w-full flex-col overflow-hidden">
          <div className="relative aspect-[4/5] shrink-0 overflow-hidden bg-mn-cream">
            {product.thumbnail && !imgError ? (
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-110"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    'radial-gradient(120% 120% at 20% 15%, rgb(var(--mn-accent) / 0.22), transparent 55%), radial-gradient(120% 120% at 85% 90%, rgb(var(--mn-accent-2) / 0.2), transparent 55%), rgb(var(--mn-cream))',
                }}
              />
            )}

            {/* Favourite */}
            <button
              type="button"
              onClick={handleFavorite}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 shadow-sm backdrop-blur-md transition-transform duration-200 hover:scale-110 active:scale-95"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavorite ? 'fill-mn-rose text-mn-rose' : 'text-white/80'
                }`}
              />
            </button>

            {hasDiscount && (
              <span className="absolute left-3 top-3 rounded-full bg-mn-rose px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                -{discountPercent}%
              </span>
            )}

            {/* Hover action bar */}
            <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-2 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <span className="text-xs font-semibold text-white">View details</span>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart || addedToCart}
                className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold shadow-glow-sm transition-all duration-200 active:scale-95 ${
                  addedToCart
                    ? 'bg-mn-teal text-white'
                    : 'bg-accent-grad text-white hover:shadow-glow'
                }`}
              >
                {isAddingToCart ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
            <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-mn-ink transition-colors group-hover:text-mn-accent">
              {product.title}
            </h3>

            <div className="mt-auto pt-3">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-lg font-semibold tabular-nums tracking-tight text-mn-ink">
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
      </TiltCard>
    </Link>
  );
}
