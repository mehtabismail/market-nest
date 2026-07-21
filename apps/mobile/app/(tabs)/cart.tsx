import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ApiError } from '@marketnest/api-client';
import type { CartDTO } from '@marketnest/shared-types';
import { FadeInItem } from '../../src/components/fade-in';
import { GlassSurface } from '../../src/components/glass';
import { PressableScale } from '../../src/components/pressable-scale';
import { Skeleton } from '../../src/components/skeleton';
import { EmptyState, ErrorState } from '../../src/components/states';
import { api } from '../../src/lib/api';
import { colors, duration, fontSize, formatPrice, radii, shadow, spacing } from '../../src/theme';

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      await api.ensureGuestSession();
      setCart(await api.request<CartDTO>('/cart'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The cart changes from other screens; refresh whenever this tab is focused.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && !cart) {
    return (
      <View style={styles.loadingList}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.line}>
            <Skeleton style={styles.thumb} />
            <View style={styles.lineBody}>
              <Skeleton style={{ height: 13, width: '80%' }} />
              <Skeleton style={{ height: 11, width: '40%' }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState title="Your cart is empty" message="Browse the shop to add something." />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.productId}:${item.variantId ?? 'default'}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item, index }) => (
          <FadeInItem index={index}>
            <PressableScale
              style={[styles.line, shadow('sm')]}
              onPress={() => router.push(`/product/${item.productId}`)}
              accessibilityRole="button"
              accessibilityLabel={`${item.product.title}, quantity ${item.quantity}`}
            >
              <Image
                source={item.product.thumbnail}
                style={styles.thumb}
                contentFit="cover"
                transition={duration.enter}
              />
              <View style={styles.lineBody}>
                <Text style={styles.lineTitle} numberOfLines={2}>
                  {item.product.title}
                </Text>
                <Text style={styles.muted}>
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.lineTotal}>{formatPrice(item.lineTotal)}</Text>
            </PressableScale>
          </FadeInItem>
        )}
      />

      {/* Glass here is purposeful: the summary floats over the list so the
          subtotal and CTA stay visible while scrolling. */}
      <GlassSurface style={styles.footer} fallbackColor={colors.surface}>
        <View style={styles.summaryRow}>
          <Text style={styles.muted}>
            Subtotal · {cart?.itemCount} {cart?.itemCount === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.subtotal}>{formatPrice(cart?.subtotal ?? 0)}</Text>
        </View>
        <PressableScale
          style={styles.checkout}
          onPress={() => router.push('/checkout')}
          accessibilityRole="button"
          accessibilityLabel="Proceed to checkout"
        >
          <Text style={styles.checkoutLabel}>Checkout</Text>
          <Ionicons name="arrow-forward" size={17} color={colors.white} />
        </PressableScale>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingList: { padding: spacing.lg, gap: spacing.md },
  list: { padding: spacing.lg, paddingBottom: 210, gap: spacing.md },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  thumb: { width: 58, height: 58, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  lineBody: { flex: 1, gap: 3 },
  lineTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  muted: { fontSize: fontSize.xs, color: colors.textMuted },
  lineTotal: { fontSize: fontSize.base, fontWeight: '700', color: colors.text },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.lg,
    paddingBottom: 110,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  subtotal: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  checkout: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutLabel: { color: colors.white, fontWeight: '700', fontSize: fontSize.base },
});
