'use client';

import { usePathname } from 'next/navigation';
import { PortalShell } from '@/components/portal-shell';
import { ShopNav } from '@/components/shop-nav';
import { ShopAssistant } from '@/components/shop-assistant';
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
    <PortalShell portal="buyer" title="Shop">
      <ShopNav />
      {children}
      <ShopAssistant />
    </PortalShell>
  );
}
