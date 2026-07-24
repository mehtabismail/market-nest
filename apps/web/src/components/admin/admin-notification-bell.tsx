'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { resolveNotificationHref } from '@marketnest/utils';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface FeedItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Compact in-app notification bell for admin (KYC submit fan-out lands here). */
export function AdminNotificationBell() {
  const router = useRouter();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [list, count] = await Promise.all([
        apiFetch<FeedItem[]>('/notifications', { token }),
        apiFetch<{ unread: number }>('/notifications/unread-count', { token }),
      ]);
      setItems(list.slice(0, 12));
      setUnread(count.unread);
    } catch {
      // Non-blocking — queue at /admin/kyc remains the source of truth for action.
    }
  }, [token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  async function markAll() {
    if (!token) return;
    await apiFetch('/notifications/read-all', { method: 'POST', token });
    await load();
  }

  async function openItem(item: FeedItem) {
    if (!token) return;
    const href = resolveNotificationHref({
      type: item.type,
      link: item.link,
      portal: 'admin',
    });

    if (!item.readAt) {
      try {
        await apiFetch(`/notifications/${item.id}/read`, { method: 'PATCH', token });
      } catch {
        /* ignore */
      }
    }

    setOpen(false);
    await load();
    if (href) router.push(href);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-xl p-2 text-mn-mid transition-colors hover:bg-mn-cream hover:text-mn-ink"
        aria-label="Notifications"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-mn-accent px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-mn-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-mn-border px-3 py-2">
            <span className="text-xs font-semibold text-mn-ink">Notifications</span>
            <button type="button" className="text-[10px] text-mn-mid hover:underline" onClick={() => void markAll()}>
              Mark all read
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-4 text-xs text-mn-mid">No notifications yet.</li>
            ) : (
              items.map((item) => {
                const href = resolveNotificationHref({
                  type: item.type,
                  link: item.link,
                  portal: 'admin',
                });
                return (
                  <li
                    key={item.id}
                    className={`border-b border-mn-border/60 ${item.readAt ? '' : 'bg-mn-cream/40'}`}
                  >
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-mn-cream/60"
                      onClick={() => void openItem(item)}
                    >
                      <p className="text-xs font-semibold text-mn-ink">{item.title}</p>
                      {item.body && <p className="mt-0.5 text-[11px] text-mn-mid">{item.body}</p>}
                      {href ? (
                        <p className="mt-1 text-[10px] font-semibold text-mn-gold">Open →</p>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-t border-mn-border px-3 py-2">
            <Link
              href="/admin/kyc"
              className="text-[11px] font-semibold text-mn-gold hover:underline"
              onClick={() => setOpen(false)}
            >
              Open KYC review queue →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
