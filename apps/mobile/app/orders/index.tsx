import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import type { OrderSummaryDTO } from '@marketnest/shared-types';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/states';
import { useApi } from '../../src/hooks/use-api';
import { useAuth } from '../../src/contexts/auth-context';
import { colors, fontSize, formatPrice, radii, shadow, spacing, statusColors } from '../../src/theme';

function statusColor(status: string): string {
  return (statusColors as Record<string, string>)[status] ?? colors.mid;
}

function label(status: string): string {
  return status.replaceAll('_', ' ');
}

export default function OrdersScreen() {
  const router = useRouter();
  const { isAuthenticated, isBuyer, loading: authLoading } = useAuth();
  const { data, loading, error, reload } = useApi<OrderSummaryDTO[]>(
    isAuthenticated && isBuyer ? '/orders' : null,
  );

  if (authLoading) return <LoadingState />;

  if (!isAuthenticated) {
    return <EmptyState title="Sign in to view orders" message="Your order history lives here." />;
  }

  if (!isBuyer) {
    return (
      <EmptyState
        title="Customer account required"
        message="Order history is only available on customer accounts."
      />
    );
  }

  if (loading) return <LoadingState label="Loading your orders…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const orders = data ?? [];

  if (orders.length === 0) {
    return <EmptyState title="No orders yet" message="Your purchases will appear here." />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Your orders' }} />
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, shadow('sm')]}
            onPress={() => router.push(`/orders/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
              <View style={[styles.pill, { backgroundColor: statusColor(item.status) }]}>
                <Text style={styles.pillText}>{label(item.status)}</Text>
              </View>
            </View>
            <Text style={styles.muted}>
              {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'} ·{' '}
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.total}>{formatPrice(item.total)}</Text>
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: fontSize.base, fontWeight: '700', color: colors.ink },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radii.full },
  pillText: { color: colors.white, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  muted: { fontSize: fontSize.sm, color: colors.mid },
  total: { fontSize: fontSize.lg, fontWeight: '700', color: colors.ink, marginTop: spacing.xs },
});
