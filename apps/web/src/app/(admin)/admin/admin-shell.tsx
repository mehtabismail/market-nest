'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgeCheck,
  BarChart3,
  Boxes,
  CircleDollarSign,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Megaphone,
  Package,
  ScrollText,
  ShieldUser,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Tags,
  Truck,
  Users,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PortalShell } from '@/components/portal-shell';
import { useAuth } from '@/contexts/auth-context';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/sellers', label: 'Sellers', icon: Store },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/fulfilment', label: 'Fulfilment', icon: Truck },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/featured', label: 'Featured', icon: Star },
  { href: '/admin/categories', label: 'Categories', icon: ListOrdered },
  { href: '/admin/brands', label: 'Brands', icon: Tags },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/kyc', label: 'KYC review', icon: BadgeCheck },
  { href: '/admin/banners', label: 'Banners', icon: Megaphone },
  { href: '/admin/payouts', label: 'Payouts', icon: CircleDollarSign },
  { href: '/admin/revenue', label: 'Revenue', icon: Boxes },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
];

const PUBLIC_PATHS = ['/admin/login'];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);
  const activeNavItem = nav.find((item) =>
    item.href === '/admin' ? pathname === item.href : pathname?.startsWith(`${item.href}/`) || pathname === item.href,
  );

  function isNavActive(href: string) {
    if (href === '/admin') return pathname === href;
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  if (isPublic) {
    return <div className="admin-theme mn-theme min-h-screen">{children}</div>;
  }

  return (
    <AuthGuard loginPath="/admin/login" requiredRole="superadmin" publicPaths={PUBLIC_PATHS}>
      <PortalShell portal="admin" title="Super Admin">
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-1">
          <aside className="hidden w-56 shrink-0 border-r border-mn-border bg-white p-4 lg:block">
            <div className="mb-6 flex items-center gap-2 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mn-cream text-mn-gold">
                <ShieldUser className="h-4 w-4" />
              </div>
              <div>
                <div className="truncate text-xs font-semibold text-mn-ink">{user?.fullName ?? 'Super Admin'}</div>
                <div className="text-[10px] text-mn-mid">Platform</div>
              </div>
            </div>
            <nav className="flex max-h-[calc(100vh-12rem)] flex-col gap-1 overflow-y-auto">
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
                router.push('/admin/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </aside>
          <div className="flex-1 animate-fade-in bg-mn-paper">
            <header className="sticky top-0 z-10 border-b border-mn-border bg-mn-paper/95 px-4 py-3 backdrop-blur lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-mn-mid">Super Admin</p>
                  <p className="text-sm font-semibold text-mn-gold">{activeNavItem?.label ?? 'Dashboard'}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    logout();
                    router.push('/admin/login');
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
