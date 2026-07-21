import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { colors, fontSize, formatPrice, radii, shadow, spacing } from '../theme';

/**
 * Opaque card on a warm surface — not a translucent panel. Seller-supplied
 * photography varies enormously, and a solid card is what makes a mixed
 * catalogue read as one store.
 */
export function ProductCard({
  product,
  onPress,
}: {
  product: BuyerProductListItemDTO;
  onPress?: () => void;
}) {
  const discounted = product.comparePrice != null && product.comparePrice > product.price;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, shadow('sm'), pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${formatPrice(product.price)}`}
    >
      <View style={styles.thumbWrap}>
        {product.thumbnail ? (
          <Image source={{ uri: product.thumbnail }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Text style={styles.thumbFallbackText}>No image</Text>
          </View>
        )}
        {product.isMarketNestOfficial && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Official</Text>
          </View>
        )}
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
          <Text style={styles.rating}>
            ★ {product.averageRating.toFixed(1)}
            {product.reviewCount ? ` (${product.reviewCount})` : ''}
          </Text>
        )}
      </View>
    </Pressable>
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
  pressed: { opacity: 0.85 },
  thumbWrap: { position: 'relative' },
  thumb: { width: '100%', aspectRatio: 1, backgroundColor: colors.cream },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbFallbackText: { color: colors.mid, fontSize: fontSize.xs },
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
  body: { padding: spacing.md, gap: spacing.xs },
  title: { fontSize: fontSize.sm, fontWeight: '600', color: colors.ink, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  price: { fontSize: fontSize.base, fontWeight: '700', color: colors.ink },
  comparePrice: {
    fontSize: fontSize.xs,
    color: colors.mid,
    textDecorationLine: 'line-through',
  },
  rating: { fontSize: fontSize.xs, color: colors.gold },
});
