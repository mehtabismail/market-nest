'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthError, AuthField, AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import type { AuthSession } from '@marketnest/shared-types';

export default function BuyerSignupPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);

    try {
      const session = await apiFetch<AuthSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: fd.get('email'),
          password: fd.get('password'),
          fullName: fd.get('fullName'),
        }),
      });
      await setSession(session.accessToken);
      router.push('/shop');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      portal="buyer"
      title="Join MarketNest"
      subtitle="Create a free buyer account to save addresses, track orders, and shop smarter."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/shop/login" className="text-blue font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <h2 className="font-outfit text-xl font-bold mb-6">Create account</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField label="Full name">
          <input className="input" name="fullName" placeholder="Jane Doe" required />
        </AuthField>
        <AuthField label="Email">
          <input className="input" name="email" type="email" placeholder="you@example.com" required />
        </AuthField>
        <AuthField label="Password">
          <input className="input" name="password" type="password" placeholder="Min. 8 characters" minLength={8} required />
        </AuthField>
        <AuthError message={error} />
        <button type="submit" className="btn btn-blue w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
