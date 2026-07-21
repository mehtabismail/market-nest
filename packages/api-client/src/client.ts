import { ApiError, userFacingMessage } from './errors';
import type { TokenStorage } from './storage';

export interface ApiClientConfig {
  /** Origin only, no trailing slash. The /api/v1 prefix is added here. */
  baseUrl: string;
  storage: TokenStorage;
  /**
   * Called when the API rejects the stored token. Platform decides what that
   * means — the web app clears its auth context, mobile pops the sign-in stack.
   */
  onUnauthorized?: () => void;
  /**
   * Web sends 'include' so the httpOnly guest-cart cookie travels with the
   * request. React Native has no cookie jar and relies solely on the
   * x-guest-session header, so mobile leaves this unset.
   */
  credentials?: RequestCredentials;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null;
  /** Overrides the stored token for this request. */
  token?: string;
  /** Skip the Authorization header entirely. */
  anonymous?: boolean;
}

const API_PREFIX = '/api/v1';

export interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  ensureGuestSession(): Promise<void>;
  mergeGuestCartIfPresent(token?: string): Promise<void>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, storage, onUnauthorized, credentials } = config;

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { token, anonymous, headers, ...init } = options;

    // Attaching the token is opt-out, never opt-in. The API resolves a cart key
    // as "user id if present, otherwise guest session", so a cart request sent
    // without the token silently targets the guest cart while checkout reads
    // the user cart — which made every checkout fail with "Cart is empty".
    const authToken = anonymous ? null : (token ?? (await storage.getToken()));
    const guest = await storage.getGuestSession();
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;

    let res: Response;
    try {
      res = await fetch(`${baseUrl}${API_PREFIX}${path}`, {
        ...init,
        ...(credentials ? { credentials } : {}),
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(guest ? { 'x-guest-session': guest } : {}),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(headers as Record<string, string> | undefined),
        },
      });
    } catch {
      // fetch() rejects only on network-level failure, never on HTTP status.
      throw new ApiError(0, userFacingMessage(0, ''), 'network error');
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({ message: res.statusText }))) as {
        message?: string | string[];
      };
      const detail = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? res.statusText ?? '');

      if (res.status === 401) {
        onUnauthorized?.();
      }

      throw new ApiError(res.status, userFacingMessage(res.status, detail), detail);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  /** Guests need a server-issued session id before they can hold a cart. */
  async function ensureGuestSession(): Promise<void> {
    if (await storage.getGuestSession()) return;
    const data = await request<{ sessionId: string }>('/cart/guest-session', {
      method: 'POST',
    });
    await storage.setGuestSession(data.sessionId);
  }

  /**
   * Folds a lingering guest cart into the signed-in user's cart.
   *
   * Runs whenever a session is restored, not just at login, so a cart stranded
   * in the guest namespace recovers instead of staying invisible to checkout.
   */
  async function mergeGuestCartIfPresent(token?: string): Promise<void> {
    if (!(await storage.getGuestSession())) return;
    try {
      await request('/cart/merge', { method: 'POST', token });
      await storage.clearGuestSession();
    } catch {
      // Never block sign-in on a cart merge; it retries on the next load.
    }
  }

  return { request, ensureGuestSession, mergeGuestCartIfPresent };
}
