'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  loginHref?: string;
  signupHref?: string;
}

export function AuthModal({
  open,
  onClose,
  title = 'Sign in required',
  message = 'Please sign in to continue with this action.',
  loginHref = '/shop/login',
  signupHref = '/shop/signup',
}: AuthModalProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-mn-ink/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative card w-full max-w-sm animate-slide-up p-6 shadow-lg">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-mn-teal-soft text-mn-teal">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="mb-2 font-outfit text-lg font-bold text-mn-ink">{title}</h2>
        <p className="mb-6 text-sm text-mn-mid">{message}</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => {
              onClose();
              router.push(loginHref);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className="btn btn-outline w-full"
            onClick={() => {
              onClose();
              router.push(signupHref);
            }}
          >
            Create account
          </button>
          <button type="button" className="mt-2 text-xs text-mn-mid hover:text-mn-ink" onClick={onClose}>
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuthGate({
  title,
  message,
  loginHref = '/shop/login',
  signupHref = '/shop/signup',
}: {
  title: string;
  message: string;
  loginHref?: string;
  signupHref?: string;
}) {
  return (
    <div className="card mx-auto max-w-lg animate-slide-up p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mn-teal-soft text-mn-teal">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="mb-2 font-outfit text-xl font-bold text-mn-ink">{title}</h1>
      <p className="mb-6 text-sm text-mn-mid">{message}</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={loginHref} className="btn btn-primary">
          Sign in
        </Link>
        <Link href={signupHref} className="btn btn-outline">
          Create account
        </Link>
      </div>
    </div>
  );
}
