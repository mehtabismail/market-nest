'use client';

import { useMemo } from 'react';
import { sanitizePkLocalInput, toPkE164, toPkLocalDigits } from '@marketnest/utils';

/**
 * Pakistani mobile with fixed +92 prefix.
 * Controlled: pass `value` (E.164) + `onChange`.
 * Uncontrolled FormData: omit value/onChange; hidden input posts E.164 under `name`.
 */
export function PhoneInput({
  name = 'phone',
  label,
  value,
  onChange,
  required,
  error,
  className = 'input',
}: {
  name?: string;
  label?: string;
  value?: string;
  onChange?: (e164: string) => void;
  required?: boolean;
  error?: string | null;
  className?: string;
}) {
  const controlled = typeof onChange === 'function';
  const local = toPkLocalDigits(value ?? '');

  return (
    <div>
      {label ? (
        <label className="mb-1 block text-xs font-semibold text-mn-mid">
          {label}
          {required ? ' *' : ''}
        </label>
      ) : null}
      <div className="flex overflow-hidden rounded-lg border border-mn-border bg-white">
        <span className="border-r border-mn-border bg-mn-cream px-3 py-2 text-sm font-semibold text-mn-ink">
          +92
        </span>
        {controlled ? (
          <input
            className={`${className} flex-1 border-0 shadow-none focus:ring-0`}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="3001234567"
            value={local}
            required={required}
            onChange={(e) => {
              const digits = sanitizePkLocalInput(e.target.value);
              onChange(digits ? toPkE164(digits) : '');
            }}
          />
        ) : (
          <UncontrolledPkPhone name={name} required={required} className={className} />
        )}
      </div>
      {error ? <p className="mt-1 text-xs text-coral">{error}</p> : null}
    </div>
  );
}

function UncontrolledPkPhone({
  name,
  required,
  className,
}: {
  name: string;
  required?: boolean;
  className: string;
}) {
  // Keep a hidden E.164 field for FormData; visible field is digits-only.
  return (
    <>
      <input
        className={`${className} flex-1 border-0 shadow-none focus:ring-0`}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={10}
        placeholder="3001234567"
        required={required}
        onChange={(e) => {
          const hidden = e.currentTarget.parentElement?.querySelector<HTMLInputElement>(
            `input[type="hidden"][data-phone-name="${name}"]`,
          );
          const digits = sanitizePkLocalInput(e.target.value);
          e.target.value = digits;
          if (hidden) hidden.value = digits ? toPkE164(digits) : '';
        }}
      />
      <input type="hidden" name={name} data-phone-name={name} defaultValue="" />
    </>
  );
}

export function EmailInput({
  name = 'email',
  label,
  value,
  onChange,
  required,
  error,
  className = 'input',
  placeholder = 'you@example.com',
}: {
  name?: string;
  label?: string;
  value?: string;
  onChange?: (next: string) => void;
  required?: boolean;
  error?: string | null;
  className?: string;
  placeholder?: string;
}) {
  const controlled = typeof onChange === 'function';
  return (
    <div>
      {label ? (
        <label className="mb-1 block text-xs font-semibold text-mn-mid">
          {label}
          {required ? ' *' : ''}
        </label>
      ) : null}
      <input
        className={className}
        name={name}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={placeholder}
        required={required}
        {...(controlled
          ? { value: value ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) }
          : {})}
      />
      {error ? <p className="mt-1 text-xs text-coral">{error}</p> : null}
    </div>
  );
}

/** Native calendar on click (`type=date`). Value is YYYY-MM-DD. */
export function DateInput({
  name,
  label,
  value,
  onChange,
  required,
  error,
  max,
  min,
  className = 'input',
}: {
  name?: string;
  label?: string;
  value?: string;
  onChange?: (ymd: string) => void;
  required?: boolean;
  error?: string | null;
  max?: string;
  min?: string;
  className?: string;
}) {
  const controlled = typeof onChange === 'function';
  return (
    <div>
      {label ? (
        <label className="mb-1 block text-xs font-semibold text-mn-mid">
          {label}
          {required ? ' *' : ''}
        </label>
      ) : null}
      <input
        className={className}
        name={name}
        type="date"
        max={max}
        min={min}
        required={required}
        {...(controlled
          ? { value: value ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) }
          : {})}
      />
      {error ? <p className="mt-1 text-xs text-coral">{error}</p> : null}
    </div>
  );
}

/** Native date+time picker. Value like `2026-07-23T14:30`. */
export function DateTimeInput({
  name,
  label,
  value,
  onChange,
  required,
  error,
  className = 'input',
}: {
  name?: string;
  label?: string;
  value?: string;
  onChange?: (next: string) => void;
  required?: boolean;
  error?: string | null;
  className?: string;
}) {
  const normalized = useMemo(() => {
    if (!value) return '';
    return value.length >= 16 ? value.slice(0, 16) : value;
  }, [value]);
  const controlled = typeof onChange === 'function';

  return (
    <div>
      {label ? (
        <label className="mb-1 block text-xs font-semibold text-mn-mid">
          {label}
          {required ? ' *' : ''}
        </label>
      ) : null}
      <input
        className={className}
        name={name}
        type="datetime-local"
        required={required}
        {...(controlled
          ? {
              value: normalized,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
            }
          : {})}
      />
      {error ? <p className="mt-1 text-xs text-coral">{error}</p> : null}
    </div>
  );
}
