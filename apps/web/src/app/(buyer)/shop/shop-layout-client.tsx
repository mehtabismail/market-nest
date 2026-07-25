'use client';

import { usePathname } from 'next/navigation';
import { ShopAssistant } from '@/components/shop-assistant';
import { ShopAtmosphere } from '@/components/shop/shop-atmosphere';
import { ShopDock, ShopHud } from '@/components/shop/shop-dock';
import { ShopFooter } from '@/components/shop/shop-footer';
import '@/styles/shop-theme.css';

const AUTH_PREFIXES = [
  '/shop/login',
  '/shop/signup',
  '/shop/forgot-password',
  '/shop/reset-password',
  '/shop/auth',
];

export function ShopLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isAuthPage) {
    return <div className="shop-theme mn-theme min-h-screen">{children}</div>;
  }

  return (
    <div className="shop-theme mn-theme flex min-h-screen flex-col">
      <ShopAtmosphere />
      <ShopHud />
      <div className="flex-1 pt-20 sm:pt-24">{children}</div>
      <ShopFooter />
      <ShopDock />
      <ShopAssistant />
    </div>
  );
}
