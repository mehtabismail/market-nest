'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGate, WrongAccountGate } from '@/components/auth/auth-modal';
import { PhoneInput } from '@/components/form-fields';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import { pkMobileError } from '@marketnest/utils';

interface MeResponse {
  id: string;
  role: 'buyer' | 'seller' | 'superadmin';
  fullName: string | null;
  phone: string | null;
}

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt: string;
}

interface AddressPayload {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export function AccountClient() {
  const router = useRouter();
  const { token, user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  const [addressForm, setAddressForm] = useState<AddressPayload>({
    label: '',
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      apiFetch<MeResponse>('/auth/me', { token }),
      apiFetch<{ addresses: Address[] }>('/buyer/addresses', { token }),
    ])
      .then(([me, addressesRes]) => {
        setProfile(me);
        setProfileForm({ fullName: me.fullName ?? '', phone: me.phone ?? '' });
        setAddresses(addressesRes.addresses ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load account details'))
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setMessage(null);
    if (profileForm.phone.trim()) {
      const phoneErr = pkMobileError(profileForm.phone);
      if (phoneErr) {
        setMessage(phoneErr);
        return;
      }
    }
    try {
      const updated = await apiFetch<MeResponse>('/auth/me', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ fullName: profileForm.fullName, phone: profileForm.phone }),
      });
      setProfile(updated);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not update profile');
    }
  }

  async function saveAddress(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setAddressMessage(null);
    const phoneErr = pkMobileError(addressForm.phone);
    if (phoneErr) {
      setAddressMessage(phoneErr);
      return;
    }
    try {
      const updated = await apiFetch<{ addresses: Address[] }>('/buyer/addresses', {
        method: 'POST',
        token,
        body: JSON.stringify({ ...addressForm, country: addressForm.country || 'PK' }),
      });
      setAddresses(updated.addresses ?? []);
      setAddressForm({
        label: '',
        fullName: profileForm.fullName || '',
        phone: profileForm.phone || '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'PK',
      });
      setAddressMessage('Address saved.');
    } catch (err) {
      setAddressMessage(err instanceof Error ? err.message : 'Could not save address');
    }
  }

  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthGate
        title="Sign in to your account"
        message="Manage your profile, saved addresses, and order preferences."
        loginHref="/shop/login?next=/shop/account"
        signupHref="/shop/signup"
      />
    );
  }

  // Saved addresses come from /buyer/addresses, which is buyer-only.
  if (user && user.role !== 'buyer') {
    return (
      <WrongAccountGate
        role={user.role}
        action="manage a customer profile"
        loginHref="/shop/login?next=/shop/account"
      />
    );
  }

  if (error) return <p className="text-sm text-coral">{error}</p>;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      router.push('/shop');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="brand-text text-2xl mb-2">Account</h1>
          <p className="text-sm text-gray">Manage your profile and saved shipping addresses.</p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          disabled={signingOut}
          onClick={() => void handleSignOut()}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-base mb-4">Profile</h2>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
          <label className="text-sm flex flex-col gap-1">
            Full name
            <input
              className="input"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
          </label>
          <div className="text-sm flex flex-col gap-1">
            <span>Phone</span>
            <PhoneInput
              value={profileForm.phone}
              onChange={(phone) => setProfileForm((prev) => ({ ...prev, phone }))}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" className="btn btn-blue">
              Save profile
            </button>
            {message && <p className="text-xs text-gray">{message}</p>}
          </div>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-base mb-4">Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray mb-4">No saved addresses yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-semibold">{address.label}</p>
                <p>{address.fullName}</p>
                <p>{address.phone}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
              </div>
            ))}
          </div>
        )}

        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveAddress}>
          <input
            className="input"
            placeholder="Label (Home, Office)"
            value={addressForm.label}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Full name"
            value={addressForm.fullName}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <PhoneInput
            value={addressForm.phone}
            onChange={(phone) => setAddressForm((prev) => ({ ...prev, phone }))}
            required
          />
          <input
            className="input"
            placeholder="Address line 1"
            value={addressForm.line1}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, line1: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Address line 2 (optional)"
            value={addressForm.line2 ?? ''}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, line2: e.target.value }))}
          />
          <input
            className="input"
            placeholder="City"
            value={addressForm.city}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
          />
          <input
            className="input"
            placeholder="State"
            value={addressForm.state}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Postal code"
            value={addressForm.postalCode}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))}
          />
          <input
            className="input sm:col-span-2"
            placeholder="Country"
            value={addressForm.country}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
          />
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" className="btn btn-outline">
              Save address
            </button>
            {addressMessage && <p className="text-xs text-gray">{addressMessage}</p>}
          </div>
        </form>
      </section>

      {profile?.role !== 'buyer' && (
        <p className="text-xs text-gray mt-4 p-3 bg-teal-light/20 rounded-lg">
          You&apos;re viewing this as a {profile?.role}. Some buyer-specific features may show empty data.
        </p>
      )}
    </div>
  );
}
