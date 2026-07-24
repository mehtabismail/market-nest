import { ApiError, userFacingMessage } from './errors';
import type { TokenStorage } from './storage';

export interface ApiClientConfig {
  /** Origin only, no trailing slash. The /api/v1 prefix is added here. */
  baseUrl: string;
  storage: TokenStorage;
  /**
   * Called when the API rejects the stored token *and* refresh failed (or no
   * refresh token exists). Platform decides what that means — the web app
   * clears its auth context, mobile pops the sign-in stack.
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
  /** Internal: set after a successful token refresh retry. */
  _retried?: boolean;
}

const API_PREFIX = '/api/v1';

/**
 * Detect multipart bodies across web and React Native.
 *
 * RN's FormData polyfill often fails `instanceof FormData` when the value
 * crosses the Metro / workspace package boundary (app → `@marketnest/api-client`
 * dist). Treating it as JSON then sets `Content-Type: application/json` on a
 * multipart body, and fetch rejects with a bare "Network request failed" —
 * which surfaces as "Could not reach the server" on KYC/product uploads.
 */
function isFormDataBody(body: BodyInit | null | undefined): boolean {
  if (body == null || typeof body !== 'object') return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true;
  return Array.isArray((body as { _parts?: unknown })._parts);
}

export interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  ensureGuestSession(): Promise<void>;
  mergeGuestCartIfPresent(token?: string): Promise<void>;
  /** Persist access (+ optional refresh) after login/register. */
  setSession(accessToken: string, refreshToken?: string | null): Promise<void>;
  /** Clear both tokens locally (does not call the API). */
  clearSession(): Promise<void>;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, storage, onUnauthorized, credentials } = config;

  /** Single-flight: concurrent 401s share one refresh attempt. */
  let refreshInFlight: Promise<boolean> | null = null;

  async function clearSession(): Promise<void> {
    await storage.clearToken();
    await storage.clearRefreshToken();
  }

  async function setSession(accessToken: string, refreshToken?: string | null): Promise<void> {
    await storage.setToken(accessToken);
    // Always replace refresh on a new session so a prior user's token cannot linger.
    if (refreshToken) {
      await storage.setRefreshToken(refreshToken);
    } else {
      await storage.clearRefreshToken();
    }
  }

  function isAuthBootstrapPath(path: string): boolean {
    return (
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/register') ||
      path.startsWith('/auth/refresh') ||
      path.startsWith('/auth/forgot-password') ||
      path.startsWith('/auth/oauth') ||
      path.startsWith('/auth/seller/setup-password')
    );
  }

  async function tryRefreshAccessToken(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) return false;

        const res = await fetch(`${baseUrl}${API_PREFIX}/auth/refresh`, {
          method: 'POST',
          ...(credentials ? { credentials } : {}),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          await clearSession();
          return false;
        }

        const data = (await res.json()) as RefreshResponse;
        if (!data.accessToken || !data.refreshToken) {
          await clearSession();
          return false;
        }

        await setSession(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  }

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { token, anonymous, headers, _retried, ...init } = options;

    // Attaching the token is opt-out, never opt-in. The API resolves a cart key
    // as "user id if present, otherwise guest session", so a cart request sent
    // without the token silently targets the guest cart while checkout reads
    // the user cart — which made every checkout fail with "Cart is empty".
    const authToken = anonymous ? null : (token ?? (await storage.getToken()));
    const guest = await storage.getGuestSession();
    const isFormData = isFormDataBody(init.body);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}${API_PREFIX}${path}`, {
        ...init,
        ...(credentials ? { credentials } : {}),
        headers: {
          // Never set Content-Type for FormData — the runtime must attach the
          // multipart boundary itself.
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
      // Expired access token: refresh once, then retry the original request.
      // Skip bootstrap auth routes and already-retried calls to avoid loops.
      if (
        res.status === 401 &&
        !_retried &&
        !anonymous &&
        !isAuthBootstrapPath(path)
      ) {
        const refreshed = await tryRefreshAccessToken();
        if (refreshed) {
          // Drop a stale explicit token override so the retry uses storage.
          const { token: _stale, ...rest } = options;
          return request<T>(path, { ...rest, _retried: true });
        }
        onUnauthorized?.();
      } else if (res.status === 401) {
        onUnauthorized?.();
      }

      const body = (await res.json().catch(() => ({ message: res.statusText }))) as {
        message?: string | string[];
      };
      const detail = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? res.statusText ?? '');

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

  return { request, ensureGuestSession, mergeGuestCartIfPresent, setSession, clearSession };
}
