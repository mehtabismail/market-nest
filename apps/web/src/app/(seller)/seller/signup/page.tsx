'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthError, AuthField, AuthLayout } from '@/components/auth/auth-layout';
import { EmailInput, PhoneInput } from '@/components/form-fields';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import type { AuthSession } from '@marketnest/shared-types';
import { emailError, pkMobileError } from '@marketnest/utils';
import { SellerKycWizard } from '../kyc/seller-kyc-wizard';

/**
 * Combined “Become a seller” flow: create account → start onboarding → KYC.
 * Self-serve applicants wait for admin KYC approval before listing.
 */
export default function SellerSignupPage() {
  const { setSession, refresh, token } = useAuth();
  const [phase, setPhase] = useState<'account' | 'kyc'>('account');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');

  async function handleAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);
    const password = String(fd.get('password'));
    const confirm = String(fd.get('confirmPassword'));
    const mailErr = emailError(String(fd.get('email') ?? ''));
    if (mailErr) {
      setError(mailErr);
      setLoading(false);
      return;
    }
    if (phone.trim()) {
      const phoneErr = pkMobileError(phone);
      if (phoneErr) {
        setError(phoneErr);
        setLoading(false);
        return;
      }
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const session = await apiFetch<AuthSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: fd.get('email'),
          password,
          fullName: fd.get('fullName') || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      await setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      await apiFetch('/seller/onboarding', {
        method: 'POST',
        token: session.accessToken,
        body: JSON.stringify({ storeName: String(fd.get('storeName') || '').trim() || undefined }),
      });
      await refresh();
      setPhase('kyc');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create seller account');
    } finally {
      setLoading(false);
    }
  }

  if (phase === 'kyc' && token) {
    return (
      <div className="seller-theme mn-theme min-h-screen bg-mn-paper px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <SellerKycWizard heading="Become a seller — verification" />
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      portal="seller"
      title="Become a seller"
      subtitle="Create your account and complete verification to start listing on MarketNest."
      footer={
        <p className="text-xs">
          Already have a seller account?{' '}
          <Link href="/seller/login" className="font-semibold text-teal hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <h2 className="mb-2 font-outfit text-xl font-bold text-teal-dark">Create seller account</h2>
      <p className="mb-6 text-xs text-gray">
        After you submit verification, an admin reviews your application. Invited sellers skip that
        queue.
      </p>
      <form onSubmit={(e) => void handleAccount(e)} className="space-y-4">
        <AuthField label="Full name">
          <input className="input" name="fullName" type="text" required />
        </AuthField>
        <AuthField label="Store / trade name">
          <input className="input" name="storeName" type="text" required />
        </AuthField>
        <AuthField label="Email">
          <EmailInput name="email" required />
        </AuthField>
        <AuthField label="Phone (optional)">
          <PhoneInput value={phone} onChange={setPhone} />
        </AuthField>
        <AuthField label="Password">
          <input className="input" name="password" type="password" minLength={8} required />
        </AuthField>
        <AuthField label="Confirm password">
          <input className="input" name="confirmPassword" type="password" minLength={8} required />
        </AuthField>
        <AuthError message={error} />
        <button type="submit" className="btn btn-teal w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Continue to verification'}
        </button>
      </form>
    </AuthLayout>
  );
}
