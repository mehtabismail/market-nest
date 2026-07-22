/**
 * Mobile app palette — the green editorial scale.
 *
 * This is deliberately a *separate* scale from the coral `colors` export that
 * `apps/web` consumes. The mobile app runs its own visual identity: a green
 * accent on a green-tinted near-black canvas, with a matching light theme.
 * Forking the scale rather than replacing the coral one means the seller and
 * admin portals are untouched by mobile design work.
 *
 * Both themes ship because the design exposes a user-facing light/dark toggle,
 * so neither can be the "real" one with the other approximated.
 *
 * Values are literal rather than derived. A generated ramp would drift from the
 * design on the half-dozen hand-tuned alphas (`accentWash`, `navBg`, `glassBg`)
 * that carry most of the look.
 */

export interface MobileTheme {
  /** Page canvas, behind everything. */
  bg: string;
  /** Sheet/content surfaces that sit directly on the canvas. */
  surface: string;
  /** Cards, inputs, chips. */
  card: string;
  /** Wells and pressed states — one step in from `card`. */
  cardAlt: string;
  /** Brand green. CTAs, active tabs, prices. */
  accent: string;
  /** Accent at low alpha — chip and icon-well fills. */
  accentWash: string;
  /** Accent at mid alpha — glow shadows under raised CTAs. */
  accentGlow: string;
  /** Primary text. */
  text: string;
  /** Secondary text — labels, metadata. */
  textMuted: string;
  /** Tertiary text — placeholders, inactive tab labels. */
  textFaint: string;
  /** Hairline borders. */
  border: string;
  /** Fill behind floating glass panels (sticky CTA bars). */
  glassBg: string;
  /** Border on glass panels. */
  glassBorder: string;
  /** Fill behind the bottom nav pill. */
  navBg: string;
}

export const mobileDark: MobileTheme = {
  bg: '#060d09',
  surface: '#0b1610',
  card: '#0f1c13',
  cardAlt: '#152118',
  accent: '#3dcf7a',
  accentWash: 'rgba(61,207,122,0.13)',
  accentGlow: 'rgba(61,207,122,0.28)',
  text: '#e8f5ec',
  textMuted: 'rgba(232,245,236,0.56)',
  textFaint: 'rgba(232,245,236,0.26)',
  border: 'rgba(255,255,255,0.07)',
  glassBg: 'rgba(5,12,7,0.76)',
  glassBorder: 'rgba(255,255,255,0.10)',
  navBg: 'rgba(6,13,8,0.84)',
};

export const mobileLight: MobileTheme = {
  bg: '#f1f7f3',
  surface: '#ffffff',
  card: '#ffffff',
  cardAlt: '#e9f2ed',
  accent: '#1b9456',
  accentWash: 'rgba(27,148,86,0.10)',
  accentGlow: 'rgba(27,148,86,0.20)',
  text: '#0c1a10',
  textMuted: 'rgba(12,26,16,0.58)',
  textFaint: 'rgba(12,26,16,0.30)',
  border: 'rgba(0,0,0,0.08)',
  glassBg: 'rgba(241,247,243,0.84)',
  glassBorder: 'rgba(0,0,0,0.10)',
  navBg: 'rgba(238,247,242,0.90)',
};

/** Darker end of the accent, used as the second stop in CTA gradients. */
export const accentGradientEnd = { dark: '#1d8f50', light: '#0d5c30' } as const;

/** Avatar/logo gradients run a touch deeper than CTA gradients. */
export const accentGradientDeep = { dark: '#1e5f38', light: '#0d4a28' } as const;

/**
 * Status hues for orders and fulfilment. Shared by mobile and the seller
 * dashboard so "shipped" is never two different blues.
 */
export const mobileStatusColors = {
  processing: '#f59e0b',
  confirmed: '#f59e0b',
  packed: '#3b82f6',
  shipped: '#3b82f6',
  inTransit: '#3b82f6',
  delivered: '#22c55e',
  cancelled: '#6b7280',
  refunded: '#6b7280',
} as const;

/** Ratings gold and sale red — fixed across both themes. */
export const mobileAccents = {
  star: '#f59e0b',
  sale: '#ef4444',
  like: '#f43f5e',
  positive: '#22c55e',
} as const;

/* ── oklch → sRGB ──────────────────────────────────────────────────────────
 * The design keys every product tile to a single `hue` number and builds the
 * artwork from oklch stops. React Native's style engine has no oklch parser, so
 * the conversion happens here in JS and screens receive plain hex.
 *
 * Chosen over hand-picking hex per product because the hue is data — it comes
 * off the product row — and a formula keeps a newly seeded product looking like
 * it belongs without anyone opening a colour picker.
 */

function gammaEncode(channel: number): number {
  const c = channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

/** Converts an oklch triplet to a `#rrggbb` string, clipping out-of-gamut. */
export function oklchToHex(lightness: number, chroma: number, hueDeg: number): string {
  const hueRad = (hueDeg * Math.PI) / 180;
  const a = chroma * Math.cos(hueRad);
  const b = chroma * Math.sin(hueRad);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const r = gammaEncode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = gammaEncode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = gammaEncode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);

  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The three-stop ramp behind a product tile, for a given product hue.
 *
 * The design specifies a *radial* gradient. React Native has no first-class
 * radial fill, so these stops are rendered as a diagonal linear gradient
 * instead. At tile size (roughly 118–318pt) the two are visually
 * indistinguishable, and a linear gradient is a stable public API rather than
 * an experimental style prop.
 */
export function productTileStops(hue: number, isDark: boolean): [string, string, string] {
  if (isDark) {
    return [
      oklchToHex(0.34, 0.13, hue),
      oklchToHex(0.19, 0.07, hue),
      oklchToHex(0.1, 0.04, (hue + 55) % 360),
    ];
  }
  return [
    oklchToHex(0.93, 0.05, hue),
    oklchToHex(0.83, 0.1, hue),
    oklchToHex(0.73, 0.08, (hue + 30) % 360),
  ];
}

/** Where each `productTileStops` colour lands along the gradient. */
export const productTileLocations = [0, 0.45, 1] as const;

/**
 * Stand-in artwork per category.
 *
 * The design renders no photography at all — a category glyph at low opacity
 * over the hue ramp *is* the product image. That keeps a marketplace with
 * inconsistent seller photography looking like one coherent store.
 */
export const categoryEmoji: Record<string, string> = {
  Electronics: '🎧',
  Fashion: '👜',
  Beauty: '✨',
  Home: '🏡',
  Sports: '⚽',
  Books: '📚',
  Toys: '🧸',
  Gaming: '🎮',
};

export function emojiForCategory(category: string | null | undefined): string {
  return (category && categoryEmoji[category]) || '📦';
}

/** Type scale for mobile, in pt. Finer-grained than the shared web scale. */
export const mobileFontSize = {
  micro: 9,
  tiny: 10,
  caption: 11,
  small: 12,
  body: 13,
  base: 14,
  lg: 16,
  xl: 21,
  '2xl': 23,
  '3xl': 26,
  '4xl': 30,
} as const;

/** Corner radii used by the mobile design. Larger than the web scale. */
export const mobileRadii = {
  chip: 10,
  control: 12,
  input: 14,
  card: 16,
  tile: 20,
  hero: 24,
  pill: 46,
  full: 9999,
} as const;

export const mobileFontFamily = {
  /** Headings, prices, anything display. */
  display: 'CormorantGaramond_700Bold',
  /** Body copy and controls. */
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemibold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
} as const;
