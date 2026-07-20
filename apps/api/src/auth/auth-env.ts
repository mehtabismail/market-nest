import { isRateLimitEnabled } from '../rate-limit/rate-limit.constants';

function parseEnvFlag(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return defaultValue;
  return !['false', '0', 'off', 'no'].includes(raw.trim().toLowerCase());
}

/** Skip Supabase transactional emails; return generated links instead (local testing). */
export function isAuthEmailBypassEnabled(): boolean {
  const explicit = process.env.AUTH_EMAIL_BYPASS ?? process.env.SUPABASE_EMAIL_BYPASS;
  if (explicit !== undefined && explicit.trim() !== '') {
    return parseEnvFlag(explicit, false);
  }
  // When API rate limits are disabled, also bypass Supabase email sending.
  return !isRateLimitEnabled();
}

export function isSupabaseEmailRateLimitError(message: string): boolean {
  const msg = message.toLowerCase();
  return msg.includes('rate limit') || (msg.includes('too many') && msg.includes('email'));
}
