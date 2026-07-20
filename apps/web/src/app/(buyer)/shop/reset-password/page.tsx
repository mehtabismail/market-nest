'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthError, AuthField, AuthLayout } from '@/components/auth/auth-layout';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function initializeRecoverySession() {
      setError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) {
          throw new Error('Reset link is invalid or expired. Please request a new one.');
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          throw new Error(sessionError.message);
        }

        window.history.replaceState({}, document.title, '/shop/reset-password');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not verify reset link');
      } finally {
        setInitializing(false);
      }
    }

    void initializeRecoverySession();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const password = String(fd.get('password') ?? '');
    const confirmPassword = String(fd.get('confirmPassword') ?? '');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw new Error(updateError.message);
      }
      await supabase.auth.signOut();
      router.replace('/shop/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      portal="buyer"
      title="Set your new password"
      subtitle="Choose a strong password to secure your account."
      footer={
        <Link href="/shop/login" className="text-blue font-semibold hover:underline">
          Back to sign in
        </Link>
      }
    >
      <h2 className="font-outfit text-xl font-bold mb-6">Reset password</h2>
      {initializing ? (
        <p className="text-sm text-gray">Verifying your reset link...</p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <AuthField label="New password">
            <input className="input" name="password" type="password" placeholder="New password" required />
          </AuthField>
          <AuthField label="Confirm new password">
            <input
              className="input"
              name="confirmPassword"
              type="password"
              placeholder="Repeat new password"
              required
            />
          </AuthField>
          <AuthError message={error} />
          <button type="submit" className="btn btn-blue w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
