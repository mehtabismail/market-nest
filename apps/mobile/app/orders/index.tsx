import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OrderSummaryDTO } from '@marketnest/shared-types';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ScreenHeader } from '../../src/components/screen-header';
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { font, formatPrice, orderProgress, radii, size } from '../../src/theme';

export default function OrdersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: orders, loading } = useApi<OrderSummaryDTO[]>('/orders');

  const list = orders ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="My Orders"
        subtitle={loading ? undefined : `${list.length} order${list.length === 1 ? '' : 's'}`}
        back
        backFallback="/account"
      />

      {!loading && list.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyGlyph}>📦</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No orders yet</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            When you place an order it will show up here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {list.map((order) => {
            const progress = orderProgress(order.status);
            const isTracking = progress.percent > 0 && progress.percent < 100;
            return (
              <PressableScale
                key={order.id}
                accessibilityRole="button"
                accessibilityLabel={`Order ${order.id.slice(0, 8)}, ${progress.stage}`}
                onPress={() => router.push(`/orders/${order.id}` as never)}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.cardHead}>
                  <Text style={[styles.orderId, { color: theme.text }]}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={[styles.orderDate, { color: theme.textMuted }]}>
                    {formatDate(order.createdAt)}
                  </Text>
                </View>

                <Text style={[styles.itemLine, { color: theme.textMuted }]}>
                  {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                </Text>

                <View style={styles.statusRow}>
                  <View style={[styles.statusPill, { backgroundColor: `${progress.color}18` }]}>
                    <Text style={[styles.statusText, { color: progress.color }]}>{progress.stage}</Text>
                  </View>
                  <Text style={[styles.total, { color: theme.accent }]}>{formatPrice(order.total)}</Text>
                </View>

                <View style={[styles.track, { backgroundColor: theme.border }]}>
                  <View
                    style={[styles.trackFill, { width: `${progress.percent}%`, backgroundColor: progress.color }]}
                  />
                </View>

                <View style={styles.trackMeta}>
                  <Text style={[styles.trackStage, { color: theme.textFaint }]}>{progress.stage}</Text>
                  {order.estimatedTo ? (
                    <Text style={[styles.trackEta, { color: theme.textMuted }]}>
                      ETA: {formatDate(order.estimatedTo)}
                    </Text>
                  ) : null}
                </View>

                {isTracking ? (
                  <View style={[styles.trackButton, { borderColor: theme.accentGlow }]}>
                    <Icon name="truck" size={14} color={theme.accent} />
                    <Text style={[styles.trackButtonText, { color: theme.accent }]}>Track Live</Text>
                  </View>
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  emptyGlyph: { fontSize: 56, marginBottom: 16, opacity: 0.35 },
  emptyTitle: { fontSize: 18, fontFamily: font.display, marginBottom: 6 },
  emptyBody: { fontSize: size.body, fontFamily: font.body, textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  card: { borderRadius: radii.tile, borderWidth: 1, padding: 14, marginBottom: 14 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontSize: size.small, fontFamily: font.bodyBold },
  orderDate: { fontSize: size.caption, fontFamily: font.body },
  itemLine: { fontSize: size.body, fontFamily: font.body, marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.chip },
  statusText: { fontSize: size.caption, fontFamily: font.bodyBold },
  total: { fontSize: size.base, fontFamily: font.bodyBold },
  track: { height: 4, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4 },
  trackMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  trackStage: { fontSize: size.tiny, fontFamily: font.body },
  trackEta: { fontSize: size.tiny, fontFamily: font.bodySemibold },
  trackButton: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: radii.chip,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trackButtonText: { fontSize: size.small, fontFamily: font.bodySemibold },
});
