import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import type { OrderDetailDTO } from '@marketnest/shared-types';
import { Icon } from '../src/components/icon';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenHeader } from '../src/components/screen-header';
import { useCart } from '../src/contexts/cart-context';
import { useTheme } from '../src/contexts/theme-context';
import { useApi } from '../src/hooks/use-api';
import { api } from '../src/lib/api';
import { ctaGradient, font, formatPrice, glow, radii, size } from '../src/theme';

interface SavedAddress {
  id?: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const PAYMENT_METHODS = [
  { key: 'cod', glyph: '💵', title: 'Cash on Delivery', meta: 'Pay when it arrives', method: 'cod' as const },
  { key: 'card', glyph: '💳', title: 'Credit / Debit Card', meta: 'Coming soon', method: 'online' as const, disabled: true },
  { key: 'apple', glyph: '🍎', title: 'Apple Pay', meta: 'Coming soon', method: 'online' as const, disabled: true },
] as const;

const STEPS = ['Cart', 'Address', 'Payment', 'Done'];

export default function CheckoutScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ coupon?: string }>();
  const { cart, refresh } = useCart();

  const { data: addressData } = useApi<{ addresses: SavedAddress[] }>('/buyer/addresses');
  const addresses = addressData?.addresses ?? [];

  // Step is 1-based to match the design (0 = the cart the user came from).
  const [step, setStep] = useState(1);
  const [addressIndex, setAddressIndex] = useState(0);
  const [paymentIndex, setPaymentIndex] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderDetailDTO | null>(null);

  const subtotal = cart?.subtotal ?? 0;
  const shippingFee = cart?.shippingFee ?? 0;
  const total = useMemo(() => Math.max(0, subtotal + shippingFee), [subtotal, shippingFee]);

  async function placeOrder() {
    const address = addresses[addressIndex];
    if (!address) {
      setError('Add a delivery address to continue.');
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const order = await api.request<OrderDetailDTO>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          },
          paymentMethod: PAYMENT_METHODS[paymentIndex].method,
          couponCode: params.coupon,
        }),
      });
      setPlacedOrder(order);
      setStep(3);
      // The server emptied the cart; sync the badge so it does not linger.
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'We could not place your order. Please try again.',
      );
    } finally {
      setPlacing(false);
    }
  }

  // Success is a full-screen confirmation with no chrome.
  if (step === 3 && placedOrder) {
    return <OrderPlaced order={placedOrder} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title={step === 1 ? 'Delivery Address' : 'Payment'}
        back
        backFallback="/cart"
      />

      {/* Step indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((label, index) => (
          <View key={label} style={styles.stepItem}>
            <View style={styles.stepDotRow}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: index <= step ? theme.accent : theme.card,
                    borderColor: index <= step ? theme.accent : theme.border,
                  },
                ]}
              >
                {index < step ? (
                  <Icon name="check" size={11} color="#ffffff" />
                ) : (
                  <Text
                    style={[styles.stepNumber, { color: index <= step ? '#ffffff' : theme.textFaint }]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: index <= step ? theme.accent : theme.textFaint,
                    fontFamily: index === step ? font.bodyBold : font.body,
                  },
                ]}
              >
                {label}
              </Text>
            </View>
            {index < STEPS.length - 1 ? (
              <View
                style={[styles.stepLine, { backgroundColor: index < step ? theme.accent : theme.border }]}
              />
            ) : null}
          </View>
        ))}
      </View>

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Saved Addresses</Text>

          {addresses.length === 0 ? (
            <Text style={[styles.emptyNote, { color: theme.textMuted }]}>
              No saved addresses yet. Add one to continue.
            </Text>
          ) : (
            addresses.map((address, index) => {
              const selected = addressIndex === index;
              return (
                <PressableScale
                  key={`${address.label}-${index}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setAddressIndex(index)}
                  style={[
                    styles.addressCard,
                    { backgroundColor: theme.card, borderColor: selected ? theme.accent : theme.border },
                  ]}
                >
                  <View style={styles.addressHead}>
                    <Icon name="pin" size={15} color={selected ? theme.accent : theme.textMuted} />
                    <Text style={[styles.addressLabel, { color: theme.text }]}>{address.label}</Text>
                    {selected ? (
                      <View style={[styles.selectedPill, { backgroundColor: theme.accentWash }]}>
                        <Text style={[styles.selectedPillText, { color: theme.accent }]}>Selected</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.addressBody, { color: theme.textMuted }]}>
                    {[address.line1, address.city, address.state, address.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </PressableScale>
              );
            })
          )}

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add new address"
            onPress={() => router.push('/addresses' as never)}
            style={[styles.addAddress, { borderColor: theme.border }]}
          >
            <Icon name="plus" size={15} color={theme.textMuted} />
            <Text style={[styles.addAddressText, { color: theme.textMuted }]}>Add new address</Text>
          </PressableScale>

          <PrimaryButton
            label="Continue to Payment"
            onPress={() => setStep(2)}
            disabled={addresses.length === 0}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Payment Method</Text>

          {PAYMENT_METHODS.map((method, index) => {
            const selected = paymentIndex === index;
            const disabled = 'disabled' in method && method.disabled;
            return (
              <PressableScale
                key={method.key}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => !disabled && setPaymentIndex(index)}
                style={[
                  styles.paymentCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: selected ? theme.accent : theme.border,
                    opacity: disabled ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={styles.paymentGlyph}>{method.glyph}</Text>
                <View style={styles.flex}>
                  <Text style={[styles.paymentTitle, { color: theme.text }]}>{method.title}</Text>
                  <Text style={[styles.paymentMeta, { color: theme.textMuted }]}>{method.meta}</Text>
                </View>
                {selected && !disabled ? <Icon name="check" size={16} color={theme.accent} /> : null}
              </PressableScale>
            );
          })}

          <View style={[styles.totalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.totalCardLabel, { color: theme.text }]}>Total to pay</Text>
            <Text style={[styles.totalCardValue, { color: theme.accent }]}>{formatPrice(total)}</Text>
          </View>

          {error ? <Text style={[styles.error, { color: theme.textMuted }]}>{error}</Text> : null}

          <PrimaryButton
            label={placing ? 'Placing order…' : 'Place Order'}
            icon="card"
            onPress={() => void placeOrder()}
            disabled={placing}
          />
        </View>
      )}
    </ScrollView>
  );
}

function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon?: 'card' | 'chevronRight';
  onPress: () => void;
  disabled?: boolean;
}) {
  const { theme, isDark } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryWrap, glow(theme), { opacity: disabled ? 0.6 : 1 }]}
    >
      <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
        {icon ? <Icon name={icon} size={17} color="#ffffff" /> : null}
        <Text style={styles.primaryText}>{label}</Text>
        {!icon ? <Icon name="chevronRight" size={16} color="#ffffff" /> : null}
      </LinearGradient>
    </PressableScale>
  );
}

function OrderPlaced({ order }: { order: OrderDetailDTO }) {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const window =
    order.estimatedFrom && order.estimatedTo
      ? `${formatDay(order.estimatedFrom)} – ${formatDay(order.estimatedTo)}`
      : null;

  return (
    <View style={[styles.success, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={ctaGradient(isDark)} style={[styles.successIcon, glow(theme, 48)]}>
        <Icon name="check" size={46} color="#ffffff" />
      </LinearGradient>
      <Text style={[styles.successTitle, { color: theme.text }]}>Order Placed!</Text>
      <Text style={[styles.successBody, { color: theme.textMuted }]}>
        Order #{order.id.slice(0, 8).toUpperCase()} confirmed
      </Text>
      {window ? (
        <Text style={[styles.successEta, { color: theme.textMuted }]}>
          Estimated delivery: {window}
        </Text>
      ) : null}

      <PressableScale
        accessibilityRole="button"
        onPress={() => router.replace(`/orders/${order.id}` as never)}
        style={[styles.trackButton, { backgroundColor: theme.accent }, glow(theme)]}
      >
        <Text style={styles.trackText}>Track Order</Text>
      </PressableScale>
      <PressableScale accessibilityRole="button" onPress={() => router.replace('/' as never)} haptic={null}>
        <Text style={[styles.continueText, { color: theme.textMuted }]}>Continue Shopping</Text>
      </PressableScale>
    </View>
  );
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stepBar: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDotRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { fontSize: 9, fontFamily: font.bodyBold },
  stepLabel: { fontSize: size.tiny },
  stepLine: { flex: 1, height: 1, marginHorizontal: 5, minWidth: 12 },
  section: { paddingHorizontal: 20, paddingTop: 4 },
  fieldLabel: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 10 },
  emptyNote: { fontSize: size.body, fontFamily: font.body, marginBottom: 16 },
  addressCard: { padding: 14, borderRadius: radii.card, borderWidth: 2, marginBottom: 10 },
  addressHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addressLabel: { fontSize: size.body, fontFamily: font.bodyBold },
  selectedPill: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.chip },
  selectedPillText: { fontSize: size.tiny, fontFamily: font.bodyBold },
  addressBody: { fontSize: size.small, fontFamily: font.body, paddingLeft: 23 },
  addAddress: {
    padding: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  addAddressText: { fontSize: size.body, fontFamily: font.body },
  paymentCard: {
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 2,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentGlyph: { fontSize: 22 },
  paymentTitle: { fontSize: size.body, fontFamily: font.bodySemibold },
  paymentMeta: { fontSize: size.caption, fontFamily: font.body },
  totalCard: {
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalCardLabel: { fontSize: size.base, fontFamily: font.bodyBold },
  totalCardValue: { fontSize: size.xl, fontFamily: font.bodyBold },
  error: { fontSize: size.caption, fontFamily: font.body, marginBottom: 12 },
  primaryWrap: { marginTop: 4 },
  primaryButton: {
    paddingVertical: 15,
    borderRadius: radii.tile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { fontSize: 15, fontFamily: font.bodyBold, color: '#ffffff' },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontFamily: font.display, marginBottom: 6 },
  successBody: { fontSize: size.base, fontFamily: font.body, marginBottom: 6 },
  successEta: { fontSize: size.body, fontFamily: font.body, marginBottom: 32 },
  trackButton: { paddingHorizontal: 32, paddingVertical: 13, borderRadius: radii.tile, marginBottom: 14 },
  trackText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
  continueText: { fontSize: size.body, fontFamily: font.body, textDecorationLine: 'underline' },
});
