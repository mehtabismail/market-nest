'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthTokenPair } from '@marketnest/shared-types';
import {
  apiFetch,
  clearPersistedSession,
  mergeGuestCartIfPresent,
  persistSession,
  UNAUTHORIZED_EVENT,
} from '@/lib/api';

export type UserRole = 'buyer' | 'seller' | 'superadmin';

/** Human-readable role name, for copy shown when a session is wrong for a portal. */
export const ROLE_LABEL: Record<UserRole, string> = {
  buyer: 'customer',
  seller: 'seller',
  superadmin: 'administrator',
};

export interface AuthUser {
  id: string;
  role: UserRole;
  fullName: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  seller?: {
    id: string;
    storeName: string;
    storeSlug: string;
    isVerified?: boolean;
    status?: string;
    kycStatus?: string | null;
    rejectionReason?: string | null;
  } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Re-load profile from `/auth/me` (token refresh is handled by the API client). */
  refresh: () => Promise<void>;
  setSession: (session: AuthTokenPair) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
    if (!stored) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Let the API client attach the token (and refresh on 401).
      const me = await apiFetch<AuthUser>('/auth/me');
      const latest = localStorage.getItem('mn_token') ?? stored;
      setToken(latest);
      setUser(me);
      await mergeGuestCartIfPresent(latest);
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      await clearPersistedSession();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUnauthorized = () => {
      void clearPersistedSession();
      setToken(null);
      setUser(null);
      setLoading(false);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const setSession = useCallback(async (session: AuthTokenPair) => {
    await persistSession(session.accessToken, session.refreshToken);
    setToken(session.accessToken);
    setLoading(true);
    try {
      const me = await apiFetch<AuthUser>('/auth/me', { token: session.accessToken });
      setUser(me);
      return me;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const access = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        anonymous: !access,
        token: access ?? undefined,
      });
    } catch {
      // Always clear locally.
    }
    await clearPersistedSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      refresh,
      setSession,
      logout,
    }),
    [user, token, loading, refresh, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
