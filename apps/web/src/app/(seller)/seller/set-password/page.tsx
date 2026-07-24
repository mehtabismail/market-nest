'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthError, AuthField, AuthLayout } from '@/components/auth/auth-layout';
import { PageLoader } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import { emailFromAccessToken, parseAuthTokensFromUrl } from '@/lib/invite-token';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { AuthSession } from '@marketnest/shared-types';

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function initializeInvite() {
      setError(null);
      setInfo(null);

      try {
        const { accessToken: token, refreshToken, type } = parseAuthTokensFromUrl(searchParams);

        if (token && refreshToken) {
          const supabase = getSupabaseBrowserClient();
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            throw new Error(sessionError.message);
          }
          window.history.replaceState({}, document.title, '/seller/set-password');
        }

        let resolvedToken = token;
        if (!resolvedToken) {
          const supabase = getSupabaseBrowserClient();
          const { data } = await supabase.auth.getSession();
          resolvedToken = data.session?.access_token ?? null;
        }

        if (resolvedToken) {
          setAccessToken(resolvedToken);
          const inviteEmail =
            emailFromAccessToken(resolvedToken) ??
            (await getSupabaseBrowserClient().auth.getUser(resolvedToken)).data.user?.email ??
            null;
          if (inviteEmail) setEmail(inviteEmail);
          return;
        }

        if (type === 'invite') {
          setError('Invite link is missing token data. Ask your admin to resend the invitation.');
        } else {
          setInfo('Open the invitation link from your email to activate your seller account.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not verify invite link');
      } finally {
        setInitializing(false);
      }
    }

    void initializeInvite();
  }, [searchParams]);

  useEffect(() => {
    if (!email.includes('@')) return;
    apiFetch<{ invited: boolean; storeName: string | null }>(
      `/auth/seller/invite-status?email=${encodeURIComponent(email)}`,
    )
      .then((res) => setStoreName(res.storeName))
      .catch(() => undefined);
  }, [email]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken) {
      setError('Missing invite token. Open the link from your invitation email.');
      return;
    }
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);
    const password = String(fd.get('password'));
    const confirm = String(fd.get('confirmPassword'));
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const session = await apiFetch<AuthSession>('/auth/seller/setup-password', {
        method: 'POST',
        body: JSON.stringify({ accessToken, password }),
      });
      await setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      // Invitees still complete KYC; submit auto-verifies because createdBy is set.
      router.push('/seller/kyc');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not set password';
      if (message.toLowerCase().includes('invalid or expired token')) {
        router.push('/seller/login?activated=1');
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      portal="seller"
      title="Activate your store"
      subtitle="Set a secure password to access your seller dashboard and start selling."
      footer={
        <Link href="/seller/login" className="text-teal font-semibold hover:underline">
          Already activated? Sign in
        </Link>
      }
    >
      <h2 className="font-outfit text-xl font-bold mb-2 text-teal-dark">Set your password</h2>
      {storeName && (
        <p className="text-sm text-gray mb-4">
          Welcome to <span className="font-semibold text-gray-dark">{storeName}</span>
        </p>
      )}
      {initializing ? (
        <p className="text-sm text-gray">Verifying your invitation link...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="Email (from invite)">
            <input
              className="input"
              name="email"
              type="email"
              placeholder="seller@store.com"
              value={email}
              readOnly={Boolean(accessToken && email)}
              onChange={(e) => setEmail(e.target.value)}
            />
          </AuthField>
          <AuthField label="New password">
            <input className="input" name="password" type="password" minLength={8} required />
          </AuthField>
          <AuthField label="Confirm password">
            <input className="input" name="confirmPassword" type="password" minLength={8} required />
          </AuthField>
          {info && <p className="text-sm text-gray">{info}</p>}
          <AuthError message={error} />
          <button type="submit" className="btn btn-teal w-full" disabled={loading || !accessToken}>
            {loading ? 'Activating...' : 'Activate seller account'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default function SellerSetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SetPasswordForm />
    </Suspense>
  );
}
