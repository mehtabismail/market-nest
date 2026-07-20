'use client';

import { useEffect, useState } from 'react';
import { BadgeDollarSign, CalendarDays, CircleDollarSign, Wallet } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface Earnings {
  commissionRate: number;
  allTime: { gross: number; commission: number; net: number };
  week: { gross: number; commission: number; net: number };
  month: { gross: number; commission: number; net: number };
  dailyChart: { date: string; net: number }[];
}

export function EarningsClient() {
  const { token } = useAuth();
  const [data, setData] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEarnings() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await apiFetch<Earnings>('/seller/earnings', { token });
        setData(res);
        setError(null);
      } catch (e) {
        setData(null);
        setError(e instanceof Error ? e.message : 'Could not load earnings');
      } finally {
        setLoading(false);
      }
    }

    loadEarnings();
  }, [token]);

  if (error) {
    return <p className="text-sm text-coral">{error}</p>;
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard className="h-44" />
      </div>
    );
  }

  const stats = [
    { label: 'This week (net)', value: data.week.net, icon: CalendarDays },
    { label: 'This month (net)', value: data.month.net, icon: BadgeDollarSign },
    { label: 'All time (net)', value: data.allTime.net, icon: Wallet },
  ];

  const maxBar = Math.max(...data.dailyChart.map((d) => d.net), 1);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="brand-text text-2xl text-teal-dark">Earnings</h1>
        <p className="text-sm text-gray">Commission rate: {data.commissionRate}%</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat border border-teal-light/40 bg-gradient-to-b from-white to-teal-light/10">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] uppercase text-gray font-semibold">{s.label}</div>
              <s.icon className="h-4 w-4 text-teal-dark" />
            </div>
            <div className="mt-2 stat-value text-teal">
              ${s.value.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <div className="card border border-teal-light/40 p-6">
        <h2 className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-teal-dark">
          <CircleDollarSign className="h-4 w-4" />
          Daily net earnings (30d)
        </h2>
        {data.dailyChart.length === 0 ? (
          <p className="text-sm text-gray">No delivered orders yet.</p>
        ) : (
          <div className="flex h-24 items-end gap-1">
            {data.dailyChart.map((d) => (
              <div
                key={d.date}
                className="min-h-[4px] flex-1 rounded-t-sm bg-teal-light"
                style={{ height: `${Math.max(8, (d.net / maxBar) * 100)}%` }}
                title={`${d.date}: $${d.net}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
