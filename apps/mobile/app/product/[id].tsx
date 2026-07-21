import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ApiError } from '@marketnest/api-client';
import type { BuyerProductDTO } from '@marketnest/shared-types';
import { ErrorState, LoadingState } from '../../src/components/states';
import { useApi } from '../../src/hooks/use-api';
import { api } from '../../src/lib/api';
import { colors, fontSize, formatPrice, radii, shadow, spacing } from '../../src/theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: product, loading, error, reload } = useApi<BuyerProductDTO>(`/products/${id}`);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  async function addToCart() {
    if (!product) return;
    setAdding(true);
    setCartError(null);
    try {
      // Guests can hold a cart; the session id is issued server-side.
      await api.ensureGuestSession();
      await api.request('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setCartError(err instanceof ApiError ? err.message : 'Could not add to cart.');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error || !product) {
    return <ErrorState message={error ?? 'Product not found.'} onRetry={reload} />;
  }

  const outOfStock = product.stockQty <= 0;
  const discounted = product.comparePrice != null && product.comparePrice > product.price;

  return (
    <>
      <Stack.Screen options={{ title: product.title }} />
      <ScrollView contentContainerStyle={styles.container}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Text style={styles.muted}>No image</Text>
          </View>
        )}

        <View style={styles.body}>
          {product.isMarketNestOfficial && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>MarketNest Official</Text>
            </View>
          )}

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {discounted && (
              <Text style={styles.comparePrice}>{formatPrice(product.comparePrice!)}</Text>
            )}
          </View>

          <Text style={outOfStock ? styles.outOfStock : styles.inStock}>
            {outOfStock ? 'Out of stock' : `${product.stockQty} in stock`}
          </Text>

          {product.description && <Text style={styles.description}>{product.description}</Text>}

          {cartError && <Text style={styles.error}>{cartError}</Text>}
        </View>
      </ScrollView>

      <View style={[styles.footer, shadow('lg')]}>
        <Pressable
          style={[styles.primary, (outOfStock || adding) && styles.disabled]}
          onPress={addToCart}
          disabled={outOfStock || adding}
        >
          <Text style={styles.primaryLabel}>
            {outOfStock ? 'Out of stock' : adding ? 'Adding…' : added ? 'Added to cart' : 'Add to cart'}
          </Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push('/cart')}>
          <Text style={styles.secondaryLabel}>View cart</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing['3xl'] },
  hero: { width: '100%', aspectRatio: 1, backgroundColor: colors.cream },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg, gap: spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.ink, lineHeight: 30 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  price: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.ink },
  comparePrice: { fontSize: fontSize.base, color: colors.mid, textDecorationLine: 'line-through' },
  inStock: { fontSize: fontSize.sm, color: colors.teal, fontWeight: '600' },
  outOfStock: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },
  description: { fontSize: fontSize.base, color: colors.mid, lineHeight: 24, marginTop: spacing.sm },
  muted: { color: colors.mid, fontSize: fontSize.sm },
  error: { color: colors.accent, fontSize: fontSize.sm },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  primary: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: radii.full,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  primaryLabel: { color: colors.white, fontWeight: '700', fontSize: fontSize.base },
  secondary: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  secondaryLabel: { color: colors.mid, fontWeight: '600' },
});
