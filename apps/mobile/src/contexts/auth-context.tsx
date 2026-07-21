import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setUnauthorizedHandler } from '../lib/api';
import { secureStorage } from '../lib/storage';

export type UserRole = 'buyer' | 'seller' | 'superadmin';

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
  loading: boolean;
  isAuthenticated: boolean;
  /** True only for customer sessions. Seller features will widen this later. */
  isBuyer: boolean;
  refresh: () => Promise<void>;
  signIn: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await secureStorage.clearToken();
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
      const me = await api.request<AuthUser>('/auth/me', { token });
      setUser(me);
      // Recover a cart left behind in the guest namespace.
      await api.mergeGuestCartIfPresent(token);
    } catch {
      await secureStorage.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // The API rejected our token mid-session. Clear it so the UI shows a sign-in
  // prompt rather than failing every request against a token the server no
  // longer accepts.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const signIn = useCallback(
    async (accessToken: string) => {
      await secureStorage.setToken(accessToken);
      setLoading(true);
      try {
        const me = await api.request<AuthUser>('/auth/me', { token: accessToken });
        setUser(me);
        await api.mergeGuestCartIfPresent(accessToken);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isBuyer: user?.role === 'buyer',
      refresh,
      signIn,
      signOut,
    }),
    [user, loading, refresh, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
