'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleCheck, Star, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { OfficialBadge } from '@/components/official-badge';
import { ProductVariantSelector } from '@/components/product-variant-selector';
import { ProductReviews } from '@/components/product-reviews';

import type { BuyerProductDTO } from '@marketnest/shared-types/buyer';

interface ProductDetailClientProps {
  product: BuyerProductDTO;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : null;
  const gallery = product.images.length > 0 ? product.images : [null];

  const changeImage = (newIndex: number) => {
    setSelectedImageIndex(newIndex);
  };

  const nextImage = () => {
    if (gallery.length <= 1) return;
    setSelectedImageIndex((prev) => (prev + 1) % gallery.length);
  };

  const prevImage = () => {
    if (gallery.length <= 1) return;
    setSelectedImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <div className="animate-fade-in grid gap-8 lg:grid-cols-2">
        <div className="animate-slide-up space-y-3">
          <div
            className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-border/60 bg-gray-light"
            onClick={() => setIsZoomed(!isZoomed)}
          >
            {gallery[selectedImageIndex] ? (
              <img
                key={selectedImageIndex}
                src={gallery[selectedImageIndex]!}
                alt={product.title}
                className={`h-full w-full object-cover transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-mn-teal-soft/50 to-mn-teal-soft/20" />
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
            </div>

            {gallery.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-mn-ink shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-mn-ink shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(0, 4).map((image, index) => (
                <button
                  key={image ?? `placeholder-${index}`}
                  onClick={() => changeImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-gray-light transition-all ${
                    selectedImageIndex === index
                      ? 'border-mn-teal ring-2 ring-mn-teal/20'
                      : 'border-border hover:border-mn-teal/50'
                  }`}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={`${product.title} preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  {selectedImageIndex === index && (
                    <div className="absolute inset-0 bg-mn-teal/10" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="animate-slide-up rounded-2xl border border-border/60 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h1 className="brand-text text-2xl tracking-tighter text-mn-ink sm:text-3xl">
              {product.title}
            </h1>
            {product.isMarketNestOfficial && <OfficialBadge />}
          </div>

          {product.averageRating && (
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-light to-amber-light/80 px-3 py-1 text-xs font-semibold text-amber">
              <Star className="h-3.5 w-3.5 fill-current" />
              {product.averageRating} ({product.reviewCount} reviews)
            </p>
          )}

          <div className="mb-4 flex items-baseline gap-3">
            <p className="price-lg bg-gradient-to-r from-mn-teal to-mn-teal/80 bg-clip-text text-3xl text-transparent">
              ${product.price.toFixed(2)}
            </p>
            {product.comparePrice && (
              <p className="text-mn-mid line-through">${product.comparePrice.toFixed(2)}</p>
            )}
            {discount && (
              <span className="badge bg-gradient-to-r from-mn-accent to-mn-accent/90 font-bold text-white">
                -{discount}%
              </span>
            )}
          </div>

          <p className="mb-2 inline-flex items-center gap-1.5 text-sm text-mn-mid">
            <CircleCheck className={`h-4 w-4 ${product.stockQty > 0 ? 'text-green' : 'text-mn-mid'}`} />
            {product.stockQty > 0 ? `${product.stockQty} in stock` : 'Out of stock'}
          </p>

          {product.description && (
            <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-mn-ink">
              {product.description}
            </p>
          )}

          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-bg/60 to-white p-4">
            {product.variants.length > 0 ? (
              <ProductVariantSelector
                productId={product.id}
                basePrice={product.price}
                baseStockQty={product.stockQty}
                variants={product.variants}
              />
            ) : (
              <AddToCartButton productId={product.id} />
            )}
            <Link
              href="/shop/checkout"
              className="btn btn-outline ml-3 rounded-full transition-colors hover:bg-gray-light"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>

      <section className="animate-slide-up mt-10">
        <h2 className="brand-text mb-4 text-xl text-mn-ink">Reviews</h2>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm sm:p-6">
          <ProductReviews productId={product.id} />
        </div>
      </section>
    </main>
  );
}
