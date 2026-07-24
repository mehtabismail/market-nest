'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthError, AuthField, AuthLayout } from '@/components/auth/auth-layout';
import { EmailInput } from '@/components/form-fields';
import { PageLoader } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import type { AuthSession } from '@marketnest/shared-types';
import { emailError } from '@marketnest/utils';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin';
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          portal: 'admin',
        }),
      });
      await setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      portal="admin"
      title="Platform control"
      subtitle="Secure access for super administrators to manage sellers, orders, and catalogue."
      footer={
        <Link href="/shop" className="text-purple font-semibold hover:underline">
          Back to storefront
        </Link>
      }
    >
      <h2 className="font-outfit text-xl font-bold mb-6 text-purple-dark">Admin sign in</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label="Admin email">
          <EmailInput name="email" required placeholder="admin@marketnest.com" />
        </AuthField>
        <AuthField label="Password">
          <input className="input" name="password" type="password" placeholder="Your password" required />
        </AuthField>
        <AuthError message={error} />
        <button type="submit" className="btn btn-purple w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in to admin'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminLoginForm />
    </Suspense>
  );
}
