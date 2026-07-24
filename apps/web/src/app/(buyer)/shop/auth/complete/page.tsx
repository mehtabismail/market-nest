'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ensureGuestSession, getGuestSession } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

function AuthCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(searchParams.get('error'));

  useEffect(() => {
    if (error) return;

    let cancelled = false;

    async function mergeGuestCart(token: string) {
      if (!getGuestSession()) return;
      try {
        await apiFetch('/cart/merge', { method: 'POST', token });
      } catch {
        // Ignore merge failures so login can continue.
      }
    }

    async function finalizeLogin() {
      try {
        const next = searchParams.get('next') ?? '/shop';
        const supabase = getSupabaseBrowserClient();
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        const accessToken = data.session?.access_token;
        const refreshToken = data.session?.refresh_token;
        if (!accessToken) {
          throw new Error('Could not complete Google sign in. Please try again.');
        }

        const session = await apiFetch<{ accessToken: string; refreshToken?: string }>(
          '/auth/oauth/callback',
          {
            method: 'POST',
            body: JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
            }),
          },
        );

        await setSession({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken ?? refreshToken,
        });
        await ensureGuestSession();
        await mergeGuestCart(session.accessToken);
        router.replace(next.startsWith('/') ? next : '/shop');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Google sign in failed');
        }
      }
    }

    void finalizeLogin();

    return () => {
      cancelled = true;
    };
  }, [error, router, searchParams, setSession]);

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <div className="card p-8 text-center">
        <h1 className="mb-3 font-outfit text-xl font-bold text-mn-ink">Completing sign in</h1>
        {!error ? (
          <p className="text-sm text-mn-mid">Please wait while we finalize your account...</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-mn-accent">{error}</p>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => router.replace('/shop/login')}
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function BuyerAuthCompletePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthCompleteInner />
    </Suspense>
  );
}
