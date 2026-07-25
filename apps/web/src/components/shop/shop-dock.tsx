'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, LogOut, Package, Search, ShoppingBag, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ensureGuestSession } from '@/lib/api';
import { motion } from '@/components/ui/motion';
import type { CartDTO } from '@marketnest/shared-types/buyer';

function useCartCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        await ensureGuestSession();
        const cart = await apiFetch<CartDTO>('/cart');
        if (alive) setCount(cart.itemCount);
      } catch {
        if (alive) setCount(0);
      }
    }
    refresh();
    window.addEventListener('cart-updated', refresh);
    return () => {
      alive = false;
      window.removeEventListener('cart-updated', refresh);
    };
  }, []);
  return count;
}

const navLinks = [
  { href: '/shop', label: 'Home', icon: Home },
  { href: '/shop/search', label: 'Search', icon: Search },
  { href: '/shop/orders', label: 'Orders', icon: Package, auth: true },
  { href: '/shop/account', label: 'Account', icon: User, auth: true },
];

/* Top HUD — floating logo chip (left) + cart / account cluster (right). */
export function ShopHud() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const router = useRouter();
  const count = useCartCount();
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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex animate-fade-in items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <Link
        href="/shop"
        className="dock pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-syne text-lg font-extrabold tracking-tight text-mn-ink"
      >
        <Sparkles className="h-4 w-4 text-mn-accent" />
        Market<span className="mn-grad-text">Nest</span>
      </Link>

      <div className="pointer-events-auto flex items-center gap-2">
        <Link
          href="/shop/cart"
          className="dock relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-mn-ink transition-transform hover:-translate-y-0.5"
          aria-label="Cart"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Cart</span>
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-grad px-1 text-[10px] font-bold text-white shadow-glow-sm">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>

        {!loading && !isAuthenticated && (
          <>
            <Link
              href="/shop/login"
              className="dock hidden rounded-full px-4 py-2.5 text-sm font-semibold text-mn-mid transition-colors hover:text-mn-ink sm:inline-flex"
            >
              Sign in
            </Link>
            <Link href="/shop/signup" className="shop-btn-primary px-4 py-2.5 text-sm">
              Join free
            </Link>
          </>
        )}

        {!loading && isAuthenticated && (
          <div className="dock flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-2">
            <Link
              href="/shop/account"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-semibold text-mn-ink"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-grad text-white shadow-glow-sm">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="hidden max-w-[110px] truncate sm:inline">
                {user?.fullName ?? 'Account'}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              aria-label="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-full text-mn-mid transition-colors hover:bg-white/10 hover:text-mn-ink"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* Bottom dock — primary navigation pill. */
export function ShopDock() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const links = navLinks.filter((l) => !l.auth || isAuthenticated);

  return (
    <nav
      className="fixed inset-x-0 bottom-5 z-50 flex animate-slide-up justify-center px-4"
      aria-label="Primary"
    >
      <div className="dock flex items-center gap-1 rounded-full p-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                active ? 'text-white' : 'text-mn-mid hover:text-mn-ink'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="shop-dock-active"
                  className="absolute inset-0 rounded-full bg-accent-grad shadow-glow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className={active ? 'inline' : 'hidden sm:inline'}>{link.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
