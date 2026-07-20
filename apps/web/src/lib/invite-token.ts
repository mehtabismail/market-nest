/** Parse Supabase auth tokens from URL hash or query string. */
export function parseAuthTokensFromUrl(searchParams?: URLSearchParams) {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null, type: null };
  }

  const hash = window.location.hash.replace(/^#/, '');
  const hashParams = new URLSearchParams(hash);
  const queryParams = searchParams ?? new URLSearchParams(window.location.search);

  return {
    accessToken: hashParams.get('access_token') ?? queryParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token') ?? queryParams.get('refresh_token'),
    type: hashParams.get('type') ?? queryParams.get('type'),
  };
}

export function emailFromAccessToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}
