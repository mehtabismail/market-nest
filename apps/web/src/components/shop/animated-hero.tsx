'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight, Shirt, Sparkles, Watch, Headphones } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const stats = [
  { value: 'Zero', label: 'seller data shown' },
  { value: 'No account', label: 'to browse' },
  { value: 'Secure', label: 'checkout' },
];

const showcase = [
  { icon: Headphones, tint: 'var(--mn-accent)', price: '$129', depth: 42, x: -18, y: -30, delay: 0.3 },
  { icon: Watch, tint: 'var(--mn-accent-2)', price: '$249', depth: 90, x: 60, y: 20, delay: 0.42 },
  { icon: Shirt, tint: 'var(--mn-gold)', price: '$59', depth: 20, x: -40, y: 90, delay: 0.54 },
];

export function AnimatedHero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTilt({ x: (0.5 - (e.clientY - r.top) / r.height) * 12, y: ((e.clientX - r.left) / r.width - 0.5) * 16 });
  }

  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
      {/* Copy — CSS-driven entrances so they never stall under GPU load. */}
      <div className="relative">
        <span
          className="dock mb-6 inline-flex animate-slide-up items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-mn-mid"
          style={{ animationDelay: '0.05s' }}
        >
          <Sparkles className="h-3.5 w-3.5 text-mn-accent" />
          Curated for you · updated daily
        </span>

        <h1 className="animate-slide-up font-syne text-[2.4rem] font-extrabold leading-[1.03] tracking-tight text-mn-ink sm:text-5xl lg:text-[3.7rem]" style={{ animationDelay: '0.12s' }}>
          Discover modern essentials{' '}
          <span className="font-serif-display font-normal mn-grad-text">for everyday living</span>
        </h1>

        <p
          className="mt-6 max-w-lg animate-slide-up text-[0.95rem] leading-relaxed text-mn-mid sm:text-base"
          style={{ animationDelay: '0.24s' }}
        >
          Browse without an account. Sign in only at checkout. Seller information is
          never shown — every listing is presented as one trusted marketplace.
        </p>

        <div className="mt-8 flex animate-slide-up flex-wrap gap-3" style={{ animationDelay: '0.34s' }}>
          <Link href="/shop/search" className="shop-btn-primary group">
            Explore products
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link href="/shop/cart" className="shop-btn-secondary">
            View cart
          </Link>
        </div>

        <div className="mt-10 flex animate-fade-in flex-wrap items-center gap-x-8 gap-y-3" style={{ animationDelay: '0.5s' }}>
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="font-syne text-lg font-extrabold text-mn-ink">{s.value}</span>
              <span className="text-xs text-mn-mid">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3D floating glass showcase — interactive tilt on framer-motion,
          entrances on CSS. */}
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative hidden h-[420px] [perspective:1400px] lg:block"
      >
        <motion.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          animate={{ rotateX: tilt.x, rotateY: tilt.y }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          {showcase.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="glass-panel glass-edge absolute flex h-52 w-44 animate-slide-up flex-col justify-between p-5"
                style={{
                  left: `calc(50% + ${card.x}px)`,
                  top: `calc(38% + ${card.y}px)`,
                  transform: `translate(-50%, -50%) translateZ(${card.depth}px)`,
                  animationDelay: `${card.delay}s`,
                }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                  style={{ background: `linear-gradient(140deg, rgb(${card.tint}), rgb(var(--mn-accent-2)))` }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="h-2 w-20 rounded-full bg-white/15" />
                  <div className="mt-2 h-2 w-12 rounded-full bg-white/10" />
                  <p className="mt-3 font-mono text-lg font-semibold tabular-nums text-mn-ink">{card.price}</p>
                </div>
              </div>
            );
          })}

          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
            style={{
              background: 'conic-gradient(from 120deg, rgb(var(--mn-accent)), rgb(var(--mn-accent-2)), rgb(var(--mn-gold)), rgb(var(--mn-accent)))',
              transform: 'translate(-50%,-50%) translateZ(-40px)',
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
