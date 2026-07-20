'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Search, User } from 'lucide-react';
import { CartLink } from '@/components/cart-link';
import { useAuth } from '@/contexts/auth-context';

const links = [
  { href: '/shop', label: 'Home', icon: Home },
  { href: '/shop/search', label: 'Search', icon: Search },
  { href: '/shop/orders', label: 'Orders', auth: true, icon: Package },
  { href: '/shop/account', label: 'Account', auth: true, icon: User },
];

export function ShopNav() {
  const pathname = usePathname();
  const { isAuthenticated, user, loading } = useAuth();

  return (
    <div className="sticky top-14 z-40 border-b border-mn-border bg-mn-paper/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-4 py-2.5 sm:px-6">
        {links.map((link) => {
          if (link.auth && !isAuthenticated) return null;
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                isActive ? 'shop-chip-active' : 'shop-chip'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          {!loading && !isAuthenticated && (
            <>
              <Link
                href="/shop/login"
                className="hidden text-sm font-semibold text-mn-mid transition-colors hover:text-mn-ink sm:inline"
              >
                Sign in
              </Link>
              <Link href="/shop/signup" className="shop-btn-primary hidden px-4 py-2 text-xs sm:inline-flex">
                Join free
              </Link>
            </>
          )}
          {!loading && isAuthenticated && (
            <Link
              href="/shop/account"
              className="flex items-center gap-2 text-sm font-semibold text-mn-ink"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mn-teal-soft text-mn-teal">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="hidden max-w-[120px] truncate sm:inline">
                {user?.fullName ?? 'Account'}
              </span>
            </Link>
          )}
          <CartLink />
        </div>
      </div>
    </div>
  );
}
