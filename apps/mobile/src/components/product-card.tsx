import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
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
import { colors, duration, fontSize, formatPrice, radii, shadow, spacing, spring } from '../theme';

/**
 * Opaque card on a warm surface — deliberately not glass.
 *
 * Seller-supplied photography varies enormously in background, lighting and
 * crop. A translucent panel inherits all of that; a solid card is what makes a
 * mixed catalogue read as a single coherent store. Glass is reserved for chrome.
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

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  function toggleWishlist() {
    setWishlisted((v) => !v);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reducedMotion) {
      // Overshoot then settle — the little pop is what makes the tap feel
      // acknowledged rather than merely recorded.
      heartScale.value = withSequence(
        withSpring(1.3, spring.press),
        withSpring(1, spring.press),
      );
    }
  }

  return (
    <PressableScale
      style={[styles.card, shadow('sm')]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${formatPrice(product.price)}`}
    >
      <View style={styles.thumbWrap}>
        <Image
          source={product.thumbnail}
          style={styles.thumb}
          contentFit="cover"
          transition={duration.enter}
          placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
          accessible={false}
        />

        {product.isMarketNestOfficial && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Official</Text>
          </View>
        )}

        {discounted && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}

        <PressableScale
          style={styles.heart}
          onPress={toggleWishlist}
          haptic={null}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          accessibilityState={{ selected: wishlisted }}
        >
          <Animated.View style={heartStyle}>
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={17}
              color={wishlisted ? colors.accent : colors.ink}
            />
          </Animated.View>
        </PressableScale>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {discounted && (
            <Text style={styles.comparePrice}>{formatPrice(product.comparePrice!)}</Text>
          )}
        </View>

        {product.averageRating != null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={colors.gold} />
            <Text style={styles.rating}>
              {product.averageRating.toFixed(1)}
              {product.reviewCount ? ` (${product.reviewCount})` : ''}
            </Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  thumbWrap: { position: 'relative' },
  thumb: { width: '100%', aspectRatio: 1, backgroundColor: colors.cream },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  discountBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  discountText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  body: { padding: spacing.md, gap: spacing.xs },
  title: { fontSize: fontSize.sm, fontWeight: '600', color: colors.ink, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  price: { fontSize: fontSize.base, fontWeight: '700', color: colors.ink },
  comparePrice: {
    fontSize: fontSize.xs,
    color: colors.mid,
    textDecorationLine: 'line-through',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: fontSize.xs, color: colors.mid, fontWeight: '600' },
});
