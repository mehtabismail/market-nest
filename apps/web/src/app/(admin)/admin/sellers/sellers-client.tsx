'use client';

import { useCallback, useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface SellerRow {
  id: string;
  storeName: string;
  storeSlug: string;
  inviteEmail: string | null;
  commissionRate: string | number;
  status: string;
  isActive: boolean;
  userId?: string | null;
  user?: { id: string; fullName: string | null } | null;
  _count?: { products: number };
}

export function SellersClient() {
  const { token } = useAuth();
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [busySellerId, setBusySellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch<{ items: SellerRow[] }>('/admin/sellers', { token });
      setSellers(res.items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [load]);

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const fd = new FormData(e.currentTarget);
    try {
      setError(null);
      setNotice(null);
      setDevLink(null);
      const res = await apiFetch<{ actionLink?: string | null; emailBypass?: boolean }>(
        '/admin/sellers',
        {
          method: 'POST',
          token,
          body: JSON.stringify({
            storeName: fd.get('storeName'),
            email: fd.get('email'),
            commissionRate: Number(fd.get('commissionRate')),
          }),
        },
      );
      setShowInvite(false);
      if (res.actionLink) {
        setDevLink(res.actionLink);
        setNotice('Email bypass active — open the link below to activate the seller (no email sent).');
      } else {
        setNotice('Invite sent.');
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    }
  }

  async function runSellerAction(sellerId: string, action: () => Promise<void>) {
    setBusySellerId(sellerId);
    setError(null);
    setNotice(null);
    setDevLink(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seller action failed');
    } finally {
      setBusySellerId(null);
    }
  }

  function suspendSeller(seller: SellerRow) {
    if (!token) return;
    const reason = window.prompt(`Suspend ${seller.storeName} reason:`)?.trim();
    if (!reason) return;
    void runSellerAction(seller.id, async () => {
      await apiFetch(`/admin/sellers/${seller.id}/suspend`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ reason }),
      });
      setNotice(`Suspended ${seller.storeName}.`);
    });
  }

  function reactivateSeller(seller: SellerRow) {
    if (!token) return;
    void runSellerAction(seller.id, async () => {
      await apiFetch(`/admin/sellers/${seller.id}/reactivate`, { method: 'PATCH', token });
      setNotice(`Reactivated ${seller.storeName}.`);
    });
  }

  function resendInvite(seller: SellerRow) {
    if (!token) return;
    void runSellerAction(seller.id, async () => {
      const res = await apiFetch<{
        ok: boolean;
        kind?: 'invite' | 'reset';
        actionLink?: string | null;
      }>(`/admin/sellers/${seller.id}/resend-invite`, { method: 'POST', token });
      if (res.actionLink) {
        setDevLink(res.actionLink);
        setNotice(
          res.kind === 'reset'
            ? `Email bypass active — password reset link for ${seller.inviteEmail ?? seller.storeName}:`
            : `Email bypass active — invite link for ${seller.inviteEmail ?? seller.storeName}:`,
        );
      } else {
        setNotice(
          res.kind === 'reset'
            ? `Password reset link sent to ${seller.inviteEmail ?? seller.storeName}.`
            : `Invite resent to ${seller.inviteEmail ?? seller.storeName}.`,
        );
      }
    });
  }

  function sellerStatusLabel(seller: SellerRow) {
    if (seller.status === 'invited' && seller.userId) return 'active (pending login)';
    if (seller.status === 'invited') return 'invited';
    return seller.status;
  }

  function canResendAccess(seller: SellerRow) {
    return seller.status !== 'deleted' && Boolean(seller.inviteEmail);
  }

  function deleteSeller(seller: SellerRow) {
    if (!token) return;
    if (!window.confirm(`Delete seller "${seller.storeName}"? This archives their products.`)) return;
    void runSellerAction(seller.id, async () => {
      await apiFetch(`/admin/sellers/${seller.id}`, { method: 'DELETE', token });
      setNotice(`Deleted ${seller.storeName}.`);
    });
  }

  if (loading) {
    return <TableSkeleton rows={8} cols={5} />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between mb-6">
        <h1 className="font-outfit text-2xl font-extrabold">Seller management</h1>
        <button type="button" className="btn btn-purple btn-sm" onClick={() => setShowInvite(true)}>
          + Invite seller
        </button>
      </div>

      {notice && <p className="text-sm text-teal mb-4">{notice}</p>}
      {devLink && (
        <div className="card p-4 mb-4 max-w-2xl space-y-2 border border-teal/30 bg-teal-light/30">
          <p className="text-xs font-semibold text-teal-dark uppercase tracking-wide">Testing link (copy & open)</p>
          <a href={devLink} className="text-sm text-blue break-all hover:underline" target="_blank" rel="noreferrer">
            {devLink}
          </a>
          <button
            type="button"
            className="btn btn-sm btn-teal"
            onClick={() => {
              void navigator.clipboard.writeText(devLink);
              setNotice('Link copied to clipboard.');
            }}
          >
            Copy link
          </button>
        </div>
      )}
      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      {showInvite && (
        <form onSubmit={invite} className="card p-6 mb-6 max-w-md space-y-3">
          <input className="input" name="storeName" placeholder="Store name" required />
          <input className="input" name="email" type="email" placeholder="Seller email" required />
          <input
            className="input"
            name="commissionRate"
            type="number"
            defaultValue={10}
            placeholder="Commission %"
          />
          <button type="submit" className="btn btn-purple">
            Send invite
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Store</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Commission</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.storeName}</td>
                <td className="p-3 text-gray">{s.inviteEmail ?? '—'}</td>
                <td className="p-3">{Number(s.commissionRate)}%</td>
                <td className="p-3">{sellerStatusLabel(s)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {s.isActive && s.status !== 'deleted' && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => suspendSeller(s)}
                        disabled={busySellerId === s.id}
                      >
                        Suspend
                      </button>
                    )}
                    {!s.isActive && s.status !== 'deleted' && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => reactivateSeller(s)}
                        disabled={busySellerId === s.id}
                      >
                        Reactivate
                      </button>
                    )}
                    {canResendAccess(s) && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => resendInvite(s)}
                        disabled={busySellerId === s.id}
                      >
                        {s.status === 'invited' && !s.userId ? 'Resend invite' : 'Send access link'}
                      </button>
                    )}
                    {s.status !== 'deleted' && (
                      <button
                        type="button"
                        className="btn btn-sm text-coral"
                        onClick={() => deleteSeller(s)}
                        disabled={busySellerId === s.id}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
