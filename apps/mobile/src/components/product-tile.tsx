import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  emojiForCategory,
  productTileLocations,
  productTileStops,
} from '../theme';

interface ProductArtProps {
  /** Hue that keys the gradient. Comes off the product row. */
  hue: number;
  category: string | null | undefined;
  isDark: boolean;
  /** Emoji point size. Scales with the tile, not with the container. */
  glyphSize: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Product artwork: a hue-keyed gradient with the category glyph floated over it.
 *
 * This *is* the product image — the design ships no photography at all, on the
 * reasoning that a marketplace with inconsistent seller photos reads as one
 * coherent store only if nobody's photo is shown. The glyph sits at low opacity
 * so it registers as texture rather than as an illustration.
 *
 * The design's radial gradient is rendered as a diagonal linear one: React
 * Native has no first-class radial fill, and at tile size the difference is not
 * visible. See `productTileStops` for the colour derivation.
 */
export function ProductArt({
  hue,
  category,
  isDark,
  glyphSize,
  style,
  children,
}: ProductArtProps) {
  return (
    <LinearGradient
      colors={productTileStops(hue, isDark)}
      locations={productTileLocations}
      start={{ x: 0.15, y: 0.1 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.art, style]}
    >
      <Text
        style={[styles.glyph, { fontSize: glyphSize }]}
        allowFontScaling={false}
        // Decorative texture, not content — a screen reader announcing "package"
        // on every tile would bury the product name underneath it.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {emojiForCategory(category)}
      </Text>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyph: {
    opacity: 0.18,
  },
});

/** Wraps absolutely-positioned tile overlays (badges, wishlist button). */
export function ArtOverlay({ children }: { children: React.ReactNode }) {
  return <View style={StyleSheet.absoluteFill}>{children}</View>;
}
