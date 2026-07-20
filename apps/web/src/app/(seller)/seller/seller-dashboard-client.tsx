'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Package, ShoppingBag, ShoppingCart, TrendingUp } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

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
    { label: 'Orders today', value: stats.ordersToday, icon: ShoppingCart, isCurrency: false },
    { label: 'Revenue (7d net)', value: stats.revenueWeek, icon: DollarSign, isCurrency: true },
    { label: 'Products', value: stats.productCount, icon: Package, isCurrency: false },
    { label: 'Active orders', value: stats.orderCount, icon: ShoppingBag, isCurrency: false },
    { label: 'Low stock', value: stats.lowStockCount, icon: AlertTriangle, warn: true, isCurrency: false },
  ];

  return (
    <div className="animate-fade-in space-y-6 p-6">
      <div>
        <h1 className="brand-text flex items-center gap-2 text-2xl text-mn-teal">
          Dashboard
          <TrendingUp className="h-6 w-6 text-mn-teal" />
        </h1>
        <p className="mt-1 text-sm text-mn-mid">Live snapshot of your store performance and fulfillment health.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat border-l-4 border-l-teal">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-mn-mid">{card.label}</div>
                <span
                  className={`rounded-lg p-2 ${
                    card.warn ? 'bg-amber-light text-amber' : 'bg-mn-teal-soft text-mn-teal'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className={`stat-value ${card.warn ? 'text-amber' : ''}`}>
                {card.isCurrency ? `$${card.value.toFixed(2)}` : card.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 ${stats.lowStockCount > 0 ? 'bg-amber-light' : 'bg-mn-teal-soft'}`}>
            {stats.lowStockCount > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber" />
            ) : (
              <Package className="h-5 w-5 text-mn-teal" />
            )}
          </div>
          <div>
            <p className="font-semibold text-mn-teal">Focus now</p>
            <p className="mt-1 text-sm text-mn-ink">
              {stats.lowStockCount > 0
                ? `${stats.lowStockCount} products are low on stock. Replenish soon to avoid missed sales.`
                : 'Stock levels look healthy across your current catalog.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
