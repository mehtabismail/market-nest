import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/icon';
import { ScreenHeader } from '../../src/components/screen-header';
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { font, formatPrice, radii, size, statusColors } from '../../src/theme';

/** Shape from GET /seller/earnings */
interface EarningsData {
  commissionRate: number;
  allTime: { gross: number; commission: number; net: number };
  week: { gross: number; commission: number; net: number };
  month: { gross: number; commission: number; net: number };
}

/** Shape from GET /seller/payouts */
interface PayoutRecord {
  id: string;
  amount: string | number;
  grossAmount?: string | number;
  commissionAmount?: string | number;
  netAmount?: string | number;
  status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export default function SellerPayoutsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: earnings, loading: earningsLoading } = useApi<EarningsData>('/seller/earnings');
  const { data: payouts, loading: payoutsLoading } = useApi<PayoutRecord[]>('/seller/payouts');

  const loading = earningsLoading || payoutsLoading;

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Payouts" subtitle="Earnings & history" back backFallback="/seller" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <>
          {/* Earnings Summary */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Earnings Summary</Text>
            <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: theme.accentWash }]}>
                  <Icon name="dollar" size={18} color={theme.accent} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>All-Time Net</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    {formatPrice(earnings?.allTime.net ?? 0)}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.earningsGrid}>
                <View style={styles.earningsItem}>
                  <Text style={[styles.earningsLabel, { color: theme.textMuted }]}>This Week</Text>
                  <Text style={[styles.earningsValue, { color: theme.accent }]}>
                    {formatPrice(earnings?.week.net ?? 0)}
                  </Text>
                </View>
                <View style={styles.earningsItem}>
                  <Text style={[styles.earningsLabel, { color: theme.textMuted }]}>This Month</Text>
                  <Text style={[styles.earningsValue, { color: theme.accent }]}>
                    {formatPrice(earnings?.month.net ?? 0)}
                  </Text>
                </View>
                <View style={styles.earningsItem}>
                  <Text style={[styles.earningsLabel, { color: theme.textMuted }]}>Commission</Text>
                  <Text style={[styles.earningsValue, { color: theme.textMuted }]}>
                    {earnings?.commissionRate ?? 0}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Breakdown */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>All-Time Breakdown</Text>
            <View style={[styles.breakdownCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>Gross Sales</Text>
                <Text style={[styles.breakdownValue, { color: theme.text }]}>
                  {formatPrice(earnings?.allTime.gross ?? 0)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>
                  Commission ({earnings?.commissionRate ?? 0}%)
                </Text>
                <Text style={[styles.breakdownValue, { color: statusColors.cancelled }]}>
                  -{formatPrice(earnings?.allTime.commission ?? 0)}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: theme.text, fontFamily: font.bodyBold }]}>
                  Net Earnings
                </Text>
                <Text style={[styles.breakdownValue, { color: theme.accent, fontFamily: font.bodyBold }]}>
                  {formatPrice(earnings?.allTime.net ?? 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Payout History */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Payout History</Text>
            {(payouts ?? []).length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={styles.emptyGlyph}>💵</Text>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No payouts yet. Earnings from delivered orders will appear here once processed.
                </Text>
              </View>
            ) : (
              <View style={styles.payoutList}>
                {(payouts ?? []).map((payout) => {
                  const amount = Number(payout.amount);
                  const statusColor = getPayoutStatusColor(payout.status);
                  const periodStart = new Date(payout.periodStart).toLocaleDateString();
                  const periodEnd = new Date(payout.periodEnd).toLocaleDateString();

                  return (
                    <View
                      key={payout.id}
                      style={[styles.payoutCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <View style={styles.payoutHeader}>
                        <View style={styles.flex}>
                          <Text style={[styles.payoutAmount, { color: theme.text }]}>
                            {formatPrice(amount)}
                          </Text>
                          <Text style={[styles.payoutPeriod, { color: theme.textMuted }]}>
                            {periodStart} – {periodEnd}
                          </Text>
                        </View>
                        <View style={[styles.payoutStatusPill, { backgroundColor: `${statusColor}1a` }]}>
                          <Text style={[styles.payoutStatusText, { color: statusColor }]}>
                            {payout.status}
                          </Text>
                        </View>
                      </View>

                      {(payout.grossAmount || payout.commissionAmount) && (
                        <View style={[styles.payoutDetails, { borderTopColor: theme.border }]}>
                          <Text style={[styles.payoutDetailText, { color: theme.textFaint }]}>
                            Gross: {formatPrice(Number(payout.grossAmount ?? 0))} · Commission:{' '}
                            {formatPrice(Number(payout.commissionAmount ?? 0))}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Info note */}
          <View style={styles.section}>
            <View style={[styles.infoCard, { backgroundColor: theme.accentWash, borderColor: theme.accentGlow }]}>
              <Icon name="bell" size={16} color={theme.accent} />
              <Text style={[styles.infoText, { color: theme.textMuted }]}>
                Payouts are processed weekly by the MarketNest team. Net earnings from delivered orders are
                automatically credited to your account.
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function getPayoutStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'completed':
      return statusColors.delivered;
    case 'pending':
      return statusColors.processing;
    case 'failed':
    case 'cancelled':
      return statusColors.cancelled;
    default:
      return statusColors.processing;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { paddingTop: 60, alignItems: 'center' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: size.body, fontFamily: font.bodyBold, marginBottom: 12 },
  summaryCard: { padding: 16, borderRadius: radii.tile, borderWidth: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: size.caption, fontFamily: font.body },
  summaryValue: { fontSize: 28, fontFamily: font.display, lineHeight: 32 },
  divider: { height: 1, marginVertical: 14 },
  earningsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  earningsItem: { alignItems: 'center' },
  earningsLabel: { fontSize: size.tiny, fontFamily: font.body, marginBottom: 4 },
  earningsValue: { fontSize: size.base, fontFamily: font.bodyBold },
  breakdownCard: { padding: 16, borderRadius: radii.tile, borderWidth: 1 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakdownLabel: { fontSize: size.body, fontFamily: font.body },
  breakdownValue: { fontSize: size.body, fontFamily: font.bodyMedium },
  emptyCard: {
    padding: 24,
    borderRadius: radii.tile,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyGlyph: { fontSize: 36, marginBottom: 12 },
  emptyText: {
    fontSize: size.body,
    fontFamily: font.body,
    textAlign: 'center',
    lineHeight: size.body * 1.5,
  },
  payoutList: { gap: 10 },
  payoutCard: { borderRadius: radii.card, borderWidth: 1, overflow: 'hidden' },
  payoutHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  payoutAmount: { fontSize: size.xl, fontFamily: font.bodySemibold },
  payoutPeriod: { fontSize: size.caption, fontFamily: font.body, marginTop: 2 },
  payoutStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.chip },
  payoutStatusText: { fontSize: size.small, fontFamily: font.bodyBold, textTransform: 'capitalize' },
  payoutDetails: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  payoutDetailText: { fontSize: size.caption, fontFamily: font.body },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: size.small, fontFamily: font.body, lineHeight: size.small * 1.5 },
});
