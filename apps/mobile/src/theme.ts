import { Platform } from 'react-native';
import {
  accentGradientDeep,
  accentGradientEnd,
  duration,
  elevation,
  emojiForCategory,
  mobileAccents,
  mobileDark,
  mobileFontFamily,
  mobileFontSize,
  mobileLight,
  mobileRadii,
  mobileStatusColors,
  productTileLocations,
  productTileStops,
  pressScale,
  spacing,
  spring,
  stagger,
  type MobileTheme,
} from '@marketnest/tokens';

export {
  duration,
  emojiForCategory,
  pressScale,
  productTileLocations,
  productTileStops,
  spacing,
  spring,
  stagger,
  type MobileTheme,
};

export const font = mobileFontFamily;
export const size = mobileFontSize;
export const radii = mobileRadii;
export const statusColors = mobileStatusColors;
export const accents = mobileAccents;

export const themes = { dark: mobileDark, light: mobileLight } as const;

/**
 * The two-stop gradient behind every primary CTA.
 *
 * Returned as a tuple so callers feed it straight to `<LinearGradient>` —
 * SDK 57 types `colors` as a readonly array of at least two entries, which a
 * plain `string[]` does not satisfy.
 */
export function ctaGradient(isDark: boolean): readonly [string, string] {
  const theme = isDark ? mobileDark : mobileLight;
  return [theme.accent, isDark ? accentGradientEnd.dark : accentGradientEnd.light] as const;
}

/** Deeper ramp, for avatars and the logo mark. */
export function avatarGradient(isDark: boolean): readonly [string, string] {
  const theme = isDark ? mobileDark : mobileLight;
  return [theme.accent, isDark ? accentGradientDeep.dark : accentGradientDeep.light] as const;
}

/**
 * Shadows barely read on the dark canvas — depth comes from surface lightness
 * and hairlines. Kept for elements that genuinely float, like the nav pill.
 */
export function shadow(level: keyof typeof elevation) {
  const preset = elevation[level];

  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: Math.round(preset.shadowRadius / 2) },
      shadowOpacity: preset.shadowOpacity * 2.5,
      shadowRadius: preset.shadowRadius,
    },
    android: { elevation: preset.elevation },
    default: {},
  });
}

/** Green glow beneath a primary CTA — the design's `0 8px 24px <accentGlow>`. */
export function glow(theme: MobileTheme, radius = 24) {
  return Platform.select({
    ios: {
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: radius,
    },
    android: { elevation: 8 },
    default: {},
  });
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

/** Whole-dollar form for tiles and hero cards, where cents are noise. */
export function formatPriceShort(value: number): string {
  return `$${Math.round(value)}`;
}

/** `14523` → `04:02:03`, for the flash-deal countdown. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Fulfilment stages, in order, for the order-tracker progress bar. */
export const ORDER_STAGES = ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'] as const;

interface OrderProgress {
  /** 0–100, for the bar width. */
  percent: number;
  /** Current stage label. */
  stage: string;
  /** Status pill colour. */
  color: string;
}

/**
 * Maps an order status to a progress bar, label, and colour.
 *
 * The status enum has more values than the design's five visual stages, so
 * several collapse onto one bar position — `pending_*` and `confirmed` both
 * read as "Confirmed", because a buyer does not distinguish "awaiting COD" from
 * "confirmed" on a progress track.
 */
export function orderProgress(status: string): OrderProgress {
  switch (status) {
    case 'delivered':
      return { percent: 100, stage: 'Delivered', color: statusColors.delivered };
    case 'shipped':
      return { percent: 60, stage: 'Shipped', color: statusColors.shipped };
    case 'processing':
      return { percent: 35, stage: 'Packed', color: statusColors.packed };
    case 'cancelled':
    case 'refunded':
      return { percent: 0, stage: status === 'refunded' ? 'Refunded' : 'Cancelled', color: statusColors.cancelled };
    default:
      // pending_cod, pending_payment, confirmed
      return { percent: 15, stage: 'Confirmed', color: statusColors.confirmed };
  }
}

/** Human label for a raw order status. */
export function orderStatusLabel(status: string): string {
  return orderProgress(status).stage === 'Confirmed' && status !== 'confirmed'
    ? status === 'pending_cod'
      ? 'Confirmed'
      : 'Pending'
    : orderProgress(status).stage;
}
