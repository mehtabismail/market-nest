import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { PressableScale } from './pressable-scale';
import { colors, duration, fontSize, formatPrice, radii, spacing, spring } from '../theme';

/**
 * Photography-first card: the product image is the card, and detail sits on
 * glass over it.
 *
 * Deliberately a scrim + gradient rather than a real GlassView. A grid renders
 * dozens of these while scrolling, and each UIVisualEffectView is a live
 * sampling layer — cheap once, expensive multiplied. Real glass is reserved for
 * chrome, where there is exactly one instance. The gradient is not decoration:
 * it is what guarantees white text stays legible over seller photography we
 * cannot control.
 */
export function ProductCard({
  product,
  onPress,
}: {
  product: BuyerProductListItemDTO;
  onPress?: () => void;
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const heartScale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const discounted = product.comparePrice != null && product.comparePrice > product.price;
  const discountPct = discounted
    ? Math.round((1 - product.price / product.comparePrice!) * 100)
    : 0;

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  function toggleWishlist() {
    setWishlisted((v) => !v);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!reducedMotion) {
      heartScale.value = withSequence(
        withSpring(1.35, spring.press),
        withSpring(1, spring.press),
      );
    }
  }

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${formatPrice(product.price)}`}
    >
      <Image
        source={product.thumbnail}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={duration.enter}
        placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
        accessible={false}
      />

      {/* Legibility floor for white text over arbitrary photography. */}
      <LinearGradient
        colors={['transparent', 'rgba(14,15,17,0.15)', 'rgba(14,15,17,0.92)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topRow}>
        <View style={styles.badges}>
          {product.isMarketNestOfficial && (
            <View style={styles.officialPill}>
              <Ionicons name="shield-checkmark" size={9} color={colors.ink} />
              <Text style={styles.officialText}>Official</Text>
            </View>
          )}
          {discounted && (
            <View style={styles.discountPill}>
              <Text style={styles.discountText}>-{discountPct}%</Text>
            </View>
          )}
        </View>

        <PressableScale
          style={styles.heart}
          onPress={toggleWishlist}
          haptic={null}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          accessibilityState={{ selected: wishlisted }}
        >
          <Animated.View style={heartStyle}>
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={16}
              color={wishlisted ? colors.accent : colors.white}
            />
          </Animated.View>
        </PressableScale>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.priceGroup}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {discounted && (
              <Text style={styles.comparePrice}>{formatPrice(product.comparePrice!)}</Text>
            )}
          </View>

          {product.averageRating != null && (
            <View style={styles.ratingChip}>
              <Ionicons name="star" size={9} color={colors.gold} />
              <Text style={styles.rating}>{product.averageRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    // Editorial 4:5 — taller than square gives the photograph room to lead.
    aspectRatio: 4 / 5,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.sm,
  },
  badges: { gap: 4, alignItems: 'flex-start' },
  officialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  officialText: { color: colors.text, fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  discountPill: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  discountText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  heart: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  info: { padding: spacing.md, gap: 5 },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
    lineHeight: 18,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceGroup: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  price: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
  comparePrice: {
    fontSize: fontSize.xs,
    color: 'rgba(245,243,238,0.55)',
    textDecorationLine: 'line-through',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.scrim,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  rating: { fontSize: 10, color: colors.white, fontWeight: '700' },
});
