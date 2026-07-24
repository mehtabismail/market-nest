'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { DateInput, PhoneInput } from '@/components/form-fields';
import { formatDateYmd, pkMobileError } from '@marketnest/utils';

type StepKey = 'personal' | 'business' | 'documents' | 'bank' | 'review';

interface KycRecord {
  id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  completedStep: number;
  personal: Record<string, string> | null;
  business: Record<string, string> | null;
  documents: Record<string, string> | null;
  bank: (Record<string, string> & { accountLast4?: string | null }) | null;
  rejectionReason: string | null;
}

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'personal', label: 'Personal' },
  { key: 'business', label: 'Business' },
  { key: 'documents', label: 'Documents' },
  { key: 'bank', label: 'Bank' },
  { key: 'review', label: 'Review' },
];

/** Same field keys as mobile KYC so both clients write compatible JSON. */
const PERSONAL_FIELDS: [string, string][] = [
  ['fullName', 'Full legal name'],
  ['nationality', 'Nationality'],
];
const BUSINESS_FIELDS: [string, string][] = [
  ['businessName', 'Business name'],
  ['businessType', 'Business type'],
  ['taxId', 'Tax ID / EIN'],
  ['website', 'Website (optional)'],
];
const BANK_FIELDS: [string, string][] = [
  ['accountHolder', 'Account holder name'],
  ['bankName', 'Bank name'],
  ['accountNumber', 'Account number'],
  ['routingNumber', 'Routing / ABA'],
  ['swift', 'SWIFT / BIC (optional)'],
];
const DOC_SLOTS: [string, string][] = [
  ['idFront', 'ID / passport (front)'],
  ['idBack', 'ID / passport (back)'],
  ['selfie', 'Selfie holding your ID'],
];

/**
 * Shared seller KYC wizard for web (self-serve signup + invite completion).
 * Invitees auto-verify on submit server-side; self-serve waits in /admin/kyc.
 */
