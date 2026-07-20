'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CircleDollarSign, LineChart, TrendingUp } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface EarningsAnalytics {
  commissionRate: number;
  allTime: { gross: number; commission: number; net: number };
  week: { gross: number; commission: number; net: number };
  month: { gross: number; commission: number; net: number };
  dailyChart: { date: string; net: number }[];
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export function AnalyticsClient() {
  const { token } = useAuth();
  const [data, setData] = useState<EarningsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await apiFetch<EarningsAnalytics>('/seller/earnings', { token });
        setData(res);
        setError(null);
      } catch (e) {
        setData(null);
        setError(e instanceof Error ? e.message : 'Could not load analytics');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [token]);

  const chartMax = useMemo(
    () => Math.max(...(data?.dailyChart.map((d) => d.net) ?? [1]), 1),
    [data?.dailyChart],
  );

  if (error) {
    return (
      <div className="animate-fade-in p-6">
        <div className="rounded-xl border border-mn-accent/20 bg-mn-accent-soft p-4">
          <p className="text-sm font-medium text-mn-accent">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard className="h-48" />
      </div>
    );
  }

  const statCards = [
    { label: 'Week net', value: data.week.net, icon: CircleDollarSign, color: 'teal' as const },
    { label: 'Month net', value: data.month.net, icon: LineChart, color: 'teal' as const },
    { label: 'All-time gross', value: data.allTime.gross, icon: BarChart3, color: 'teal' as const },
    { label: 'All-time commission', value: data.allTime.commission, icon: CircleDollarSign, color: 'amber' as const },
  ];

  return (
    <div className="animate-fade-in space-y-6 p-6">
      <div>
        <h1 className="brand-text flex items-center gap-2 text-2xl text-mn-teal">
          Analytics
          <TrendingUp className="h-6 w-6 text-mn-teal" />
        </h1>
        <p className="mt-1 text-sm text-mn-mid">
          Based on delivered orders. Commission: {data.commissionRate}%
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="stat relative overflow-hidden rounded-xl border border-mn-teal/20 bg-gradient-to-br from-white via-white to-mn-teal-soft/20 transition-shadow hover:shadow-lg"
          >
            <div
              className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10"
              style={{
                background:
                  item.color === 'amber'
                    ? 'radial-gradient(circle, #f59e0b 0%, transparent 70%)'
                    : 'radial-gradient(circle, #1a6b5a 0%, transparent 70%)',
              }}
            />

            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase text-mn-mid">{item.label}</div>
              <item.icon
                className={`h-4 w-4 ${item.color === 'amber' ? 'text-amber' : 'text-mn-teal'}`}
              />
            </div>
            <div className={`mt-2 stat-value ${item.color === 'amber' ? 'text-amber' : 'text-mn-teal'}`}>
              {formatCurrency(item.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="card rounded-xl border border-mn-teal/20 bg-gradient-to-br from-white to-mn-teal-soft/10 p-6 transition-shadow hover:shadow-md">
        <h2 className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-mn-teal">
          <LineChart className="h-4 w-4" />
          Daily net earnings (30d)
        </h2>

        {data.dailyChart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="mb-3 h-12 w-12 text-mn-mid" />
            <p className="text-sm text-mn-mid">No delivered orders yet.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="flex h-40 items-end gap-1">
              {data.dailyChart.map((point, i) => {
                const height = Math.max(8, (point.net / chartMax) * 100);
                const isHovered = hoveredBar === i;

                return (
                  <div
                    key={point.date}
                    className="group relative flex-1 cursor-pointer"
                    style={{ height: `${height}%` }}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div
                      className={`h-full w-full rounded-t-md transition-colors ${
                        isHovered ? 'bg-mn-teal' : 'bg-mn-teal-soft hover:bg-mn-teal/60'
                      }`}
                    />

                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2">
                        <div className="whitespace-nowrap rounded-lg bg-mn-ink px-3 py-2 text-xs text-white shadow-lg">
                          <p className="font-semibold">{formatCurrency(point.net)}</p>
                          <p className="text-[10px] text-mn-mid">{point.date}</p>
                        </div>
                        <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-mn-ink" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between text-[10px] text-mn-mid">
              <span>{data.dailyChart[0]?.date}</span>
              <span>{data.dailyChart[data.dailyChart.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Week Gross', value: data.week.gross, sub: 'Before commission' },
          { label: 'Month Gross', value: data.month.gross, sub: 'Before commission' },
          { label: 'All-time Net', value: data.allTime.net, sub: 'After commission' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border/40 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <p className="mb-1 text-xs text-mn-mid">{item.label}</p>
            <p className="text-xl font-bold text-mn-teal">{formatCurrency(item.value)}</p>
            <p className="mt-1 text-[10px] text-mn-mid">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
