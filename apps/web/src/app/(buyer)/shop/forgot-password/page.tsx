'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthError, AuthField, AuthLayout } from '@/components/auth/auth-layout';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    setMessage(null);
    const fd = new FormData(form);

    try {
      const res = await apiFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: fd.get('email') }),
      });
      setMessage(res.message);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      portal="buyer"
      title="Reset your password"
      subtitle="We will email you a secure link to choose a new password."
      footer={
        <Link href="/shop/login" className="text-blue font-semibold hover:underline">
          Back to sign in
        </Link>
      }
    >
      <h2 className="font-outfit text-xl font-bold mb-6">Forgot password</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField label="Email">
          <input className="input" name="email" type="email" placeholder="you@example.com" required />
        </AuthField>
        <AuthError message={error} />
        {message && (
          <p className="text-sm text-teal-dark bg-teal-light border border-teal/20 rounded-md px-3 py-2">
            {message}
          </p>
        )}
        <button type="submit" className="btn btn-blue w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
}
