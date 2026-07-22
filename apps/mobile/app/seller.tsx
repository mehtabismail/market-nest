import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../src/components/icon';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenHeader } from '../src/components/screen-header';
import { useTheme } from '../src/contexts/theme-context';
import { accents, font, radii, size, statusColors } from '../src/theme';

/**
 * Seller Central — presentation shell.
 *
 * Per the project decision, this screen is built pixel-faithful against
 * representative figures rather than wired to the live seller API. The real
 * endpoints exist (`/seller/earnings`, `/seller/orders`, `/seller/products`);
 * connecting them is a deliberate second pass so the layout can be reviewed
 * first. The sample numbers below are the design's own.
 */

const TABS = ['Overview', 'Products', 'Orders', 'Analytics', 'Payouts'];

const STATS: { value: string; label: string; icon: IconName; change: string }[] = [
  { value: '$847', label: 'Today Revenue', icon: 'dollar', change: '+12.3%' },
  { value: '34', label: 'Total Orders', icon: 'package', change: '+5 new' },
  { value: '1.2k', label: 'Product Views', icon: 'eye', change: '+8%' },
  { value: '2.8%', label: 'Conversion', icon: 'chart', change: '+0.3%' },
];

const REVENUE_BARS = [65, 48, 82, 91, 57, 74, 100];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const RECENT_ORDERS = [
  { id: '#MN-2948', item: 'Sony WH-1000XM6', buyer: 'Alex M.', status: 'Shipped', amount: '$349', color: statusColors.shipped },
  { id: '#MN-2947', item: 'Arc Cognac Wallet', buyer: 'Priya K.', status: 'Processing', amount: '$89', color: statusColors.processing },
  { id: '#MN-2946', item: 'Dyson Zone', buyer: 'James L.', status: 'Delivered', amount: '$549', color: statusColors.delivered },
];

const QUICK_ACTIONS: { glyph: string; label: string }[] = [
  { glyph: '📦', label: 'Add Product' },
  { glyph: '🚚', label: 'Shipping' },
  { glyph: '📊', label: 'Reports' },
  { glyph: '💬', label: 'Support' },
];

export default function SellerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('Overview');

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
          <View style={[styles.livePill, { backgroundColor: theme.accentWash }]}>
            <Text style={[styles.livePillText, { color: theme.accent }]}>● Live</Text>
          </View>
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
              onPress={() => setTab(label)}
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

      {/* Stat cards */}
      <View style={styles.statGrid}>
        {STATS.map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statTop}>
              <View style={[styles.statIcon, { backgroundColor: theme.accentWash }]}>
                <Icon name={stat.icon} size={15} color={theme.accent} />
              </View>
              <Text style={styles.statChange}>{stat.change}</Text>
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
          <Text style={[styles.cardTrend, { color: theme.accent }]}>↑ 12.3%</Text>
        </View>
        <View style={styles.bars}>
          {REVENUE_BARS.map((height, index) => (
            <View key={index} style={styles.barColumn}>
              <View style={[styles.bar, { height: `${height}%`, backgroundColor: theme.accent }]} />
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
        <Text style={[styles.sectionAction, { color: theme.accent }]}>View all</Text>
      </View>
      <View style={styles.sectionBody}>
        {RECENT_ORDERS.map((order) => (
          <View key={order.id} style={[styles.orderRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.orderDot, { backgroundColor: order.color }]} />
            <View style={styles.flex}>
              <Text style={[styles.orderMeta, { color: theme.textMuted }]}>
                {order.id} · {order.buyer}
              </Text>
              <Text style={[styles.orderItem, { color: theme.text }]}>{order.item}</Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={[styles.orderAmount, { color: theme.accent }]}>{order.amount}</Text>
              <View style={[styles.orderStatus, { backgroundColor: `${order.color}18` }]}>
                <Text style={[styles.orderStatusText, { color: order.color }]}>{order.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
      </View>
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((action) => (
          <View key={action.label} style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.quickGlyph}>{action.glyph}</Text>
            <Text style={[styles.quickLabel, { color: theme.textMuted }]}>{action.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  livePill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: radii.chip },
  livePillText: { fontSize: size.caption, fontFamily: font.bodyBold },
  tabRow: { paddingHorizontal: 20, gap: 6, paddingBottom: 16 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.full, borderWidth: 1 },
  tabText: { fontSize: size.small },
  statGrid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { flexBasis: '47%', flexGrow: 1, padding: 14, borderRadius: radii.tile, borderWidth: 1 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statChange: {
    fontSize: size.tiny,
    fontFamily: font.bodyBold,
    color: accents.positive,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
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