export function SellerKycWizard({
  heading = 'Seller verification',
  onApprovedHref = '/seller/products',
}: {
  heading?: string;
  onApprovedHref?: string;
}) {
  const router = useRouter();
  const { token, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [record, setRecord] = useState<KycRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [personal, setPersonal] = useState<Record<string, string>>({});
  const [business, setBusiness] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [bank, setBank] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const kyc = await apiFetch<KycRecord>('/seller/kyc', { token });
      setRecord(kyc);
      setPersonal(kyc.personal ?? {});
      setBusiness(kyc.business ?? {});
      setDocuments(kyc.documents ?? {});
      const { accountLast4: _last4, accountNumber: _num, ...rest } = kyc.bank ?? {};
      setBank(rest);
      const resume = Math.min(Math.max((kyc.completedStep ?? 1) - 1, 0), STEPS.length - 1);
      if (kyc.status === 'draft' || kyc.status === 'rejected') setStep(resume);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load verification');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveAndNext() {
    if (!token) return;
    const key = STEPS[step].key;
    setSaving(true);
    setError(null);
    try {
      if (key !== 'review') {
        const payload =
          key === 'personal'
            ? personal
            : key === 'business'
              ? business
              : key === 'documents'
                ? documents
                : bank;
        if (key === 'personal') {
          if (!personal.fullName?.trim()) throw new Error('Full legal name is required');
          if (!personal.dateOfBirth?.trim()) throw new Error('Date of birth is required');
          const phoneErr = pkMobileError(personal.phone ?? '');
          if (phoneErr) throw new Error(phoneErr);
          if (!personal.nationality?.trim()) throw new Error('Nationality is required');
        }
        if (key === 'documents') {
          for (const [field] of DOC_SLOTS) {
            if (!payload[field]) throw new Error(`Upload required: ${field}`);
          }
        }
        await apiFetch(`/seller/kyc/${key}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({ payload }),
        });
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
      } else {
        const submitted = await apiFetch<KycRecord>('/seller/kyc/submit', {
          method: 'POST',
          token,
        });
        setRecord(submitted);
        await refresh();
        if (submitted.status === 'approved') {
          router.push(onApprovedHref);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-mn-mid">Loading verification…</p>;
  }

  if (record?.status === 'approved') {
    return (
      <div className="card space-y-3 p-6">
        <h2 className="font-outfit text-xl font-bold text-mn-teal">You are verified</h2>
        <p className="text-sm text-mn-mid">Your store is live. You can list products.</p>
        <button type="button" className="btn btn-teal" onClick={() => router.push(onApprovedHref)}>
          Go to products
        </button>
      </div>
    );
  }

  if (record?.status === 'submitted') {
    return (
      <div className="card space-y-3 p-6">
        <h2 className="font-outfit text-xl font-bold text-mn-ink">Pending admin review</h2>
        <p className="text-sm text-mn-mid">
          Your verification was submitted. You can list products once an admin approves it.
        </p>
        <button type="button" className="btn btn-outline" onClick={() => router.push('/seller')}>
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-outfit text-2xl font-extrabold text-mn-ink">{heading}</h1>
        <p className="mt-1 text-sm text-mn-mid">
          Step {step + 1} of {STEPS.length}
          {record?.status === 'rejected' && record.rejectionReason
            ? ` · Rejected: ${record.rejectionReason}`
            : ''}
        </p>
        <div className="mt-3 flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-mn-teal' : 'bg-mn-border'}`}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}

      <div className="card space-y-4 p-6">
        {STEPS[step].key === 'personal' && (
          <div className="space-y-4">
            <FieldGrid fields={PERSONAL_FIELDS} values={personal} onChange={setPersonal} />
            <DateInput
              label="Date of birth"
              value={personal.dateOfBirth ?? ''}
              onChange={(ymd) => setPersonal((p) => ({ ...p, dateOfBirth: ymd }))}
              required
              max={formatDateYmd(new Date())}
            />
            <PhoneInput
              label="Phone"
              value={personal.phone ?? ''}
              onChange={(e164) => setPersonal((p) => ({ ...p, phone: e164 }))}
              required
            />
          </div>
        )}
        {STEPS[step].key === 'business' && (
          <FieldGrid fields={BUSINESS_FIELDS} values={business} onChange={setBusiness} />
        )}
        {STEPS[step].key === 'documents' && (
          <div className="space-y-4">
            <p className="text-sm text-mn-mid">Upload clear photos of your government-issued ID.</p>
            {DOC_SLOTS.map(([key, label]) => (
              <KycImageField
                key={key}
                label={label}
                token={token}
                value={documents[key] ?? ''}
                onChange={(url) => setDocuments((d) => ({ ...d, [key]: url }))}
              />
            ))}
          </div>
        )}
        {STEPS[step].key === 'bank' && (
          <FieldGrid fields={BANK_FIELDS} values={bank} onChange={setBank} />
        )}
        {STEPS[step].key === 'review' && (
          <div className="space-y-2 text-sm text-mn-mid">
            <p>Confirm your details and submit.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Personal: {personal.fullName || '—'}</li>
              <li>Business: {business.businessName || '—'}</li>
              <li>
                Documents:{' '}
                {DOC_SLOTS.every(([k]) => documents[k]) ? 'Uploaded' : 'Incomplete'}
              </li>
              <li>Bank: {bank.bankName || '—'}</li>
            </ul>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={saving}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
          )}
          <button
            type="button"
            className="btn btn-teal"
            disabled={saving}
            onClick={() => void saveAndNext()}
          >
            {saving ? 'Saving…' : STEPS[step].key === 'review' ? 'Submit verification' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldGrid({
  fields,
  values,
  onChange,
}: {
  fields: [string, string][];
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map(([key, label]) => (
        <label key={key} className="block text-sm sm:col-span-1">
          <span className="mb-1 block text-xs font-semibold text-mn-mid">{label}</span>
          <input
            className="input"
            value={values[key] ?? ''}
            onChange={(e) => onChange({ ...values, [key]: e.target.value })}
            required={!label.toLowerCase().includes('optional')}
          />
        </label>
      ))}
    </div>
  );
}

function KycImageField({
  label,
  token,
  value,
  onChange,
}: {
  label: string;
  token: string | null;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!token) {
      setError('Sign in is required before uploading.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch<{ publicUrl: string }>('/upload/image', {
        method: 'POST',
        token,
        body: formData,
      });
      onChange(res.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      event.target.value = '';
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-mn-mid">{label}</label>
      <input
        className="input"
        type="file"
        accept="image/*"
        onChange={(e) => void onFileChange(e)}
        disabled={uploading || !token}
      />
      {uploading && <p className="mt-1 text-xs text-mn-mid">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
      {value ? (
        <div className="mt-2">
          <Image
            src={value}
            alt={label}
            width={96}
            height={96}
            className="h-24 w-24 rounded-md border border-mn-border object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
