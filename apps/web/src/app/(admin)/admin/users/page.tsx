'use client';

import { useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

type UserRole = 'buyer' | 'seller' | 'superadmin';

interface UserRow {
  id: string;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  seller: {
    id: string;
    storeName: string;
    isActive: boolean;
    status: string;
  } | null;
}

interface UserResponse {
  items: UserRow[];
  total: number;
  page: number;
  limit: number;
}

const roleBadge: Record<UserRole, string> = {
  buyer: 'bg-gray-light text-gray-dark',
  seller: 'bg-teal-light text-teal-dark',
  superadmin: 'bg-purple-light text-purple-dark',
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserResponse | null>(null);
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const query = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (role !== 'all') query.set('role', role);
        const data = await apiFetch<UserResponse>(`/admin/users?${query.toString()}`, { token });
        setUsers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, page, role]);

  if (loading) {
    return (
      <main className="p-8 animate-fade-in">
        <TableSkeleton rows={8} cols={5} />
      </main>
    );
  }

  return (
    <main className="p-8 animate-fade-in">
      <div className="flex justify-between mb-6">
        <h1 className="font-outfit text-2xl font-extrabold">Users</h1>
        <select
          className="input max-w-[180px]"
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value as UserRole | 'all');
          }}
        >
          <option value="all">All roles</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>

      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-light text-[11px] uppercase text-gray">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Seller profile</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.items.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3 font-medium">{user.fullName ?? 'Unknown user'}</td>
                <td className="p-3">
                  <span className={`badge text-[10px] uppercase ${roleBadge[user.role]}`}>{user.role}</span>
                </td>
                <td className="p-3 text-gray">
                  {user.seller ? `${user.seller.storeName} (${user.seller.status})` : '-'}
                </td>
                <td className="p-3 text-gray">{user.phone ?? '-'}</td>
                <td className="p-3 text-xs text-gray">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {users && users.items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <p className="text-gray">
          Showing page {users?.page ?? page} of {users ? Math.max(1, Math.ceil(users.total / users.limit)) : 1}
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={Boolean(users && page * limit >= users.total)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
