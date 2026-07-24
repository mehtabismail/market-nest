import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../src/components/icon';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenHeader } from '../src/components/screen-header';
import { useTheme } from '../src/contexts/theme-context';
import { useApi } from '../src/hooks/use-api';
import { font, formatPrice, radii, size } from '../src/theme';

/** Public coupon shape from GET /coupons (normalised by the API). */
interface PublicCoupon {
  id?: string;
  code: string;
  description: string | null;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  /** Legacy field names — kept so older API builds still render. */
  type?: 'percentage' | 'fixed';
  value?: number | string;
  minSubtotal: number | string | null;
  endsAt: string | null;
}

function asNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function RewardsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { data, loading, error, reload } = useApi<PublicCoupon[]>('/coupons');
  const coupons = Array.isArray(data) ? data : [];

  function copyCode(code: string) {
    Alert.alert('Code', `Code: ${code}\n\nUse this code at checkout to apply the discount.`);
  }

  function formatDiscount(coupon: PublicCoupon): string {
    const type = coupon.discountType ?? coupon.type ?? 'fixed';
    const value = asNumber(coupon.discountValue ?? coupon.value) ?? 0;
    if (type === 'percentage') {
      return `${value}% OFF`;
    }
    return `${formatPrice(value)} OFF`;
  }

  function formatExpiry(date: string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return `Expires ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Rewards & Coupons"
        subtitle={loading ? 'Loading…' : `${coupons.length} available`}
        back
        backFallback="/account"
      />

      <View style={styles.list}>
        {error ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Could not load coupons</Text>
            <Text style={[styles.emptyBody, { color: theme.textMuted }]}>{error}</Text>
            <PressableScale
              accessibilityRole="button"
              onPress={() => void reload()}
              style={[styles.retry, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.retryText}>Try again</Text>
            </PressableScale>
          </View>
        ) : coupons.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyGlyph}>🎁</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No coupons available</Text>
            <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
              Check back later for exclusive deals and discounts.
            </Text>
          </View>
        ) : (
          coupons.map((coupon, index) => {
            const minOrder = asNumber(coupon.minSubtotal);
            const key = coupon.id ?? coupon.code ?? `coupon-${index}`;
            return (
              <View
                key={key}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.cardHead}>
                  <View style={[styles.discountBadge, { backgroundColor: theme.accentWash }]}>
                    <Text style={[styles.discountText, { color: theme.accent }]}>
                      {formatDiscount(coupon)}
                    </Text>
                  </View>
                  {formatExpiry(coupon.endsAt) ? (
                    <Text style={[styles.expiry, { color: theme.textFaint }]}>
                      {formatExpiry(coupon.endsAt)}
                    </Text>
                  ) : null}
                </View>

                {coupon.description ? (
                  <Text style={[styles.description, { color: theme.textMuted }]}>
                    {coupon.description}
                  </Text>
                ) : null}

                {minOrder != null && minOrder > 0 ? (
                  <Text style={[styles.minOrder, { color: theme.textFaint }]}>
                    Min. order {formatPrice(minOrder)}
                  </Text>
                ) : null}

                <View style={styles.codeRow}>
                  <View style={[styles.codeBox, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                    <Text style={[styles.code, { color: theme.text }]}>{coupon.code}</Text>
                  </View>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Show code ${coupon.code}`}
                    onPress={() => copyCode(coupon.code)}
                    style={[styles.copyButton, { backgroundColor: theme.accent }]}
                  >
                    <Icon name="eye" size={14} color="#ffffff" />
                    <Text style={styles.copyText}>View</Text>
                  </PressableScale>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyGlyph: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontFamily: font.display, marginBottom: 6, textAlign: 'center' },
  emptyBody: { fontSize: size.body, fontFamily: font.body, textAlign: 'center' },
  retry: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.chip },
  retryText: { color: '#fff', fontFamily: font.bodyBold, fontSize: size.small },
  card: { padding: 16, borderRadius: radii.tile, borderWidth: 1, marginBottom: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  discountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.chip },
  discountText: { fontSize: size.small, fontFamily: font.bodyBold },
  expiry: { fontSize: size.caption, fontFamily: font.body },
  description: { fontSize: size.body, fontFamily: font.body, marginBottom: 8, lineHeight: size.body * 1.5 },
  minOrder: { fontSize: size.caption, fontFamily: font.body, marginBottom: 12 },
  codeRow: { flexDirection: 'row', gap: 10 },
  codeBox: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.input,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  code: { fontSize: size.base, fontFamily: font.bodyBold, letterSpacing: 1 },
  copyButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyText: { fontSize: size.small, fontFamily: font.bodyBold, color: '#ffffff' },
});
