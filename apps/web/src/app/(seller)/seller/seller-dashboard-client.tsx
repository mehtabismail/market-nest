'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Package, ShoppingBag, ShoppingCart, TrendingUp } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/ui/motion';

interface Earnings {
  week: { net: number };
}

interface SellerProduct {
  id: string;
  stockQty: number;
}

interface SellerOrderGroup {
  orderId: string;
  createdAt: string;
}

interface SellerDashboardStats {
  ordersToday: number;
  revenueWeek: number;
  productCount: number;
  lowStockCount: number;
  orderCount: number;
}

export function SellerDashboardClient() {
  const { token } = useAuth();
  const [stats, setStats] = useState<SellerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [earnings, products, orders] = await Promise.all([
          apiFetch<Earnings>('/seller/earnings', { token }),
          apiFetch<SellerProduct[]>('/seller/products', { token }),
          apiFetch<SellerOrderGroup[]>('/seller/orders', { token }),
        ]);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const ordersToday = orders.filter((order) => new Date(order.createdAt) >= startOfDay).length;
        const lowStockCount = products.filter((product) => product.stockQty <= 5).length;

        setStats({
          ordersToday,
          revenueWeek: earnings.week.net,
          productCount: products.length,
          lowStockCount,
          orderCount: orders.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  if (error) {
    return (
      <div className="animate-fade-in p-6">
        <div className="rounded-xl border border-mn-accent/20 bg-mn-accent-soft p-4">
          <p className="text-sm font-medium text-mn-accent">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <div className="h-8 w-40 animate-pulse rounded-lg bg-mn-cream" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded-lg bg-mn-cream" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Orders today', value: stats.ordersToday, icon: ShoppingCart, tone: 'accent' as const, isCurrency: false },
    { label: 'Revenue (7d net)', value: stats.revenueWeek, icon: DollarSign, tone: 'money' as const, isCurrency: true },
    { label: 'Products', value: stats.productCount, icon: Package, tone: 'accent' as const, isCurrency: false },
    { label: 'Active orders', value: stats.orderCount, icon: ShoppingBag, tone: 'accent' as const, isCurrency: false },
    { label: 'Low stock', value: stats.lowStockCount, icon: AlertTriangle, tone: 'warn' as const, isCurrency: false },
  ];

  return (
    <div className="space-y-7 p-6">
      <Reveal y={12}>
        <h1 className="flex items-center gap-2.5 font-syne text-2xl font-extrabold tracking-tight text-mn-ink sm:text-3xl">
          Dashboard
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-grad text-white shadow-glow-sm">
            <TrendingUp className="h-4 w-4" />
          </span>
        </h1>
        <p className="mt-1.5 text-sm text-mn-mid">
          Live snapshot of your store performance and fulfillment health.
        </p>
      </Reveal>

      <StaggerGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const chip =
            card.tone === 'warn'
              ? 'bg-mn-gold-soft text-mn-gold'
              : card.tone === 'money'
                ? 'bg-mn-teal-soft text-mn-teal'
                : 'bg-mn-accent-soft text-mn-accent';
          return (
            <StaggerItem key={card.label} className="h-full">
              <div className="mn-card group relative h-full overflow-hidden p-5">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'rgb(var(--mn-accent) / 0.35)' }}
                />
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-mn-mid">
                    {card.label}
                  </div>
                  <span className={`rounded-xl p-2 ${chip}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div
                  className={`font-mono text-2xl font-semibold tabular-nums tracking-tight ${
                    card.tone === 'warn' ? 'text-mn-gold' : 'text-mn-ink'
                  }`}
                >
                  {card.isCurrency ? `$${card.value.toFixed(2)}` : card.value}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerGroup>

      <Reveal y={14}>
        <div className="mn-card p-5">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-xl p-2.5 ${
                stats.lowStockCount > 0 ? 'bg-mn-gold-soft' : 'bg-mn-teal-soft'
              }`}
            >
              {stats.lowStockCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-mn-gold" />
              ) : (
                <Package className="h-5 w-5 text-mn-teal" />
              )}
            </div>
            <div>
              <p className="font-syne text-base font-bold text-mn-ink">Focus now</p>
              <p className="mt-1 text-sm text-mn-mid">
                {stats.lowStockCount > 0
                  ? `${stats.lowStockCount} products are low on stock. Replenish soon to avoid missed sales.`
                  : 'Stock levels look healthy across your current catalog.'}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
