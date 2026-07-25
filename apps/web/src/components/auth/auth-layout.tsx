'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { motion, Reveal } from '@/components/ui/motion';

type Portal = 'buyer' | 'seller' | 'admin';

const portalTheme: Record<Portal, string> = {
  buyer: 'shop-theme',
  seller: 'seller-theme',
  admin: 'admin-theme',
};

const portalAccent: Record<Portal, string> = {
  buyer: 'text-mn-accent',
  seller: 'text-mn-accent',
  admin: 'text-mn-gold',
};

const portalBadge: Record<Portal, string> = {
  buyer: 'bg-white/15 text-white ring-1 ring-white/25',
  seller: 'bg-white/15 text-white ring-1 ring-white/25',
  admin: 'bg-amber-light text-mn-gold',
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function AuthLayout({
  portal,
  title,
  subtitle,
  children,
  footer,
}: {
  portal: Portal;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const isPremium = portal !== 'admin';

  return (
    <div className={cn(portalTheme[portal], 'mn-theme min-h-screen')}>
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <div
          className={cn(
            'relative hidden flex-col justify-between overflow-hidden p-12 lg:flex',
            isPremium ? 'text-white' : 'border-r border-mn-border bg-mn-cream',
          )}
          style={
            isPremium
              ? {
                  background:
                    'linear-gradient(150deg, rgb(var(--mn-ink)) 0%, rgb(24 18 48) 45%, rgb(var(--mn-accent)) 140%)',
                }
              : undefined
          }
        >
          {isPremium && (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 animate-aurora-drift"
                style={{
                  background:
                    'radial-gradient(45% 45% at 85% 15%, rgb(var(--mn-accent) / 0.55) 0%, transparent 65%), radial-gradient(40% 45% at 10% 90%, rgb(var(--mn-accent-2) / 0.5) 0%, transparent 65%)',
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-40 blur-3xl"
                style={{ background: 'conic-gradient(from 90deg, rgb(var(--mn-accent)), rgb(var(--mn-accent-2)), rgb(var(--mn-gold)), rgb(var(--mn-accent)))' }}
              />
            </>
          )}

          <Link
            href="/"
            className={cn(
              'relative font-syne text-2xl font-extrabold tracking-tight',
              isPremium ? 'text-white' : 'text-mn-ink',
            )}
          >
            Market<span className={isPremium ? 'text-white/80' : 'text-mn-accent'}>Nest</span>
          </Link>

          <div className="relative">
            <span className={cn('badge mb-5 capitalize', portalBadge[portal])}>{portal} portal</span>
            <Reveal y={16}>
              <h1
                className={cn(
                  'mb-4 font-syne text-4xl font-extrabold leading-[1.08] tracking-tight lg:text-5xl',
                  isPremium ? 'text-white' : 'text-mn-ink',
                )}
              >
                {title}
              </h1>
            </Reveal>
            <p
              className={cn(
                'max-w-md text-base leading-relaxed',
                isPremium ? 'text-white/70' : 'text-mn-mid',
              )}
            >
              {subtitle}
            </p>
          </div>

          <p className={cn('relative text-xs', isPremium ? 'text-white/50' : 'text-mn-mid')}>
            Secure commerce for buyers, sellers, and admins.
          </p>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center bg-mn-paper p-6 sm:p-10">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <div className="mb-8 text-center lg:hidden">
              <Link href="/" className="font-syne text-xl font-extrabold text-mn-ink">
                Market<span className="mn-grad-text">Nest</span>
              </Link>
              <p className={cn('mt-2 text-sm font-medium', portalAccent[portal])}>{title}</p>
            </div>
            <div className="card p-8 shadow-lg">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-mn-mid">{footer}</div>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-mn-ink">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-mn-rose/25 bg-mn-rose/10 px-3 py-2 text-sm font-medium text-mn-rose">
      {message}
    </p>
  );
}
