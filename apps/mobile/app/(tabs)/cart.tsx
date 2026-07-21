import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ApiError } from '@marketnest/api-client';
import type { CartDTO } from '@marketnest/shared-types';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/states';
import { api } from '../../src/lib/api';
import { colors, fontSize, formatPrice, radii, shadow, spacing } from '../../src/theme';

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Guests need a server-issued session before they can hold a cart.
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

  if (loading && !cart) return <LoadingState label="Loading your cart…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return <EmptyState title="Your cart is empty" message="Browse the shop to add something." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.productId}:${item.variantId ?? 'default'}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.line, shadow('sm')]}>
            {item.product.thumbnail ? (
              <Image source={{ uri: item.product.thumbnail }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback]} />
            )}
            <View style={styles.lineBody}>
              <Text style={styles.lineTitle} numberOfLines={2}>
                {item.product.title}
              </Text>
              <Text style={styles.muted}>
                {formatPrice(item.unitPrice)} × {item.quantity}
              </Text>
            </View>
            <Text style={styles.lineTotal}>{formatPrice(item.lineTotal)}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.muted}>Subtotal</Text>
          <Text style={styles.subtotal}>{formatPrice(cart?.subtotal ?? 0)}</Text>
        </View>
        <Pressable style={styles.checkout} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutLabel}>Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  thumb: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.cream },
  thumbFallback: { backgroundColor: colors.cream },
  lineBody: { flex: 1, gap: 2 },
  lineTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.ink },
  muted: { fontSize: fontSize.xs, color: colors.mid },
  lineTotal: { fontSize: fontSize.base, fontWeight: '700', color: colors.ink },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  subtotal: { fontSize: fontSize.xl, fontWeight: '700', color: colors.ink },
  checkout: {
    backgroundColor: colors.ink,
    borderRadius: radii.full,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  checkoutLabel: { color: colors.white, fontWeight: '700', fontSize: fontSize.base },
});
