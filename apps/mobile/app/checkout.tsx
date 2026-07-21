import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ApiError } from '@marketnest/api-client';
import type { OrderDetailDTO } from '@marketnest/shared-types';
import { useAuth } from '../src/contexts/auth-context';
import { LoadingState } from '../src/components/states';
import { api } from '../src/lib/api';
import { colors, fontSize, radii, spacing } from '../src/theme';

const FIELDS = [
  { key: 'fullName', label: 'Full name', required: true },
  { key: 'phone', label: 'Phone', required: true },
  { key: 'line1', label: 'Address', required: true },
  { key: 'line2', label: 'Apartment, suite (optional)', required: false },
  { key: 'city', label: 'City', required: true },
  { key: 'state', label: 'State / province', required: true },
  { key: 'postalCode', label: 'Postal code', required: true },
  { key: 'country', label: 'Country', required: true },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, loading, isAuthenticated, isBuyer } = useAuth();

  const [address, setAddress] = useState<Record<FieldKey, string>>({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <LoadingState />;

  if (!isAuthenticated) {
    return (
      <Gate
        title="Sign in to check out"
        message="Create an account or sign in to complete your purchase."
        actionLabel="Sign in"
        onPress={() => router.push('/sign-in')}
      />
    );
  }

  // Same rule as web: checkout is buyer-only on the API, so stop non-customers
  // here rather than letting them fill the form and hit a 403.
  if (!isBuyer) {
    return (
      <Gate
        title="Switch to a customer account"
        message={`You are signed in as ${
          user?.role === 'superadmin' ? 'an administrator' : 'a seller'
        }. Checkout requires a customer account.`}
        actionLabel="Back to shop"
        onPress={() => router.replace('/')}
      />
    );
  }

  const missing = FIELDS.filter((f) => f.required && !address[f.key].trim());
  const canSubmit = missing.length === 0 && !submitting;

  async function placeOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.request<OrderDetailDTO>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          // line2 is sent even when blank: the API DTO marks it optional in
          // TypeScript but validates it with @IsString() and no @IsOptional(),
          // so omitting it fails validation.
          shippingAddress: address,
          paymentMethod: 'cod',
        }),
      });
      router.replace(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not place your order.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Checkout' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Shipping address</Text>

        {FIELDS.map((field) => (
          <TextInput
            key={field.key}
            value={address[field.key]}
            onChangeText={(value) => setAddress((prev) => ({ ...prev, [field.key]: value }))}
            placeholder={field.label}
            placeholderTextColor={colors.mid}
            style={styles.input}
            keyboardType={field.key === 'phone' ? 'phone-pad' : 'default'}
            accessibilityLabel={field.label}
          />
        ))}

        <Text style={styles.heading}>Payment</Text>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Cash on Delivery</Text>
          <Text style={styles.muted}>Pay the courier when your order arrives.</Text>
        </View>
        {/* Card payment needs @stripe/stripe-react-native — deliberately not
            wired yet, so no disabled option is shown pretending otherwise. */}

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.primary, !canSubmit && styles.disabled]}
          onPress={placeOrder}
          disabled={!canSubmit}
        >
          <Text style={styles.primaryLabel}>{submitting ? 'Placing order…' : 'Place order'}</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function Gate({
  title,
  message,
  actionLabel,
  onPress,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.gate}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.muted}>{message}</Text>
      <Pressable style={styles.primary} onPress={onPress}>
        <Text style={styles.primaryLabel}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.ink, marginTop: spacing.sm },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    fontSize: fontSize.base,
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.teal,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  paymentTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.ink },
  muted: { fontSize: fontSize.sm, color: colors.mid, textAlign: 'center' },
  error: { color: colors.accent, fontSize: fontSize.sm },
  primary: {
    backgroundColor: colors.ink,
    borderRadius: radii.full,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    marginTop: spacing.md,
  },
  disabled: { opacity: 0.5 },
  primaryLabel: { color: colors.white, fontWeight: '700', fontSize: fontSize.base },
});
