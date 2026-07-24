import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
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
  /**
   * Real product photo, when the product has one. Present → the image is the
   * artwork; absent → the generated gradient+emoji is the fallback (older
   * products, and any listing whose seller uploaded no photo).
   */
  imageUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Product artwork: a real photo when one exists, else a hue-keyed gradient with
 * the category glyph floated over it.
 *
 * The generated gradient was originally the *only* artwork (the app shipped no
 * photography by design). That was reversed by explicit request: sellers now
 * upload real images, so this renders the photo when present and falls back to
 * the branded gradient for products without one — a marketplace of mixed
 * photographed and generated tiles still reads as one store because the
 * fallback is consistent.
 *
 * The gradient path renders the design's radial fill as a diagonal linear one:
 * React Native has no first-class radial fill, and at tile size the difference
 * is not visible. See `productTileStops` for the colour derivation.
 */
export function ProductArt({
  hue,
  category,
  isDark,
  glyphSize,
  imageUrl,
  style,
  children,
}: ProductArtProps) {
  if (imageUrl) {
    return (
      <View style={[styles.art, style]}>
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          // Decorative here — the surrounding card/hero already carries the
          // product name as its accessible label.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        {children}
      </View>
    );
  }

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
