'use client';

import { useCallback, useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface AdminPayout {
  id: string;
  amount: string | number;
  grossAmount: string | number;
  commissionAmount: string | number;
  netAmount: string | number;
  status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  seller: {
    id: string;
    storeName: string;
    inviteEmail: string | null;
  };
}

export function PayoutsClient() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { token } = useAuth();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<AdminPayout[]>('/admin/payouts', { token });
      setPayouts(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function generateWeeklyPayouts() {
    if (!token) return;
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch<{ created: number }>('/admin/payouts/generate-weekly', {
        method: 'POST',
        token,
      });
      setNotice(`Generated ${res.created} weekly payout(s).`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate payouts');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <TableSkeleton rows={8} cols={7} />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between mb-6">
        <h1 className="font-outfit text-2xl font-extrabold">Payouts</h1>
        <button
          type="button"
          className="btn btn-purple btn-sm"
          onClick={generateWeeklyPayouts}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate weekly payouts'}
        </button>
      </div>

      {notice && <p className="text-sm text-teal mb-4">{notice}</p>}
      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Seller</th>
              <th className="p-3 text-left">Gross</th>
              <th className="p-3 text-left">Commission</th>
              <th className="p-3 text-left">Net</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Period</th>
              <th className="p-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id} className="border-t">
                <td className="p-3 font-medium">{payout.seller.storeName}</td>
                <td className="p-3">${Number(payout.grossAmount ?? payout.amount).toFixed(2)}</td>
                <td className="p-3">${Number(payout.commissionAmount).toFixed(2)}</td>
                <td className="p-3">${Number(payout.netAmount).toFixed(2)}</td>
                <td className="p-3">{payout.status}</td>
                <td className="p-3 text-xs text-gray">
                  {new Date(payout.periodStart).toLocaleDateString()} -{' '}
                  {new Date(payout.periodEnd).toLocaleDateString()}
                </td>
                <td className="p-3 text-xs text-gray">{new Date(payout.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && payouts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray">
                  No payouts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
