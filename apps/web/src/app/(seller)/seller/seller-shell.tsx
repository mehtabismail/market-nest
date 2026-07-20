'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Wallet,
  Warehouse,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PortalShell } from '@/components/portal-shell';
import { useAuth } from '@/contexts/auth-context';

const nav = [
  { href: '/seller', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller/products', label: 'Products', icon: Package },
  { href: '/seller/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/seller/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/seller/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/seller/earnings', label: 'Earnings', icon: Wallet },
];

const PUBLIC_PATHS = ['/seller/login', '/seller/set-password'];

export function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);
  const activeNavItem = nav.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));

  function isNavActive(href: string) {
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  if (isPublic) {
    return <div className="seller-theme mn-theme min-h-screen">{children}</div>;
  }

  const initial = (user?.seller?.storeName ?? user?.fullName ?? 'S')[0].toUpperCase();

  return (
    <AuthGuard loginPath="/seller/login" requiredRole={['seller', 'superadmin']} publicPaths={PUBLIC_PATHS}>
      <PortalShell portal="seller" title="Seller Portal">
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-1">
          <aside className="hidden w-56 shrink-0 border-r border-mn-border bg-white p-4 md:block">
            <div className="mb-6 flex items-center gap-2 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mn-teal text-sm font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-mn-ink">
                  {user?.seller?.storeName ?? user?.fullName ?? 'Seller'}
                </div>
                <div className="text-[10px] text-mn-mid">Seller Portal</div>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? 'mn-nav-active' : 'mn-nav-item'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-mn-mid transition-colors hover:text-mn-accent"
              onClick={() => {
                logout();
                router.push('/seller/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </aside>
          <div className="flex-1 animate-fade-in bg-mn-paper">
            <header className="sticky top-0 z-10 border-b border-mn-border bg-mn-paper/95 px-4 py-3 backdrop-blur md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-mn-mid">Seller Portal</p>
                  <p className="text-sm font-semibold text-mn-teal">{activeNavItem?.label ?? 'Dashboard'}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    logout();
                    router.push('/seller/login');
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        active ? 'mn-chip-active' : 'mn-chip'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </header>
            {children}
          </div>
        </div>
      </PortalShell>
    </AuthGuard>
  );
}
