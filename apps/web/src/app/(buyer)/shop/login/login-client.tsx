'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AuthError, AuthField, AuthLayout } from '@/components/auth/auth-layout';
import { EmailInput } from '@/components/form-fields';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ensureGuestSession } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { AuthSession } from '@marketnest/shared-types';
import { emailError } from '@marketnest/utils';

export default function BuyerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/shop';
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);
    const mailErr = emailError(String(fd.get('email') ?? ''));
    if (mailErr) {
      setError(mailErr);
      setLoading(false);
      return;
    }

    try {
      const session = await apiFetch<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: fd.get('email'),
          password: fd.get('password'),
          portal: 'buyer',
        }),
      });
      await setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      await ensureGuestSession();
      try {
        await apiFetch('/cart/merge', { method: 'POST', token: session.accessToken });
      } catch {
        /* ignore */
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setOauthLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/shop/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(false);
    }
  }

  return (
    <AuthLayout
      portal="buyer"
      title="Welcome back"
      subtitle="Sign in to track orders, save addresses, and checkout faster."
      footer={
        <>
          New here?{' '}
          <Link href="/shop/signup" className="text-blue font-semibold hover:underline">
            Create account
          </Link>
        </>
      }
    >
      <h2 className="font-outfit text-xl font-bold mb-6">Sign in</h2>
      <button
        type="button"
        className="btn btn-outline w-full mb-4"
        onClick={handleGoogle}
        disabled={oauthLoading || loading}
      >
        {oauthLoading ? 'Redirecting...' : 'Continue with Google'}
      </button>
      <div className="text-center text-xs text-gray my-4">or continue with email</div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField label="Email">
          <EmailInput name="email" required placeholder="you@example.com" />
        </AuthField>
        <AuthField label="Password">
          <input className="input" name="password" type="password" placeholder="Your password" required />
        </AuthField>
        <div className="text-right">
          <Link href="/shop/forgot-password" className="text-xs text-blue hover:underline">
            Forgot password?
          </Link>
        </div>
        <AuthError message={error} />
        <button type="submit" className="btn btn-blue w-full" disabled={loading || oauthLoading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
