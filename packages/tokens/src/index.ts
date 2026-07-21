/**
 * MarketNest design tokens — the single source of truth for both platforms.
 *
 * Consumed by Tailwind on web and NativeWind on mobile. Plain data only: no
 * imports, no platform APIs, so a React Native bundler can read it safely.
 *
 * The direction is warm editorial — ink on paper with a coral accent — not the
 * cool translucent look common to marketplace templates. Surfaces are opaque
 * on purpose: seller-supplied product photography varies wildly, and solid
 * cards are what make an inconsistent catalogue read as one coherent store.
 */

export const colors = {
  /** Near-black for primary text and primary buttons. */
  ink: '#0e0f11',
  /** Warm off-white page background. */
  paper: '#f5f3ee',
  /** Slightly deeper surface, for wells and hover states. */
  cream: '#ede9e1',
  /** Coral. Primary accent: CTAs, badges, active states. */
  accent: '#e8472a',
  accentSoft: '#fde8e4',
  /** Gold. Ratings, highlights, premium markers. */
  gold: '#c8973a',
  goldSoft: '#fdf3e1',
  /** Deep green. Success, confirmed states, trust markers. */
  teal: '#1a6b5a',
  tealSoft: '#e0f0eb',
  /** Muted body text and secondary labels. */
  mid: '#6b6860',
  /** Hairline borders and dividers. */
  border: '#d5d0c7',
  white: '#ffffff',
} as const;

/** Order status colours, so web and mobile never drift on what "shipped" looks like. */
export const statusColors = {
  pending_payment: colors.gold,
  pending_cod: colors.gold,
  confirmed: colors.teal,
  shipped: colors.teal,
  delivered: colors.teal,
  cancelled: colors.mid,
  refunded: colors.mid,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** 4pt rhythm. Keeps vertical spacing consistent across platforms. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const fontFamily = {
  /** Headings and display copy. */
  display: 'Outfit',
  /** Body copy. */
  body: 'DMSans',
  /** Prices, order ids, anything tabular. */
  mono: 'DMMono',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const letterSpacing = {
  tighter: '-0.04em',
  tight: '-0.02em',
  normal: '0',
} as const;

/** Web box-shadows. React Native uses elevation instead — see `elevation`. */
export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.08)',
  md: '0 4px 16px rgba(0,0,0,0.10)',
  lg: '0 8px 32px rgba(0,0,0,0.12)',
} as const;

/** Android elevation / iOS shadow radius pairs, matching `shadows` visually. */
export const elevation = {
  sm: { elevation: 1, shadowOpacity: 0.08, shadowRadius: 3 },
  md: { elevation: 4, shadowOpacity: 0.1, shadowRadius: 8 },
  lg: { elevation: 8, shadowOpacity: 0.12, shadowRadius: 16 },
} as const;

/**
 * Motion durations in ms. Exit is faster than enter — the user is already on
 * their way somewhere else.
 */
export const duration = {
  micro: 150,
  enter: 250,
  exit: 180,
  page: 350,
} as const;

export type ColorToken = keyof typeof colors;
export type RadiusToken = keyof typeof radii;
export type SpacingToken = keyof typeof spacing;
