import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { ApiError } from '@marketnest/api-client';
import type { BuyerProductDTO } from '@marketnest/shared-types';
import { FadeInItem } from '../../src/components/fade-in';
import { GlassSurface, supportsGlass } from '../../src/components/glass';
import { PressableScale } from '../../src/components/pressable-scale';
import { Skeleton } from '../../src/components/skeleton';
import { ErrorState } from '../../src/components/states';
import { useApi } from '../../src/hooks/use-api';
import { api } from '../../src/lib/api';
import { colors, duration, fontSize, formatPrice, radii, shadow, spacing } from '../../src/theme';

const HERO_HEIGHT = Dimensions.get('window').width;

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: product, loading, error, reload } = useApi<BuyerProductDTO>(`/products/${id}`);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const scrollY = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  /**
   * Hero parallax: the image drifts at half scroll speed and scales up when the
   * list is pulled past the top. Only transform and scale are animated, so this
   * stays on the compositor and never triggers layout.
   */
  const heroStyle = useAnimatedStyle(() => {
    if (reducedMotion) return {};
    return {
      transform: [
        {
          translateY: interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [
            -HERO_HEIGHT / 2,
            0,
            HERO_HEIGHT * 0.5,
          ]),
        },
        {
          scale: interpolate(scrollY.value, [-HERO_HEIGHT, 0], [2, 1], 'clamp'),
        },
      ],
    };
  });

  async function addToCart() {
    if (!product) return;
    setAdding(true);
    setCartError(null);
    try {
      await api.ensureGuestSession();
      await api.request('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      setAdded(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCartError(err instanceof ApiError ? err.message : 'Could not add to cart.');
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <Skeleton style={styles.heroSkeleton} />
        <View style={styles.body}>
          <Skeleton style={{ height: 26, width: '75%' }} />
          <Skeleton style={{ height: 22, width: '35%' }} />
          <Skeleton style={{ height: 14, width: '100%' }} />
          <Skeleton style={{ height: 14, width: '85%' }} />
        </View>
      </View>
    );
  }

  if (error || !product) {
    return <ErrorState message={error ?? 'Product not found.'} onRetry={reload} />;
  }

  const outOfStock = product.stockQty <= 0;
  const discounted = product.comparePrice != null && product.comparePrice > product.price;
  const lowStock = !outOfStock && product.stockQty <= 5;

  return (
    <>
      <Stack.Screen
        options={{
          title: product.title,
          headerTransparent: supportsGlass,
          headerBackground: supportsGlass
            ? () => <GlassSurface style={StyleSheet.absoluteFill as never} />
            : undefined,
        }}
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.heroWrap}>
          <Animated.View style={heroStyle}>
            <Image
              source={product.images?.[0]}
              style={styles.hero}
              contentFit="cover"
              transition={duration.enter}
              placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
            />
          </Animated.View>
        </View>

        <View style={styles.body}>
          <FadeInItem index={0}>
            <View style={styles.badgeRow}>
              {product.isMarketNestOfficial && (
                <View style={[styles.pill, { backgroundColor: colors.gold }]}>
                  <Text style={styles.pillText}>MarketNest Official</Text>
                </View>
              )}
              {lowStock && (
                <View style={[styles.pill, { backgroundColor: colors.accent }]}>
                  <Text style={styles.pillText}>Only {product.stockQty} left</Text>
                </View>
              )}
            </View>
          </FadeInItem>

          <FadeInItem index={1}>
            <Text style={styles.title}>{product.title}</Text>
          </FadeInItem>

          <FadeInItem index={2}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {discounted && (
                <Text style={styles.comparePrice}>{formatPrice(product.comparePrice!)}</Text>
              )}
              {product.averageRating != null && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color={colors.gold} />
                  <Text style={styles.rating}>
                    {product.averageRating.toFixed(1)}
                    {product.reviewCount ? ` · ${product.reviewCount}` : ''}
                  </Text>
                </View>
              )}
            </View>
          </FadeInItem>

          {product.description && (
            <FadeInItem index={3}>
              <Text style={styles.description}>{product.description}</Text>
            </FadeInItem>
          )}

          {cartError && <Text style={styles.error}>{cartError}</Text>}
        </View>
      </Animated.ScrollView>

      {/* Floating action bar. Glass here is purposeful: it signals that content
          continues beneath, and keeps the primary CTA reachable at all times. */}
      <GlassSurface style={styles.footer} fallbackColor={colors.white}>
        <View style={styles.footerInner}>
          <PressableScale
            style={[styles.cta, (outOfStock || adding) && styles.ctaDisabled]}
            onPress={addToCart}
            disabled={outOfStock || adding}
            haptic={null}
            accessibilityRole="button"
            accessibilityLabel={outOfStock ? 'Out of stock' : 'Add to cart'}
          >
            {added && <Ionicons name="checkmark" size={18} color={colors.white} />}
            <Text style={styles.ctaLabel}>
              {outOfStock
                ? 'Out of stock'
                : adding
                  ? 'Adding…'
                  : added
                    ? 'Added to cart'
                    : 'Add to cart'}
            </Text>
          </PressableScale>

          <PressableScale
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
            accessibilityRole="button"
            accessibilityLabel="View cart"
          >
            <Ionicons name="bag-outline" size={20} color={colors.ink} />
          </PressableScale>
        </View>
      </GlassSurface>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  loading: { flex: 1 },
  heroSkeleton: { width: '100%', height: HERO_HEIGHT, borderRadius: 0 },
  heroWrap: { height: HERO_HEIGHT, overflow: 'hidden', backgroundColor: colors.cream },
  hero: { width: '100%', height: HERO_HEIGHT },
  body: { padding: spacing.lg, gap: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radii.full },
  pillText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.ink, lineHeight: 32 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  price: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.ink },
  comparePrice: { fontSize: fontSize.base, color: colors.mid, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: fontSize.sm, color: colors.mid, fontWeight: '600' },
  description: { fontSize: fontSize.base, color: colors.mid, lineHeight: 25 },
  error: { color: colors.accent, fontSize: fontSize.sm },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  footerInner: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  cta: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radii.full,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { color: colors.white, fontWeight: '700', fontSize: fontSize.base },
  cartButton: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadow('sm') as object),
  },
});
