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

/**
 * Dark canvas for the mobile app.
 *
 * The web portals stay on warm paper. Mobile inverts deliberately, for one
 * concrete reason: iOS Liquid Glass renders by refracting what sits behind it,
 * so over a flat light background it produces no visible effect at all. Glass
 * needs depth and contrast underneath to read — which is why every premium
 * shopping app that uses it is dark.
 *
 * The brand does not change. Same ink, same coral, same gold — ink simply moves
 * from being the text colour to being the canvas, and the accents gain contrast
 * rather than losing identity.
 */
export const dark = {
  /** Page canvas. Near-black, warm-leaning, never pure #000. */
  base: '#0e0f11',
  /** Cards and raised surfaces. */
  surface: '#17181b',
  /** Elevated surfaces: sheets, pressed cards, inputs. */
  surfaceHigh: '#212328',
  /** Hairlines on dark. */
  border: '#2c2e33',
  /** Primary text on dark. */
  text: '#f5f3ee',
  /** Secondary text — meets 4.5:1 on `base`. */
  textMuted: '#a3a09a',
  /** Tertiary. Labels only, never body copy. */
  textFaint: '#6f6d68',
  /** Translucent fills for glass-adjacent chips over imagery. */
  scrim: 'rgba(14,15,17,0.55)',
  scrimStrong: 'rgba(14,15,17,0.78)',
  hairline: 'rgba(245,243,238,0.12)',
} as const;

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
 * Motion durations in ms. Exit is faster than enter — roughly 70% — because the
 * user is already on their way somewhere else and waiting on the exit.
 */
export const duration = {
  micro: 150,
  enter: 250,
  exit: 180,
  page: 350,
} as const;

/**
 * Spring presets. Physics-based curves feel native on iOS in a way that fixed
 * cubic-beziers do not, and they stay interruptible — a second tap mid-animation
 * redirects rather than queueing.
 */
export const spring = {
  /** Press feedback. Tight and quick, no visible overshoot. */
  press: { damping: 18, stiffness: 320, mass: 0.6 },
  /** Entrances. A little softer, barely-there settle. */
  entrance: { damping: 20, stiffness: 180, mass: 0.9 },
  /** Sheets and large surfaces. Weightier. */
  surface: { damping: 24, stiffness: 140, mass: 1 },
} as const;

/**
 * Per-item delay for list and grid entrances. Below ~30ms the stagger is
 * invisible; above ~50ms the last item feels late.
 */
export const stagger = {
  item: 40,
  /** Cap the cascade so row 12 does not animate a second after row 1. */
  maxItems: 8,
} as const;

/** Press scale. Perceptible without the layout appearing to move. */
export const pressScale = 0.97;

export type ColorToken = keyof typeof colors;
export type RadiusToken = keyof typeof radii;
export type SpacingToken = keyof typeof spacing;
