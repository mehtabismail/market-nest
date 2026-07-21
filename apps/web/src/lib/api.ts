/**
 * Web binding for the shared API client.
 *
 * The transport, error mapping and cart-session logic live in
 * @marketnest/api-client so the Expo app shares them. This file only supplies
 * the browser-specific pieces: localStorage-backed token storage and a DOM
 * event for session expiry.
 */
import {
  ApiError,
  createApiClient,
  type RequestOptions,
  type TokenStorage,
} from '@marketnest/api-client';

const TOKEN_KEY = 'mn_token';
const GUEST_KEY = 'mn_guest_session';

/** Broadcast when the API rejects a token, so AuthProvider can clear the session. */
export const UNAUTHORIZED_EVENT = 'mn:unauthorized';

export { ApiError };

function read(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

const webStorage: TokenStorage = {
  getToken: async () => read(TOKEN_KEY),
  setToken: async (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: async () => localStorage.removeItem(TOKEN_KEY),
  getGuestSession: async () => read(GUEST_KEY),
  setGuestSession: async (id) => localStorage.setItem(GUEST_KEY, id),
  clearGuestSession: async () => localStorage.removeItem(GUEST_KEY),
};

const client = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  storage: webStorage,
  credentials: 'include',
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
  },
});

export function getGuestSession(): string | null {
  return read(GUEST_KEY);
}

export function setGuestSession(sessionId: string) {
  localStorage.setItem(GUEST_KEY, sessionId);
}

export function apiFetch<T>(path: string, options?: RequestOptions): Promise<T> {
  return client.request<T>(path, options);
}

export function ensureGuestSession(): Promise<void> {
  return client.ensureGuestSession();
}

export function mergeGuestCartIfPresent(token: string): Promise<void> {
  return client.mergeGuestCartIfPresent(token);
}
