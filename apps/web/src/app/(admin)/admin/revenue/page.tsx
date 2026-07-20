'use client';

import { useEffect, useState } from 'react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface RevenueSummary {
  periodDays: number;
  gmv: number;
  commission: number;
  platformOwnedRevenue: number;
  netPlatformRevenue: number;
  orderCount: number;
  daily: {
    date: string;
    gmv: number;
    commission: number;
    netPlatformRevenue: number;
  }[];
}

export default function AdminRevenuePage() {
  const { token } = useAuth();
  const [data, setData] = useState<RevenueSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await apiFetch<RevenueSummary>('/admin/revenue?days=30', { token });
        setData(res);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revenue summary');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  if (loading) {
    return (
      <main className="p-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 animate-fade-in">
      <h1 className="font-outfit text-2xl font-extrabold mb-6">Revenue (30 days)</h1>
      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      {data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="stat border-l-4 border-l-purple">
              <div className="text-xs uppercase text-gray">GMV</div>
              <div className="font-outfit text-2xl font-extrabold">${data.gmv.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="text-xs uppercase text-gray">Commission</div>
              <div className="font-outfit text-2xl font-extrabold">${data.commission.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="text-xs uppercase text-gray">Platform owned</div>
              <div className="font-outfit text-2xl font-extrabold">${data.platformOwnedRevenue.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="text-xs uppercase text-gray">Net platform</div>
              <div className="font-outfit text-2xl font-extrabold text-purple">
                ${data.netPlatformRevenue.toFixed(2)}
              </div>
            </div>
            <div className="stat">
              <div className="text-xs uppercase text-gray">Orders</div>
              <div className="font-outfit text-2xl font-extrabold">{data.orderCount}</div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-sm mb-4">Daily net platform revenue</h2>
            <div className="flex items-end gap-1 h-40">
              {data.daily.map((item) => (
                <div
                  key={item.date}
                  className="flex-1 bg-purple-light rounded-t-sm min-h-[4px]"
                  style={{
                    height: `${Math.max(6, (item.netPlatformRevenue / (data.netPlatformRevenue || 1)) * 100)}%`,
                  }}
                  title={`${item.date}: $${item.netPlatformRevenue.toFixed(2)}`}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
