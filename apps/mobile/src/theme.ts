import { Platform } from 'react-native';
import {
  colors,
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

export {
  colors,
  duration,
  fontSize,
  pressScale,
  radii,
  spacing,
  spring,
  stagger,
  statusColors,
};

/**
 * Shadow presets. iOS wants shadowColor/Offset/Opacity/Radius; Android only
 * honours elevation. Reading both from the shared token keeps the two platforms
 * — and the web box-shadows — visually in step.
 */
export function shadow(level: keyof typeof elevation) {
  const preset = elevation[level];

  return Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: Math.round(preset.shadowRadius / 2) },
      shadowOpacity: preset.shadowOpacity,
      shadowRadius: preset.shadowRadius,
    },
    android: { elevation: preset.elevation },
    default: {},
  });
}

/** Formats a price. Mirrors the web app's presentation. */
export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}
