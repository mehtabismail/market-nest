'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

type KycStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

interface KycApplication {
  id: string;
  status: KycStatus;
  completedStep: number;
  personal: Record<string, unknown>;
  business: Record<string, unknown>;
  documents: Record<string, unknown>;
  bank: Record<string, unknown> & { accountLast4?: string | null };
  submittedAt: string | null;
  seller: { id: string; storeName: string; storeSlug: string; inviteEmail: string | null };
}

const STATUS_TABS: KycStatus[] = ['submitted', 'approved', 'rejected'];

export default function AdminKycPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<KycStatus>('submitted');
  const [apps, setApps] = useState<KycApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setApps(await apiFetch<KycApplication[]>(`/admin/kyc?status=${status}`, { token }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [token, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(app: KycApplication, decision: 'approve' | 'reject') {
    if (!token) return;
    // A rejection the seller can't act on becomes a support ticket, so the API
    // requires a reason — collect it here rather than sending an empty one.
    let reason: string | undefined;
    if (decision === 'reject') {
      const input = window.prompt('Reason for rejection (shown to the seller):');
      if (input === null) return;
      if (!input.trim()) {
        setError('A rejection reason is required.');
        return;
      }
      reason = input.trim();
    }

    setBusyId(app.id);
    setError(null);
    try {
      await apiFetch(`/admin/kyc/${app.id}/decision`, {
        method: 'POST',
        token,
        body: JSON.stringify({ decision, reason }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record decision');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="p-8 animate-fade-in">
      <h1 className="font-outfit text-2xl font-extrabold mb-6">Seller KYC review</h1>
      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`btn ${status === tab ? 'btn-purple' : 'btn-outline'}`}
            onClick={() => setStatus(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : apps.length === 0 ? (
        <p className="text-gray">No {status} applications.</p>
      ) : (
        <div className="grid gap-4">
          {apps.map((app) => (
            <div key={app.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-outfit text-lg font-bold">{app.seller.storeName}</h2>
                  <p className="text-sm text-gray">
                    {app.seller.inviteEmail ?? app.seller.storeSlug}
                    {app.submittedAt ? ` · submitted ${new Date(app.submittedAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                {status === 'submitted' && (
                  <div className="flex gap-2">
                    <button
                      className="btn btn-purple"
                      disabled={busyId === app.id}
                      onClick={() => decide(app, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-outline text-coral"
                      disabled={busyId === app.id}
                      onClick={() => decide(app, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-4 text-sm">
                <Detail title="Personal" data={app.personal} />
                <Detail title="Business" data={app.business} />
                <Detail title="Documents" data={app.documents} />
                <Detail
                  title="Bank"
                  data={{
                    ...app.bank,
                    // The full account number is never returned — only the tail.
                    account: app.bank.accountLast4 ? `••••${app.bank.accountLast4}` : '—',
                    accountLast4: undefined,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function Detail({ title, data }: { title: string; data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, value]) => value != null && value !== '');
  return (
    <div>
      <p className="text-[11px] uppercase font-semibold text-mn-gold mb-1">{title}</p>
      {entries.length === 0 ? (
        <p className="text-gray text-xs">Not provided</p>
      ) : (
        entries.map(([key, value]) => (
          <p key={key} className="text-gray leading-relaxed">
            <span className="font-medium text-mn-ink">{humanize(key)}:</span> {String(value)}
          </p>
        ))
      )}
    </div>
  );
}

function humanize(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}
