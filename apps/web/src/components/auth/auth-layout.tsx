'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Portal = 'buyer' | 'seller' | 'admin';

const portalTheme: Record<Portal, string> = {
  buyer: 'shop-theme',
  seller: 'seller-theme',
  admin: 'admin-theme',
};

const portalAccent: Record<Portal, string> = {
  buyer: 'text-mn-teal',
  seller: 'text-mn-teal',
  admin: 'text-mn-gold',
};

const portalBadge: Record<Portal, string> = {
  buyer: 'bg-mn-teal-soft text-mn-teal',
  seller: 'bg-mn-teal-soft text-mn-teal',
  admin: 'bg-amber-light text-mn-gold',
};

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
  return (
    <div className={cn(portalTheme[portal], 'mn-theme min-h-screen')}>
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-mn-border bg-mn-cream p-12 lg:flex">
          <Link href="/" className="font-outfit text-2xl font-extrabold tracking-tight text-mn-ink">
            Market<span className="text-mn-accent">Nest</span>
          </Link>
          <div>
            <span className={cn('badge mb-4', portalBadge[portal])}>{portal} portal</span>
            <h1 className="mb-4 font-outfit text-4xl font-extrabold leading-tight text-mn-ink">{title}</h1>
            <p className="max-w-md text-base leading-relaxed text-mn-mid">{subtitle}</p>
          </div>
          <p className="text-xs text-mn-mid">Secure commerce for buyers, sellers, and admins.</p>
        </div>

        <div className="flex items-center justify-center bg-mn-paper p-6 sm:p-10">
          <div className="w-full max-w-md animate-slide-up">
            <div className="mb-8 text-center lg:hidden">
              <Link href="/" className="font-outfit text-xl font-extrabold text-mn-ink">
                Market<span className="text-mn-accent">Nest</span>
              </Link>
              <p className={cn('mt-2 text-sm font-medium', portalAccent[portal])}>{title}</p>
            </div>
            <div className="card p-8 shadow-md">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-mn-mid">{footer}</div>}
          </div>
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
    <p className="rounded-xl border border-mn-accent/20 bg-mn-accent-soft px-3 py-2 text-sm text-mn-accent">
      {message}
    </p>
  );
}
