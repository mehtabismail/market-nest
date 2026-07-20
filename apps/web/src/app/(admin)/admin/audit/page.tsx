'use client';

import { useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<{ items: AuditEntry[] }>('/admin/audit-logs', { token })
      .then((r) => {
        setItems(r.items);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <main className="p-8 animate-fade-in">
        <TableSkeleton rows={8} cols={3} />
      </main>
    );
  }

  return (
    <main className="p-8 animate-fade-in">
      <h1 className="font-outfit text-2xl font-extrabold mb-6">Audit log</h1>
      {error && <p className="text-sm text-coral mb-4">{error}</p>}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Entity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 text-gray text-xs">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="p-3 font-mono text-xs">{e.action}</td>
                <td className="p-3 text-xs">
                  {e.entityType}
                  {e.entityId ? ` — ${e.entityId.slice(0, 8)}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
