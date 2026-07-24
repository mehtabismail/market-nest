'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthError, AuthField, AuthLayout } from '@/components/auth/auth-layout';
import { EmailInput } from '@/components/form-fields';
import { PageLoader } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import type { AuthSession } from '@marketnest/shared-types';
import { emailError } from '@marketnest/utils';

function SellerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/seller';
  const activated = searchParams.get('activated') === '1';
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const params = new URLSearchParams(hash);
    if (params.get('type') === 'invite' && params.get('access_token')) {
      router.replace(`/seller/set-password#${hash}`);
    }
  }, [router]);

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
          portal: 'seller',
        }),
      });
      const me = await setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      if (me.seller && !me.seller.isVerified) {
        router.push('/seller/kyc');
      } else {
        router.push(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      portal="seller"
      title="Seller workspace"
      subtitle="Manage products, orders, and earnings from your dedicated seller dashboard."
      footer={
        <div className="space-y-1 text-xs">
          <p>
            New seller?{' '}
            <Link href="/seller/signup" className="font-semibold text-teal hover:underline">
              Become a seller
            </Link>
          </p>
          <p>
            Invited by admin?{' '}
            <Link href="/seller/set-password" className="font-semibold text-teal hover:underline">
              Set your password
            </Link>
          </p>
        </div>
      }
    >
      <h2 className="font-outfit text-xl font-bold mb-2 text-teal-dark">Seller sign in</h2>
      {activated && (
        <p className="text-sm text-teal mb-4">
          Your seller account is activated. Sign in with the password you just set.
        </p>
      )}
      <p className="text-xs text-gray mb-6">
        Sign in to manage your store. New sellers complete verification before listing products.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label="Email">
          <EmailInput name="email" required placeholder="seller@store.com" />
        </AuthField>
        <AuthField label="Password">
          <input className="input" name="password" type="password" placeholder="Your password" required />
        </AuthField>
        <AuthError message={error} />
        <button type="submit" className="btn btn-teal w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in to seller portal'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function SellerLoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SellerLoginForm />
    </Suspense>
  );
}
