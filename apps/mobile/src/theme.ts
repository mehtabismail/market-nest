import { Platform } from 'react-native';
import {
  colors as brand,
  dark,
  duration,
  elevation,
  fontSize,
  pressScale,
  radii,
  spacing,
  spring,
  stagger,
  statusColors,
} from '@marketnest/tokens';

export { dark, duration, fontSize, pressScale, radii, spacing, spring, stagger, statusColors };

/**
 * Mobile palette — dark canvas, brand accents.
 *
 * `colors.*` resolves to the dark scale so screens do not each decide what
 * "background" means. Brand hues (accent, gold, teal) are unchanged from web;
 * only the canvas inverted.
 */
export const colors = {
  base: dark.base,
  surface: dark.surface,
  surfaceHigh: dark.surfaceHigh,
  border: dark.border,
  text: dark.text,
  textMuted: dark.textMuted,
  textFaint: dark.textFaint,
  scrim: dark.scrim,
  scrimStrong: dark.scrimStrong,
  hairline: dark.hairline,

  accent: brand.accent,
  accentSoft: brand.accentSoft,
  gold: brand.gold,
  teal: brand.teal,
  white: brand.white,
  ink: brand.ink,
} as const;

/**
 * Shadows barely read on a dark canvas — depth comes from surface lightness and
 * hairlines instead. Kept for the few places a lifted element sits over imagery.
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

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}
