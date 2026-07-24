import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ScreenHeader } from '../../src/components/screen-header';
import { useAuth } from '../../src/contexts/auth-context';
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { accents, font, formatPrice, radii, size, statusColors } from '../../src/theme';

/** Shape from GET /seller/earnings */
interface EarningsData {
  commissionRate: number;
  allTime: { gross: number; commission: number; net: number };
  week: { gross: number; commission: number; net: number };
  month: { gross: number; commission: number; net: number };
  dailyChart: Array<{ date: string; net: number }>;
}

/** Shape from GET /seller/orders */
interface SellerOrder {
  orderId: string;
  status: string;
  createdAt: string;
  buyerName?: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
    status: string;
  }>;
  sellerTotal: number;
}

const TABS = ['Overview', 'Products', 'Orders', 'Payouts'] as const;
type Tab = (typeof TABS)[number];

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const QUICK_ACTIONS: { glyph: string; label: string; route?: string; onPress?: () => void }[] = [
  { glyph: '📦', label: 'Add Product', route: '/seller/new-product' },
  { glyph: '🗂️', label: 'My Listings', route: '/seller/listings' },
  { glyph: '💰', label: 'Payouts', route: '/seller/payouts' },
  { glyph: '💬', label: 'Support', onPress: () => Alert.alert('Support', 'Contact support@marketnest.com') },
];

/** Get last N days as YYYY-MM-DD strings */
function getLastNDays(n: number): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

/** Pad chart data to include zeros for missing days */
function padChartData(
  dailyChart: Array<{ date: string; net: number }> | undefined,
  days: number,
): number[] {
  const dates = getLastNDays(days);
  const byDate = new Map((dailyChart ?? []).map((d) => [d.date, d.net]));
  return dates.map((d) => byDate.get(d) ?? 0);
}

