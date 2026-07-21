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
import { apiFetch, UNAUTHORIZED_EVENT } from '@/lib/api';

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
  seller?: { id: string; storeName: string; storeSlug: string } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  setSession: (token: string) => Promise<void>;
  logout: () => void;
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
      const me = await apiFetch<AuthUser>('/auth/me', { token: stored });
      setToken(stored);
      setUser(me);
    } catch {
      localStorage.removeItem('mn_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The API rejected our token mid-session (expiry or revocation). Clear the
  // session so surfaces render a sign-in prompt instead of failing silently
  // against a token the server no longer accepts.
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem('mn_token');
      setToken(null);
      setUser(null);
      setLoading(false);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const setSession = useCallback(
    async (accessToken: string) => {
      localStorage.setItem('mn_token', accessToken);
      setToken(accessToken);
      setLoading(true);
      try {
        const me = await apiFetch<AuthUser>('/auth/me', { token: accessToken });
        setUser(me);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('mn_token');
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
