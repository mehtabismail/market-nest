'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

const AUTO_MS = 3000;

export function AnimatedBannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const banner = banners[index] ?? banners[0];

  const goTo = useCallback(
    (next: number) => {
      if (banners.length <= 1) return;
      setIndex((next + banners.length) % banners.length);
    },
    [banners.length],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, banners.length]);

  if (!banner) return null;

  const slide = (
    <article className="shop-card relative w-full overflow-hidden rounded-[20px]">
      <div className="relative h-52 w-full md:h-72">
        <Image
          src={banner.imageUrl}
          alt={banner.title ?? 'MarketNest banner'}
          fill
          sizes="(max-width: 768px) 100vw, 1152px"
          priority={index === 0}
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-mn-ink/75 via-mn-ink/25 to-transparent" />
      <div className="absolute bottom-0 left-0 p-5 md:p-7">
        {banner.title && (
          <p className="max-w-md font-outfit text-lg font-bold text-white md:text-2xl">{banner.title}</p>
        )}
        {banner.linkUrl && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white/95">
            Explore now <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </article>
  );

  return (
    <section
      className="mb-10 shop-reveal"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="shop-section-title">Latest deals</h2>
        {banners.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="mr-2 flex gap-1.5">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === index ? 'w-6 bg-mn-teal' : 'w-2 bg-mn-border hover:bg-mn-mid/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={prev}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-mn-border bg-white text-mn-ink transition-colors hover:bg-mn-cream"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-mn-border bg-white text-mn-ink transition-colors hover:bg-mn-cream"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[20px]">
        {banner.linkUrl ? (
          <a href={banner.linkUrl} className="block rounded-[20px] focus:outline-none focus-visible:ring-2 focus-visible:ring-mn-teal">
            {slide}
          </a>
        ) : (
          slide
        )}
      </div>
    </section>
  );
}
