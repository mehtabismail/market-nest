'use client';

import Link from 'next/link';
import { ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/ui/motion';

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', href: '/shop/search' },
      { label: 'Featured', href: '/shop' },
      { label: 'Latest deals', href: '/shop' },
      { label: 'Your cart', href: '/shop/cart' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/shop/login' },
      { label: 'Create account', href: '/shop/signup' },
      { label: 'Your orders', href: '/shop/orders' },
      { label: 'Become a seller', href: '/seller/signup' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Buyer protection', href: '/shop' },
      { label: 'Anonymous sellers', href: '/shop' },
      { label: 'Secure checkout', href: '/shop/checkout' },
      { label: 'Help', href: '/shop' },
    ],
  },
];

export function ShopFooter() {
  return (
    <footer className="relative mx-auto mt-24 w-full max-w-6xl px-4 pb-32 sm:px-6">
      <Reveal>
        <div className="glass-panel glass-edge overflow-hidden p-8 sm:p-12">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Link href="/shop" className="inline-flex items-center gap-2 font-syne text-2xl font-extrabold tracking-tight text-mn-ink">
                <Sparkles className="h-5 w-5 text-mn-accent" />
                Market<span className="mn-grad-text">Nest</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-mn-mid">
                A curated marketplace. Browse without an account, sign in only at
                checkout, and never see who the seller is — every listing is one
                trusted storefront.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-mn-teal/25 bg-mn-teal-soft px-3.5 py-1.5 text-xs font-semibold text-mn-teal">
                <ShieldCheck className="h-3.5 w-3.5" />
                Buyer-protected orders
              </div>
            </div>

            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-mn-mid">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="group inline-flex items-center gap-1 text-sm text-mn-ink/80 transition-colors hover:text-mn-accent"
                      >
                        {l.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-mn-mid">
              © {new Date().getFullYear()} MarketNest. Secure commerce for buyers, sellers, and admins.
            </p>
            <div className="flex items-center gap-5 text-xs text-mn-mid">
              <span>USD</span>
              <span>Privacy</span>
              <span>Terms</span>
            </div>
          </div>
        </div>

        {/* Oversized watermark wordmark */}
        <p
          aria-hidden
          className="pointer-events-none mt-6 select-none text-center font-syne text-[18vw] font-extrabold leading-none tracking-tighter text-white/[0.04]"
        >
          MARKETNEST
        </p>
      </Reveal>
    </footer>
  );
}
