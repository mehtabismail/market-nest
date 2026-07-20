export const RATE_LIMIT_KEY = 'rateLimit';
export const SKIP_RATE_LIMIT_KEY = 'skipRateLimit';

export type RateLimitTier = 'general' | 'auth' | 'checkout' | 'assistant';

export const RATE_LIMITS: Record<RateLimitTier, { max: number; windowSec: number }> = {
  general: { max: 100, windowSec: 60 },
  auth: { max: 10, windowSec: 60 },
  checkout: { max: 5, windowSec: 60 },
  assistant: { max: 30, windowSec: 60 },
};

/** RATE_LIMIT_ENABLED or RATE_LIMIT — default true. Set false for local testing. */
export function isRateLimitEnabled(): boolean {
  const raw = process.env.RATE_LIMIT_ENABLED ?? process.env.RATE_LIMIT ?? 'true';
  return !['false', '0', 'off', 'no'].includes(raw.trim().toLowerCase());
}