export default function SellerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const verified = Boolean(user?.seller?.isVerified);
  const [tab, setTab] = useState<Tab>('Overview');

  const {
    data: earnings,
    loading: earningsLoading,
    reload: reloadEarnings,
  } = useApi<EarningsData>('/seller/earnings');

  const {
    data: orders,
    loading: ordersLoading,
    reload: reloadOrders,
  } = useApi<SellerOrder[]>('/seller/orders');

  useFocusEffect(
    useCallback(() => {
      void reloadEarnings();
      void reloadOrders();
    }, [reloadEarnings, reloadOrders]),
  );

  const loading = earningsLoading || ordersLoading;

  function onTab(label: Tab) {
    switch (label) {
      case 'Products':
        router.push('/seller/listings' as never);
        return;
      case 'Orders':
        router.push('/seller/orders' as never);
        return;
      case 'Payouts':
        router.push('/seller/payouts' as never);
        return;
      default:
        setTab(label);
    }
  }

  const weekNet = earnings?.week.net ?? 0;
  const orderCount = orders?.length ?? 0;
  const allTimeNet = earnings?.allTime.net ?? 0;

  const STATS: { value: string; label: string; icon: IconName }[] = [
    { value: formatPrice(weekNet), label: 'Week Revenue', icon: 'dollar' },
    { value: String(orderCount), label: 'Total Orders', icon: 'package' },
    { value: formatPrice(allTimeNet), label: 'All-Time Net', icon: 'chart' },
    { value: `${earnings?.commissionRate ?? 0}%`, label: 'Commission', icon: 'store' },
  ];

  const chartValues = padChartData(earnings?.dailyChart, 7);
  const maxChart = Math.max(...chartValues, 1);
  const chartBars = chartValues.map((v) => Math.round((v / maxChart) * 100));

  const recentOrders = (orders ?? []).slice(0, 3);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Seller Central"
        subtitle="Your storefront"
        back
        backFallback="/account"
        right={
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add product"
            onPress={() =>
              router.push((verified ? '/seller/new-product' : '/kyc') as never)
            }
            style={[styles.addBtn, { backgroundColor: theme.accent }]}
          >
            <Icon name="plus" size={16} color="#ffffff" />
          </PressableScale>
        }
      />

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {TABS.map((label) => {
          const active = tab === label;
          return (
            <PressableScale
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onTab(label)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.accent : theme.card,
                  borderColor: active ? theme.accent : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? '#ffffff' : theme.textMuted, fontFamily: active ? font.bodyBold : font.bodyMedium },
                ]}
              >
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <>
          {/* Stat cards */}
          <View style={styles.statGrid}>
            {STATS.map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.statTop}>
                  <View style={[styles.statIcon, { backgroundColor: theme.accentWash }]}>
                    <Icon name={stat.icon} size={15} color={theme.accent} />
                  </View>
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Revenue chart */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Revenue · Last 7 Days</Text>
              <Text style={[styles.cardTrend, { color: theme.accent }]}>{formatPrice(weekNet)}</Text>
            </View>
            <View style={styles.bars}>
              {chartBars.map((height, index) => (
                <View key={index} style={styles.barColumn}>
                  <View style={[styles.bar, { height: `${Math.max(height, 2)}%`, backgroundColor: theme.accent }]} />
                </View>
              ))}
            </View>
            <View style={styles.barLabels}>
              {DAY_LABELS.map((day, index) => (
                <Text key={index} style={[styles.barLabel, { color: theme.textFaint }]}>
                  {day}
                </Text>
              ))}
            </View>
          </View>

          {/* Recent orders */}
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Orders</Text>
            <PressableScale
              accessibilityRole="button"
              onPress={() => router.push('/seller/orders' as never)}
            >
              <Text style={[styles.sectionAction, { color: theme.accent }]}>View all</Text>
            </PressableScale>
          </View>
          <View style={styles.sectionBody}>
            {recentOrders.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No orders yet</Text>
            ) : (
              recentOrders.map((order) => {
                const itemTitle = order.items[0]?.title ?? 'Order';
                const statusColor = getStatusColor(order.status);
                return (
                  <PressableScale
                    key={order.orderId}
                    accessibilityRole="button"
                    onPress={() => router.push('/seller/orders' as never)}
                    style={[styles.orderRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <View style={[styles.orderDot, { backgroundColor: statusColor }]} />
                    <View style={styles.flex}>
                      <Text style={[styles.orderMeta, { color: theme.textMuted }]}>
                        #{order.orderId.slice(0, 8)} · {order.buyerName ?? 'Buyer'}
                      </Text>
                      <Text style={[styles.orderItem, { color: theme.text }]} numberOfLines={1}>
                        {itemTitle} {order.items.length > 1 ? `+${order.items.length - 1}` : ''}
                      </Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={[styles.orderAmount, { color: theme.accent }]}>{formatPrice(order.sellerTotal)}</Text>
                      <View style={[styles.orderStatus, { backgroundColor: `${statusColor}18` }]}>
                        <Text style={[styles.orderStatusText, { color: statusColor }]}>{formatStatus(order.status)}</Text>
                      </View>
                    </View>
                  </PressableScale>
                );
              })
            )}
          </View>

          {/* Quick actions */}
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          </View>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => (
              <PressableScale
                key={action.label}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                haptic={action.route || action.onPress ? undefined : null}
                onPress={() => {
                  if (action.onPress) action.onPress();
                  else if (action.route === '/seller/new-product' && !verified) {
                    router.push('/kyc' as never);
                  } else if (action.route) router.push(action.route as never);
                }}
                style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Text style={styles.quickGlyph}>{action.glyph}</Text>
                <Text style={[styles.quickLabel, { color: theme.textMuted }]}>{action.label}</Text>
              </PressableScale>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered':
      return statusColors.delivered;
    case 'shipped':
      return statusColors.shipped;
    case 'processing':
      return statusColors.processing;
    case 'confirmed':
      return statusColors.confirmed;
    case 'cancelled':
    case 'refunded':
      return statusColors.cancelled;
    default:
      return statusColors.processing;
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { paddingTop: 60, alignItems: 'center' },
  addBtn: { width: 34, height: 34, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center' },
  tabRow: { paddingHorizontal: 20, gap: 6, paddingBottom: 16 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.full, borderWidth: 1 },
  tabText: { fontSize: size.small },
  statGrid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { flexBasis: '47%', flexGrow: 1, padding: 14, borderRadius: radii.tile, borderWidth: 1 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontFamily: font.display, lineHeight: 24 },
  statLabel: { fontSize: size.tiny, fontFamily: font.body, marginTop: 2 },
  card: { marginHorizontal: 20, marginBottom: 20, padding: 16, borderRadius: radii.tile, borderWidth: 1 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: size.body, fontFamily: font.bodyBold },
  cardTrend: { fontSize: size.caption, fontFamily: font.bodySemibold },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 80 },
  barColumn: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: 0.85 },
  barLabels: { flexDirection: 'row', marginTop: 6 },
  barLabel: { flex: 1, textAlign: 'center', fontSize: size.tiny, fontFamily: font.body },
  sectionHead: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: size.body, fontFamily: font.bodyBold },
  sectionAction: { fontSize: size.small, fontFamily: font.bodySemibold },
  sectionBody: { paddingHorizontal: 20, marginBottom: 8 },
  emptyText: { fontSize: size.body, fontFamily: font.body, textAlign: 'center', paddingVertical: 20 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: 8,
  },
  orderDot: { width: 8, height: 8, borderRadius: 4 },
  orderMeta: { fontSize: size.tiny, fontFamily: font.body },
  orderItem: { fontSize: size.small, fontFamily: font.bodyMedium },
  orderRight: { alignItems: 'flex-end', gap: 3 },
  orderAmount: { fontSize: size.small, fontFamily: font.bodyBold },
  orderStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  orderStatusText: { fontSize: size.micro, fontFamily: font.bodyBold },
  quickGrid: { paddingHorizontal: 20, flexDirection: 'row', gap: 8, marginTop: 4 },
  quickCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickGlyph: { fontSize: 20 },
  quickLabel: { fontSize: 9.5, fontFamily: font.bodyMedium, textAlign: 'center' },
});
