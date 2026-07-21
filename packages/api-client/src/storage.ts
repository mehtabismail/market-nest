/**
 * Where the session token and guest cart id live.
 *
 * Deliberately async on every method: the web adapter wraps localStorage (sync)
 * while React Native uses expo-secure-store (async, Keychain/Keystore backed).
 * Keeping the interface async lets one client serve both without the mobile
 * adapter having to fake synchronous reads.
 */
export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;

  getGuestSession(): Promise<string | null>;
  setGuestSession(sessionId: string): Promise<void>;
  clearGuestSession(): Promise<void>;
}

/** Non-persistent fallback, for tests and server-side rendering. */
export function createMemoryStorage(): TokenStorage {
  let token: string | null = null;
  let guest: string | null = null;

  return {
    getToken: async () => token,
    setToken: async (value) => {
      token = value;
    },
    clearToken: async () => {
      token = null;
    },
    getGuestSession: async () => guest,
    setGuestSession: async (value) => {
      guest = value;
    },
    clearGuestSession: async () => {
      guest = null;
    },
  };
}
