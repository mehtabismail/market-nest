const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Broadcast when the API rejects a token, so AuthProvider can clear the session. */
export const UNAUTHORIZED_EVENT = 'mn:unauthorized';

export class ApiError extends Error {
  readonly status: number;
  /** Raw message from the API, for logging. Never render this directly. */
  readonly detail: string;

  constructor(status: number, message: string, detail: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }
}

/**
 * Turns a transport failure into copy that is safe to render.
 *
 * Validation errors (400/422) keep the API's message — class-validator produces
 * specific, useful text like "email must be an email". Everything else is
 * replaced: permission and infrastructure failures otherwise surface raw
 * strings such as "Forbidden" to end users.
 */
function userFacingMessage(status: number, detail: string): string {
  if (status === 400 || status === 422) {
    return detail || 'Please check the details you entered and try again.';
  }
  switch (status) {
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'We could not find what you were looking for.';
    case 409:
      return detail || 'That conflicts with something that already exists.';
    case 429:
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return status >= 500
        ? 'Something went wrong on our end. Please try again in a moment.'
        : detail || 'Request failed. Please try again.';
  }
}

export function getGuestSession(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mn_guest_session');
}

/**
 * The session token, attached to every request unless a caller passes its own.
 *
 * This must not be opt-in. The API resolves a cart key as "user id if present,
 * otherwise guest session", so a cart request sent without the token silently
 * targets the guest cart while checkout — which did send one — reads the user
 * cart. That mismatch made every checkout fail with "Cart is empty". Attaching
 * the token centrally makes the whole class of bug impossible.
 */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mn_token');
}

export function setGuestSession(sessionId: string) {
  localStorage.setItem('mn_guest_session', sessionId);
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...init } = options ?? {};
  const authToken = token ?? getStoredToken();
  const guest = getGuestSession();
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(guest ? { 'x-guest-session': guest } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    // fetch() only rejects on network-level failure, never on HTTP status.
    throw new ApiError(0, 'Could not reach the server. Check your connection.', 'network error');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    const detail = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? res.statusText ?? '');

    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(res.status, userFacingMessage(res.status, detail), detail);
  }

  return res.json() as Promise<T>;
}

export async function ensureGuestSession() {
  if (getGuestSession()) return;
  const data = await apiFetch<{ sessionId: string }>('/cart/guest-session', {
    method: 'POST',
  });
  setGuestSession(data.sessionId);
}

/**
 * Folds a lingering guest cart into the signed-in user's cart.
 *
 * Merge used to run only on the login screen, so a cart stranded in the guest
 * namespace — by a failed merge, or by adding items before signing in — stayed
 * invisible to checkout forever. Running it whenever a session is restored lets
 * those carts recover on the next page load. No-ops without a guest session.
 */
export async function mergeGuestCartIfPresent(token: string): Promise<void> {
  if (!getGuestSession()) return;
  try {
    await apiFetch('/cart/merge', { method: 'POST', token });
    localStorage.removeItem('mn_guest_session');
  } catch {
    // Never block sign-in on a cart merge; it retries on the next load.
  }
}
