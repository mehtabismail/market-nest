'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: string | number;
  minSubtotal: string | number;
  maxDiscount: string | number | null;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

function formatValue(coupon: Coupon): string {
  return coupon.type === 'percentage' ? `${Number(coupon.value)}%` : `$${Number(coupon.value).toFixed(2)}`;
}

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setCoupons(await apiFetch<Coupon[]>('/admin/coupons', { token }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    try {
      await apiFetch('/admin/coupons', {
        method: 'POST',
        token,
        body: JSON.stringify({
          code: fd.get('code'),
          description: (fd.get('description') as string) || undefined,
          type: fd.get('type'),
          value: Number(fd.get('value')),
          minSubtotal: Number(fd.get('minSubtotal') || 0),
          maxDiscount: fd.get('maxDiscount') ? Number(fd.get('maxDiscount')) : undefined,
          usageLimit: fd.get('usageLimit') ? Number(fd.get('usageLimit')) : undefined,
          endsAt: (fd.get('endsAt') as string) || undefined,
        }),
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coupon');
    }
  }

  async function toggleActive(coupon: Coupon) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update coupon');
    }
  }

  async function remove(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/coupons/${id}`, { method: 'DELETE', token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  }

  if (loading) {
    return (
      <main className="p-8 animate-fade-in">
        <TableSkeleton rows={8} cols={5} />
      </main>
    );
  }

  return (
    <main className="p-8 animate-fade-in">
      <h1 className="font-outfit text-2xl font-extrabold mb-6">Coupons</h1>
      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <form onSubmit={handleCreate} className="card p-6 mb-6 max-w-3xl grid gap-3 md:grid-cols-2">
        <input className="input" name="code" placeholder="Code (e.g. SAVE20)" required />
        <select className="input" name="type" defaultValue="percentage">
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </select>
        <input className="input" name="value" type="number" step="0.01" placeholder="Value (20 = 20% or $20)" required />
        <input className="input" name="minSubtotal" type="number" step="0.01" placeholder="Min subtotal" defaultValue={0} />
        <input className="input" name="maxDiscount" type="number" step="0.01" placeholder="Max discount (optional)" />
        <input className="input" name="usageLimit" type="number" placeholder="Usage limit (optional)" />
        <input className="input md:col-span-2" name="description" placeholder="Description" />
        <label className="text-xs text-gray md:col-span-2">
          Ends at (optional)
          <input className="input mt-1" name="endsAt" type="datetime-local" />
        </label>
        <button type="submit" className="btn btn-purple md:col-span-2">
          Create coupon
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Discount</th>
              <th className="p-3 text-left">Min</th>
              <th className="p-3 text-left">Used</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-t border-gray-light">
                <td className="p-3 font-semibold">{coupon.code}</td>
                <td className="p-3">{formatValue(coupon)}</td>
                <td className="p-3 text-gray">${Number(coupon.minSubtotal).toFixed(0)}</td>
                <td className="p-3 text-gray">
                  {coupon.usedCount}
                  {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ''}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      coupon.isActive ? 'bg-teal/10 text-teal' : 'bg-gray-light text-gray'
                    }`}
                  >
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <button className="btn btn-outline" onClick={() => toggleActive(coupon)}>
                    {coupon.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn btn-outline text-coral" onClick={() => remove(coupon.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray" colSpan={6}>
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
