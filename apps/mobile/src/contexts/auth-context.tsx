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
import { api, setUnauthorizedHandler } from '../lib/api';
import { secureStorage } from '../lib/storage';

export type UserRole = 'buyer' | 'seller' | 'superadmin';

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
  loading: boolean;
  isAuthenticated: boolean;
  /** Anyone who can shop — buyers and sellers both (a seller is also a buyer). */
  isBuyer: boolean;
  /** Holds a store — has completed (or begun) seller onboarding. */
  isSeller: boolean;
  /** Re-load profile from `/auth/me` (not token refresh — the API client handles that). */
  refresh: () => Promise<void>;
  signIn: (session: AuthTokenPair) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Upgrades the current account to a seller (self-serve, no admin invite) and
   * refreshes the session so `isSeller` and the seller role take effect. Safe to
   * call when already a seller — the server is idempotent.
   */
  becomeSeller: (storeName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await api.clearSession();
    setUser(null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const token = await secureStorage.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await api.request<AuthUser>('/auth/me');
      setUser(me);
      // Recover a cart left behind in the guest namespace.
      await api.mergeGuestCartIfPresent();
    } catch {
      await api.clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Fired only after access+refresh both fail — silent renew already ran inside
  // the API client.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const signIn = useCallback(async (session: AuthTokenPair) => {
    await api.setSession(session.accessToken, session.refreshToken);
    setLoading(true);
    try {
      const me = await api.request<AuthUser>('/auth/me', { token: session.accessToken });
      setUser(me);
      await api.mergeGuestCartIfPresent(session.accessToken);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const access = await secureStorage.getToken();
    try {
      await api.request('/auth/logout', {
        method: 'POST',
        anonymous: !access,
        token: access ?? undefined,
      });
    } catch {
      // Local clear still proceeds.
    }
    await clearSession();
  }, [clearSession]);

  const becomeSeller = useCallback(
    async (storeName?: string) => {
      await api.request('/seller/onboarding', {
        method: 'POST',
        body: JSON.stringify(storeName ? { storeName } : {}),
      });
      // Re-read /auth/me so the new role + seller record land in context; the
      // server invalidated its own profile cache, so this reflects the upgrade.
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isBuyer: user?.role === 'buyer' || user?.role === 'seller',
      isSeller: user?.role === 'seller' || Boolean(user?.seller),
      refresh,
      signIn,
      signOut,
      becomeSeller,
    }),
    [user, loading, refresh, signIn, signOut, becomeSeller],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
