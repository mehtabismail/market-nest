import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OrderDetailDTO } from '@marketnest/shared-types';
import { ApiError } from '@marketnest/api-client';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ScreenHeader } from '../../src/components/screen-header';
import { useCart } from '../../src/contexts/cart-context';
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { api } from '../../src/lib/api';
import { ORDER_STAGES, font, formatPrice, orderProgress, radii, size } from '../../src/theme';

export default function OrderDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, reload } = useApi<OrderDetailDTO>(id ? `/orders/${id}` : null, [id]);
  const { add } = useCart();

  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canCancel = order?.status === 'pending_cod' || order?.status === 'pending_payment';
  const isShipped = order?.status === 'shipped';

  useEffect(() => {
    if (isShipped && id) {
      setLastRefreshed(new Date());
      pollRef.current = setInterval(() => {
        void reload();
        setLastRefreshed(new Date());
      }, 15000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isShipped, id, reload]);

  async function handleCancel() {
    if (!order) return;
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await api.request(`/orders/${order.id}/cancel`, { method: 'POST' });
            await reload();
          } catch (err) {
            Alert.alert(
              'Error',
              err instanceof ApiError || err instanceof Error
                ? err.message
                : 'Could not cancel order.',
            );
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  async function handleReorder() {
    if (!order) return;
    setReordering(true);
    try {
      for (const item of order.items) {
        await add(item.productId, item.quantity);
      }
      router.push('/cart' as never);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof ApiError || err instanceof Error ? err.message : 'Could not reorder.',
      );
    } finally {
      setReordering(false);
    }
  }

  if (!order) {
    return <View style={[styles.loading, { backgroundColor: theme.bg }]} />;
  }

  const progress = orderProgress(order.status);
  const reachedIndex = Math.round((progress.percent / 100) * (ORDER_STAGES.length - 1));
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title={`#${order.id.slice(0, 8).toUpperCase()}`}
        subtitle={formatDate(order.createdAt)}
        back
        backFallback="/orders"
        right={
          <View
            style={[
              styles.headerPill,
              isCancelled
                ? { backgroundColor: progress.color }
                : { backgroundColor: `${progress.color}18` },
            ]}
          >
            <Text
              style={[
                styles.headerPillText,
                { color: isCancelled ? '#ffffff' : progress.color },
              ]}
            >
              {progress.stage}
            </Text>
          </View>
        }
      />

      {/* Delivery timeline */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.timelineHead}>
          <Icon name="truck" size={16} color={theme.accent} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Delivery</Text>
          {order.estimatedFrom && order.estimatedTo ? (
            <Text style={[styles.eta, { color: theme.textMuted }]}>
              {formatDate(order.estimatedFrom)} – {formatDate(order.estimatedTo)}
            </Text>
          ) : null}
        </View>

        {ORDER_STAGES.map((stage, index) => {
          const done = index <= reachedIndex && progress.percent > 0;
          const current = index === reachedIndex && progress.percent > 0 && progress.percent < 100;
          return (
            <View key={stage} style={styles.stageRow}>
              <View style={styles.stageMarker}>
                <View
                  style={[
                    styles.stageDot,
                    {
                      backgroundColor: done ? progress.color : theme.card,
                      borderColor: done ? progress.color : theme.border,
                    },
                  ]}
                >
                  {done ? <Icon name="check" size={10} color="#ffffff" /> : null}
                </View>
                {index < ORDER_STAGES.length - 1 ? (
                  <View
                    style={[
                      styles.stageLine,
                      { backgroundColor: index < reachedIndex ? progress.color : theme.border },
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.stageLabel,
                  {
                    color: done ? theme.text : theme.textFaint,
                    fontFamily: current ? font.bodyBold : font.body,
                  },
                ]}
              >
                {stage}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Items */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>
          Items ({order.items.length})
        </Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.flex}>
              <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.itemMeta, { color: theme.textMuted }]}>
                Qty {item.quantity} · {formatPrice(item.unitPrice)}
              </Text>
            </View>
            <Text style={[styles.itemTotal, { color: theme.text }]}>
              {formatPrice(item.unitPrice * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>Payment</Text>
        <SummaryLine label="Subtotal" value={formatPrice(order.subtotal)} />
        <SummaryLine label="Shipping" value={formatPrice(order.shippingFee)} />
        {order.discount > 0 ? (
          <SummaryLine
            label={order.couponCode ? `Discount (${order.couponCode})` : 'Discount'}
            value={`−${formatPrice(order.discount)}`}
          />
        ) : null}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: theme.accent }]}>{formatPrice(order.total)}</Text>
        </View>
      </View>

      {/* Shipping address */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 8 }]}>Shipping to</Text>
        <Text style={[styles.addressName, { color: theme.text }]}>{order.shippingAddress.fullName}</Text>
        <Text style={[styles.addressBody, { color: theme.textMuted }]}>
          {[
            order.shippingAddress.line1,
            order.shippingAddress.line2,
            order.shippingAddress.city,
            order.shippingAddress.state,
            order.shippingAddress.postalCode,
            order.shippingAddress.country,
          ]
            .filter(Boolean)
            .join(', ')}
        </Text>
      </View>

      {/* Tracking info for shipped orders */}
      {isShipped && lastRefreshed ? (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.trackRow}>
            <Icon name="truck" size={16} color={theme.accent} />
            <Text style={[styles.trackText, { color: theme.text }]}>Tracking active</Text>
            <Text style={[styles.trackMeta, { color: theme.textMuted }]}>
              Updated {lastRefreshed.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actions}>
        {canCancel ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Cancel order"
            disabled={cancelling}
            onPress={() => void handleCancel()}
            style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border, opacity: cancelling ? 0.6 : 1 }]}
          >
            <Icon name="x" size={16} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </Text>
          </PressableScale>
        ) : null}

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Reorder items"
          disabled={reordering}
          onPress={() => void handleReorder()}
          style={[styles.actionButton, { backgroundColor: theme.accent, opacity: reordering ? 0.6 : 1 }]}
        >
          <Icon name="bag" size={16} color="#ffffff" />
          <Text style={[styles.actionText, { color: '#ffffff' }]}>
            {reordering ? 'Adding…' : 'Reorder'}
          </Text>
        </PressableScale>
      </View>
    </ScrollView>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  flex: { flex: 1 },
  headerPill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: radii.chip },
  headerPillText: { fontSize: size.caption, fontFamily: font.bodyBold },
  card: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 16,
    borderRadius: radii.tile,
    borderWidth: 1,
  },
  timelineHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: size.base, fontFamily: font.bodyBold },
  eta: { marginLeft: 'auto', fontSize: size.caption, fontFamily: font.body },
  stageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stageMarker: { alignItems: 'center' },
  stageDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageLine: { width: 2, height: 22, marginVertical: 2 },
  stageLabel: { fontSize: size.small, paddingTop: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 12 },
  itemTitle: { fontSize: size.body, fontFamily: font.bodySemibold },
  itemMeta: { fontSize: size.caption, fontFamily: font.body, marginTop: 1 },
  itemTotal: { fontSize: size.body, fontFamily: font.bodyBold },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: size.body, fontFamily: font.body },
  summaryValue: { fontSize: size.body, fontFamily: font.bodyMedium },
  divider: { height: 1, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontFamily: font.bodyBold },
  totalValue: { fontSize: 17, fontFamily: font.bodyBold },
  addressName: { fontSize: size.body, fontFamily: font.bodySemibold, marginBottom: 2 },
  addressBody: { fontSize: size.small, fontFamily: font.body, lineHeight: size.small * 1.6 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackText: { fontSize: size.body, fontFamily: font.bodySemibold, flex: 1 },
  trackMeta: { fontSize: size.caption, fontFamily: font.body },
  actions: { paddingHorizontal: 20, marginTop: 14, flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: { fontSize: size.body, fontFamily: font.bodyBold },
});
