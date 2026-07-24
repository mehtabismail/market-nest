import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { useTheme } from '../contexts/theme-context';
import { accents, font, formatPriceShort, radii, shadow, size } from '../theme';
import { Icon } from './icon';
import { PressableScale } from './pressable-scale';
import { ProductArt } from './product-tile';

/** Width of a card in a horizontal rail, straight from the design. */
export const RAIL_CARD_WIDTH = 162;

interface ProductCardProps {
  product: BuyerProductListItemDTO;
  /**
   * `rail` is the fixed-width card in a horizontal scroller; `grid` is the
   * flexible one in a two-column grid. They differ in more than width — art
   * height, type sizes, and which controls appear — so this is a variant rather
   * than a style override.
   */
  variant?: 'rail' | 'grid';
  wishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export function ProductCard({
  product,
  variant = 'rail',
  wishlisted = false,
  onToggleWishlist,
}: ProductCardProps) {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const isRail = variant === 'rail';
  const badge = resolveBadge(product);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${formatPriceShort(product.price)}`}
      onPress={() => router.push(`/product/${product.id}` as never)}
      style={[
        styles.card,
        isRail ? { width: RAIL_CARD_WIDTH } : styles.gridCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        shadow('sm'),
      ]}
    >
      <ProductArt
        hue={product.hue}
        category={product.categoryName}
        isDark={isDark}
        glyphSize={isRail ? 52 : 42}
        imageUrl={product.thumbnail}
        style={{ height: isRail ? 144 : 118 }}
      >
        {badge ? (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}

        {isRail && onToggleWishlist ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            onPress={() => onToggleWishlist(product.id)}
            style={[
              styles.heart,
              { backgroundColor: theme.glassBg, borderColor: theme.glassBorder },
            ]}
          >
            <Icon
              name={wishlisted ? 'heartFilled' : 'heart'}
              size={14}
              color={wishlisted ? accents.like : theme.textMuted}
            />
          </PressableScale>
        ) : null}
      </ProductArt>

      <View style={isRail ? styles.railBody : styles.gridBody}>
        {isRail && product.categoryName ? (
          <Text style={[styles.eyebrow, { color: theme.textMuted }]} numberOfLines={1}>
            {product.categoryName}
          </Text>
        ) : null}

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.accent }]}>
              {formatPriceShort(product.price)}
            </Text>
            {product.comparePrice && product.comparePrice > product.price ? (
              <Text style={[styles.comparePrice, { color: theme.textFaint }]}>
                {formatPriceShort(product.comparePrice)}
              </Text>
            ) : null}
          </View>

          {product.averageRating != null ? (
            <View style={styles.ratingRow}>
              <Icon name="star" size={10} color={accents.star} />
              <Text style={[styles.rating, { color: theme.textMuted }]}>
                {product.averageRating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

/**
 * Badges are derived, not stored.
 *
 * "Flash Deal" and "Sale" are facts about the current price and deal window, so
 * computing them keeps a badge from outliving the promotion that justified it.
 */
function resolveBadge(product: BuyerProductListItemDTO): string | null {
  if (product.dealEndsAt && new Date(product.dealEndsAt) > new Date()) return 'Flash Deal';
  if (product.comparePrice && product.comparePrice > product.price) return 'Sale';
  return null;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.tile,
    borderWidth: 1,
    overflow: 'hidden',
    flexShrink: 0,
  },
  // Percentage basis, not `flex: 1`: these wrap into a two-column grid, and a
  // flexing child in a wrapping row expands to fill the whole line.
  gridCard: { flexBasis: '48%', flexGrow: 0 },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: size.micro,
    fontFamily: font.bodyBold,
    color: '#ffffff',
  },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBody: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  gridBody: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  eyebrow: {
    fontSize: size.micro,
    fontFamily: font.bodyBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: size.small,
    fontFamily: font.bodySemibold,
    lineHeight: size.small * 1.25,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { fontSize: size.base, fontFamily: font.bodyBold },
  comparePrice: {
    fontSize: size.tiny,
    fontFamily: font.body,
    textDecorationLine: 'line-through',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: size.tiny, fontFamily: font.bodySemibold },
});
