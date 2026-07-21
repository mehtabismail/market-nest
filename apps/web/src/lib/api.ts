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

export function setGuestSession(sessionId: string) {
  localStorage.setItem('mn_guest_session', sessionId);
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...init } = options ?? {};
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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
