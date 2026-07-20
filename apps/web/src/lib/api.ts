const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(guest ? { 'x-guest-session': guest } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(
      Array.isArray(err.message) ? err.message.join(', ') : (err.message ?? 'API request failed'),
    );
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
