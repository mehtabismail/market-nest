'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function AnimatedHero() {
  return (
    <section className="shop-reveal relative mb-10 overflow-hidden rounded-[24px] border border-mn-border bg-white p-6 sm:p-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 80% 30%, rgba(200,151,58,0.14) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 10% 80%, rgba(26,107,90,0.12) 0%, transparent 70%)',
        }}
      />
      <div className="relative max-w-2xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-mn-border bg-mn-paper px-4 py-1.5 text-xs font-semibold text-mn-mid shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-mn-accent" />
          Curated for you
        </span>

        <h1 className="font-outfit text-3xl font-extrabold leading-tight tracking-tight text-mn-ink sm:text-4xl lg:text-[2.75rem]">
          Discover modern essentials
          <br />
          <span className="text-mn-accent">for everyday living</span>
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-mn-mid">
          Browse without an account. Sign in only at checkout. Seller information is never shown.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/shop/search" className="shop-btn-primary">
            Search products
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/shop/cart" className="shop-btn-secondary">
            View cart
          </Link>
        </div>
      </div>
    </section>
  );
}
