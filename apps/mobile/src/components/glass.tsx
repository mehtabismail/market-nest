import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { colors } from '../theme';

/**
 * Native iOS Liquid Glass, with a solid fallback everywhere else.
 *
 * This is a real UIVisualEffectView rendered by the OS — not a CSS-style blur
 * imitation — so it samples live content behind it and costs almost nothing.
 *
 * Use it for **chrome only**: tab bar, headers, floating action bars. Do not put
 * it behind product imagery. Sellers upload photos with wildly different
 * backgrounds and lighting, and a translucent panel inherits all of that
 * inconsistency; opaque cards are what make a mixed catalogue read as one store.
 * It also cannot guarantee text contrast over arbitrary content.
 *
 * The API needs iOS 26+, and some iOS 26 betas shipped without it, so support is
 * checked at runtime rather than assumed from the platform version.
 */
function detectGlassSupport(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    return isGlassEffectAPIAvailable();
  } catch {
    // The native module is absent — Expo Go, or a build predating the install.
    // Degrade to the solid surface rather than crashing the whole tab bar.
    return false;
  }
}

const GLASS_SUPPORTED = detectGlassSupport();

export const supportsGlass = GLASS_SUPPORTED;

interface GlassSurfaceProps extends ViewProps {
  /** `regular` reads as frosted; `clear` is barely-there. */
  variant?: 'regular' | 'clear';
  /** Solid colour used when glass is unavailable. */
  fallbackColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function GlassSurface({
  variant = 'regular',
  fallbackColor = colors.white,
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  if (!GLASS_SUPPORTED) {
    // Opaque, not semi-transparent: a half-faked blur looks worse than a clean
    // solid surface and still costs overdraw.
    return (
      <View style={[styles.fallback, { backgroundColor: fallbackColor }, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <GlassView style={style} glassEffectStyle={variant} {...rest}>
      {children}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
