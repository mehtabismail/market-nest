'use client';

import { useEffect, useState } from 'react';
import { CircleDollarSign, ShoppingBag, Store, Users } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface DashboardStats {
  totalSellers: number;
  totalBuyers: number;
  ordersToday: number;
  gmvToday: number;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<DashboardStats>('/admin/dashboard', { token })
      .then((res) => {
        setStats(res);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <main className="animate-fade-in p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="animate-fade-in p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="brand-text text-2xl">Platform overview</h1>
          <p className="text-sm text-mn-mid">SA-02 — live when authenticated</p>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-mn-accent">{error}</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Active sellers', value: stats?.totalSellers ?? '—', icon: Store },
          { label: 'Buyers', value: stats?.totalBuyers ?? '—', icon: Users },
          { label: 'Orders today', value: stats?.ordersToday ?? '—', icon: ShoppingBag },
          { label: 'GMV today', value: stats ? `$${stats.gmvToday}` : '—', icon: CircleDollarSign },
        ].map((s) => (
          <div key={s.label} className="stat border-l-4 border-l-purple">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-mn-mid">
              <s.icon className="h-4 w-4 text-mn-gold" />
              {s.label}
            </div>
            <div className="stat-value mt-2">{s.value}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
