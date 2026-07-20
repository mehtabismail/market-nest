'use client';

import { useEffect, useState } from 'react';
import { SkeletonCard, TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface Analytics {
  gmv: number;
  orderCount: number;
  averageOrderValue: number;
  newBuyers: number;
  newSellers: number;
  dailyGmv: { date: string; gmv: number; orders: number }[];
  topSellers: { storeName: string; gmv: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<Analytics>('/admin/analytics?days=30', { token })
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [token]);

  async function downloadCsv() {
    if (!token) return;
    const res = await apiFetch<{ csv: string; filename: string }>('/admin/analytics/export?days=30', {
      token,
    });
    const blob = new Blob([res.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename;
    a.click();
  }

  if (loading) {
    return (
      <main className="p-8 animate-fade-in space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <TableSkeleton rows={6} cols={4} />
      </main>
    );
  }

  return (
    <main className="p-8 animate-fade-in">
      <div className="flex justify-between mb-8">
        <h1 className="font-outfit text-2xl font-extrabold">Analytics (30 days)</h1>
        <button type="button" className="btn btn-purple btn-sm" onClick={downloadCsv}>
          Export CSV
        </button>
      </div>
      {error && <p className="text-sm text-coral mb-4">{error}</p>}
      {!data ? null : (
        <>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat border-l-4 border-l-purple">
          <div className="text-xs uppercase text-gray">GMV</div>
          <div className="font-outfit text-2xl font-extrabold">${data.gmv.toFixed(0)}</div>
        </div>
        <div className="stat">
          <div className="text-xs uppercase text-gray">Orders</div>
          <div className="font-outfit text-2xl font-extrabold">{data.orderCount}</div>
        </div>
        <div className="stat">
          <div className="text-xs uppercase text-gray">AOV</div>
          <div className="font-outfit text-2xl font-extrabold">${data.averageOrderValue}</div>
        </div>
        <div className="stat">
          <div className="text-xs uppercase text-gray">New buyers</div>
          <div className="font-outfit text-2xl font-extrabold">{data.newBuyers}</div>
        </div>
      </div>
      <div className="card p-6 mb-8">
        <h2 className="font-bold text-sm mb-4">Daily GMV</h2>
        <div className="flex items-end gap-1 h-32">
          {data.dailyGmv.map((d) => (
            <div
              key={d.date}
              className="flex-1 bg-purple-light rounded-t-sm"
              style={{
                height: `${Math.max(4, (d.gmv / (data.gmv || 1)) * 100)}%`,
              }}
              title={`${d.date}: $${d.gmv}`}
            />
          ))}
        </div>
      </div>
      <div className="card p-6">
        <h2 className="font-bold text-sm mb-4">Top sellers</h2>
        <ul className="space-y-2 text-sm">
          {data.topSellers.map((s, i) => (
            <li key={i} className="flex justify-between">
              <span>{s.storeName}</span>
              <span className="font-bold text-purple">${s.gmv.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
        </>
      )}
    </main>
  );
}
