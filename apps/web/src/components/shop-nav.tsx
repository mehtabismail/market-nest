'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Home, LogOut, Package, Search, User } from 'lucide-react';
import { CartLink } from '@/components/cart-link';
import { useAuth } from '@/contexts/auth-context';
import { motion } from '@/components/ui/motion';

const links = [
  { href: '/shop', label: 'Home', icon: Home },
  { href: '/shop/search', label: 'Search', icon: Search },
  { href: '/shop/orders', label: 'Orders', auth: true, icon: Package },
  { href: '/shop/account', label: 'Account', auth: true, icon: User },
];

export function ShopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      router.push('/shop');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="mn-glass sticky top-14 z-40 border-b border-mn-ink/[0.06]">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-4 py-2.5 sm:px-6">
        {links.map((link) => {
          if (link.auth && !isAuthenticated) return null;
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                isActive ? 'text-mn-accent' : 'text-mn-mid hover:text-mn-ink'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="shop-nav-active"
                  className="absolute inset-0 rounded-full bg-mn-accent-soft"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{link.label}</span>
              </span>
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
            <>
              <Link
                href="/shop/account"
                className="flex items-center gap-2 text-sm font-semibold text-mn-ink"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-grad text-white shadow-glow-sm">
                  <User className="h-3.5 w-3.5" />
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {user?.fullName ?? 'Account'}
                </span>
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-mn-mid transition-colors hover:text-mn-ink"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{signingOut ? 'Signing out…' : 'Sign out'}</span>
              </button>
            </>
          )}
          <CartLink />
        </div>
      </div>
    </div>
  );
}
