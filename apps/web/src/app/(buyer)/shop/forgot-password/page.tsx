'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthError, AuthField, AuthLayout } from '@/components/auth/auth-layout';
import { EmailInput } from '@/components/form-fields';
import { apiFetch } from '@/lib/api';
import { emailError } from '@marketnest/utils';

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
    const mailErr = emailError(String(fd.get('email') ?? ''));
    if (mailErr) {
      setError(mailErr);
      setLoading(false);
      return;
    }

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
          <EmailInput name="email" required placeholder="you@example.com" />
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
