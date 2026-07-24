import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ProductArt } from '../../src/components/product-tile';
import { ScreenHeader } from '../../src/components/screen-header';
import { useCart } from '../../src/contexts/cart-context';
import { useTheme } from '../../src/contexts/theme-context';
import { api } from '../../src/lib/api';
import { ctaGradient, font, formatPrice, glow, radii, size } from '../../src/theme';


interface AppliedCoupon {
  code: string;
  discount: number;
}

export default function CartScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, setQuantity, remove } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const discount = applied?.discount ?? 0;
  const shipping = cart?.shippingFee ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);

  async function applyPromo() {
    const code = promoInput.trim();
    if (!code) return;

    setApplying(true);
    setPromoError(null);
    try {
      // Server-side validation, always. The rules (window, minimum, usage cap)
      // live with the coupon, and a client that computes its own discount is a
      // client that can be told to compute any discount it likes.
      const quote = await api.request<{ code: string; discount: number }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      });
      setApplied(quote);
      setPromoInput('');
    } catch (err) {
      setApplied(null);
      setPromoError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'That promo code could not be applied.',
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: 140 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="My Cart"
        subtitle={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
      />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyGlyph}>🛍️</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            Add items to get started
          </Text>
          <PressableScale
            accessibilityRole="button"
            onPress={() => router.push('/' as never)}
            style={[styles.emptyCta, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.emptyCtaText}>Start Shopping</Text>
          </PressableScale>
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {items.map((line) => (
              <View
                key={`${line.productId}-${line.variantId ?? 'base'}`}
                style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <ProductArt
                  hue={line.product.hue}
                  category={line.product.categoryName}
                  isDark={isDark}
                  glyphSize={26}
                  imageUrl={line.product.thumbnail}
                  style={styles.thumb}
                />

                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={2}>
                    {line.product.title}
                  </Text>
                  {line.product.brandName ? (
                    <Text style={[styles.rowMeta, { color: theme.textMuted }]}>
                      {line.product.brandName}
                    </Text>
                  ) : null}

                  <View style={styles.rowFooter}>
                    <Text style={[styles.linePrice, { color: theme.accent }]}>
                      {formatPrice(line.lineTotal)}
                    </Text>

                    <View style={[styles.stepper, { borderColor: theme.border }]}>
                      <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel={`Decrease quantity of ${line.product.title}`}
                        onPress={() => void setQuantity(line.productId, line.quantity - 1, line.variantId)}
                        style={[styles.stepperButton, { backgroundColor: theme.surface }]}
                      >
                        <Icon name="minus" size={12} color={theme.text} />
                      </PressableScale>
                      <Text style={[styles.qty, { color: theme.text }]} allowFontScaling={false}>
                        {line.quantity}
                      </Text>
                      <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel={`Increase quantity of ${line.product.title}`}
                        onPress={() => void setQuantity(line.productId, line.quantity + 1, line.variantId)}
                        style={[styles.stepperButton, { backgroundColor: theme.surface }]}
                      >
                        <Icon name="plus" size={12} color={theme.text} />
                      </PressableScale>
                    </View>
                  </View>
                </View>

                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${line.product.title}`}
                  onPress={() => void remove(line.productId)}
                  style={styles.removeButton}
                >
                  <Icon name="trash" size={15} color={theme.textMuted} />
                </PressableScale>
              </View>
            ))}
          </View>

          {/* Promo code */}
          <View style={[styles.promoRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Icon name="gift" size={17} color={theme.accent} />
            <TextInput
              value={promoInput}
              onChangeText={(text) => {
                setPromoInput(text);
                setPromoError(null);
              }}
              placeholder="Enter promo code"
              placeholderTextColor={theme.textFaint}
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={() => void applyPromo()}
              style={[styles.promoInput, { color: theme.text }]}
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Apply promo code"
              disabled={applying || promoInput.trim().length === 0}
              onPress={() => void applyPromo()}
              style={[
                styles.applyButton,
                {
                  backgroundColor: theme.accent,
                  opacity: applying || promoInput.trim().length === 0 ? 0.5 : 1,
                },
              ]}
            >
              <Text style={styles.applyText}>{applying ? '…' : 'Apply'}</Text>
            </PressableScale>
          </View>

          {promoError ? (
            <Text style={[styles.promoError, { color: theme.textMuted }]}>{promoError}</Text>
          ) : null}

          {applied ? (
            <View
              style={[
                styles.appliedRow,
                { backgroundColor: theme.accentWash, borderColor: theme.accentGlow },
              ]}
            >
              <View style={styles.appliedLeft}>
                <Icon name="check" size={13} color={theme.accent} />
                <Text style={[styles.appliedText, { color: theme.accent }]}>
                  {applied.code} applied
                </Text>
              </View>
              <View style={styles.appliedRight}>
                <Text style={[styles.appliedText, { color: theme.accent }]}>
                  −{formatPrice(applied.discount)}
                </Text>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="Remove promo code"
                  onPress={() => setApplied(null)}
                  haptic={null}
                >
                  <Icon name="x" size={13} color={theme.accent} />
                </PressableScale>
              </View>
            </View>
          ) : null}

          {/* Summary */}
          <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Order Summary</Text>
            <SummaryLine label="Subtotal" value={formatPrice(subtotal)} />
            <SummaryLine label="Shipping" value={formatPrice(shipping)} />
            {discount > 0 ? (
              <SummaryLine label="Discount" value={`−${formatPrice(discount)}`} />
            ) : null}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: theme.accent }]}>{formatPrice(total)}</Text>
            </View>
          </View>

          <View style={styles.checkoutWrap}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Checkout, ${formatPrice(total)}`}
              onPress={() =>
                router.push(
                  `/checkout${applied ? `?coupon=${encodeURIComponent(applied.code)}` : ''}` as never,
                )
              }
              style={glow(theme)}
            >
              <LinearGradient
                colors={ctaGradient(isDark)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkoutButton}
              >
                <Text style={styles.checkoutText}>Checkout  ·  {formatPrice(total)}</Text>
                <Icon name="chevronRight" size={16} color="#ffffff" />
              </LinearGradient>
            </PressableScale>
          </View>
        </>
      )}
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

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  emptyGlyph: { fontSize: 64, marginBottom: 16, opacity: 0.35 },
  emptyTitle: { fontSize: 18, fontFamily: font.display, marginBottom: 6 },
  emptyBody: { fontSize: size.body, fontFamily: font.body, marginBottom: 24 },
  emptyCta: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: radii.tile },
  emptyCtaText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radii.tile,
    borderWidth: 1,
    marginBottom: 12,
  },
  thumb: { width: 68, height: 68, borderRadius: radii.input },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: size.body, fontFamily: font.bodySemibold, marginBottom: 2 },
  rowMeta: { fontSize: size.caption, fontFamily: font.body, marginBottom: 8 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linePrice: { fontSize: 15, fontFamily: font.bodyBold },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.chip, borderWidth: 1, overflow: 'hidden' },
  stepperButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qty: { width: 28, textAlign: 'center', fontSize: size.small, fontFamily: font.bodyBold },
  removeButton: { padding: 4, alignSelf: 'flex-start', opacity: 0.5 },
  promoRow: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radii.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoInput: { flex: 1, fontSize: size.body, fontFamily: font.body, padding: 0 },
  applyButton: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radii.chip },
  applyText: { fontSize: size.caption, fontFamily: font.bodyBold, color: '#ffffff' },
  promoError: {
    marginHorizontal: 20,
    marginTop: -8,
    marginBottom: 12,
    fontSize: size.caption,
    fontFamily: font.body,
  },
  appliedRow: {
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.control,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appliedRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appliedText: { fontSize: size.small, fontFamily: font.bodySemibold },
  summary: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: radii.tile,
    borderWidth: 1,
  },
  summaryTitle: { fontSize: size.base, fontFamily: font.bodyBold, marginBottom: 12 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: size.body, fontFamily: font.body },
  summaryValue: { fontSize: size.body, fontFamily: font.bodyMedium },
  divider: { height: 1, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontFamily: font.bodyBold },
  totalValue: { fontSize: 17, fontFamily: font.bodyBold },
  checkoutWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  checkoutButton: {
    paddingVertical: 15,
    borderRadius: radii.tile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutText: { fontSize: 15, fontFamily: font.bodyBold, color: '#ffffff' },
});
