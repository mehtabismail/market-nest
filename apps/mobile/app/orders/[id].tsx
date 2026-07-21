import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { OrderDetailDTO } from '@marketnest/shared-types';
import { ErrorState, LoadingState } from '../../src/components/states';
import { useApi } from '../../src/hooks/use-api';
import { colors, fontSize, formatPrice, radii, shadow, spacing, statusColors } from '../../src/theme';

function statusColor(status: string): string {
  return (statusColors as Record<string, string>)[status] ?? colors.mid;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, loading, error, reload } = useApi<OrderDetailDTO>(`/orders/${id}`);

  if (loading) return <LoadingState />;
  if (error || !order) return <ErrorState message={error ?? 'Order not found.'} onRetry={reload} />;

  const address = order.shippingAddress;

  return (
    <>
      <Stack.Screen options={{ title: `Order #${order.id.slice(0, 8)}` }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, shadow('sm')]}>
          <View style={[styles.pill, { backgroundColor: statusColor(order.status) }]}>
            <Text style={styles.pillText}>{order.status.replaceAll('_', ' ')}</Text>
          </View>
          <Text style={styles.muted}>
            Placed {new Date(order.createdAt).toLocaleDateString()} ·{' '}
            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}
          </Text>
        </View>

        <View style={[styles.card, shadow('sm')]}>
          <Text style={styles.heading}>Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.muted}>
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </Text>
                {item.trackingNumber && (
                  <Text style={styles.tracking}>
                    {item.courierName ?? 'Courier'}: {item.trackingNumber}
                  </Text>
                )}
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.unitPrice * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, shadow('sm')]}>
          <Text style={styles.heading}>Summary</Text>
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          <Row label="Shipping" value={formatPrice(order.shippingFee)} />
          <Row label="Total" value={formatPrice(order.total)} emphasis />
        </View>

        <View style={[styles.card, shadow('sm')]}>
          <Text style={styles.heading}>Delivering to</Text>
          <Text style={styles.address}>
            {address.fullName}
            {'\n'}
            {address.line1}
            {address.line2 ? `\n${address.line2}` : ''}
            {'\n'}
            {address.city}, {address.state} {address.postalCode}
            {'\n'}
            {address.country}
            {'\n'}
            {address.phone}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={emphasis ? styles.totalLabel : styles.muted}>{label}</Text>
      <Text style={emphasis ? styles.totalValue : styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heading: { fontSize: fontSize.base, fontWeight: '700', color: colors.ink },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  pillText: { color: colors.white, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  muted: { fontSize: fontSize.sm, color: colors.mid },
  value: { fontSize: fontSize.sm, color: colors.ink },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream,
  },
  itemBody: { flex: 1, gap: 2 },
  itemTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.ink },
  itemTotal: { fontSize: fontSize.sm, fontWeight: '700', color: colors.ink },
  tracking: { fontSize: fontSize.xs, color: colors.teal, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSize.base, fontWeight: '700', color: colors.ink },
  totalValue: { fontSize: fontSize.base, fontWeight: '700', color: colors.ink },
  address: { fontSize: fontSize.sm, color: colors.mid, lineHeight: 22 },
});
