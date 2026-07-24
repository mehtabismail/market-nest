/**
 * Shared client-side validators for MarketNest forms (mobile + web).
 * Pakistani phone format is the current product standard.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pakistani mobile: +92 + 10 digits starting with 3 (e.g. +923001234567). */
const PK_LOCAL_MOBILE_RE = /^3\d{9}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/**
 * Digits-only sanitizer for the local phone TextInput (no country-code logic).
 * Use this on every keystroke so typing/deleting never fights the +92 prefix.
 */
export function sanitizePkLocalInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

/**
 * Extract the 10-digit Pakistani local mobile from a stored value.
 * Accepts +92…, 92…, 03…, or bare local digits.
 *
 * Always strips a leading `92` country code when present — even for incomplete
 * numbers — otherwise editing `+92300…` mid-way would re-display as `92300…`
 * and lock the field (maxLength 10 can't recover).
 */
export function toPkLocalDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('92')) {
    return digits.slice(2, 12);
  }
  if (digits.startsWith('0')) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

/** E.164 form stored/sent to the API. Empty input → empty string (not `+92`). */
export function toPkE164(localOrRaw: string): string {
  const local = toPkLocalDigits(localOrRaw);
  return local ? `+92${local}` : '';
}

export function isValidPkMobile(value: string): boolean {
  return PK_LOCAL_MOBILE_RE.test(toPkLocalDigits(value));
}

export function pkMobileError(value: string): string | null {
  const local = toPkLocalDigits(value);
  if (!local) return 'Phone number is required';
  if (local.length < 10) return 'Enter a 10-digit Pakistani mobile number';
  if (local.length > 10) return 'Phone number is too long';
  if (!local.startsWith('3')) return 'Pakistani mobiles start with 3 (e.g. 3001234567)';
  if (!PK_LOCAL_MOBILE_RE.test(local)) return 'Enter a valid Pakistani mobile number';
  return null;
}

export function emailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required';
  if (!isValidEmail(trimmed)) return 'Enter a valid email address';
  return null;
}

/** YYYY-MM-DD for date fields / API payloads. */
export function formatDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateYmd(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}
