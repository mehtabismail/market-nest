import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import { pkMobileError } from '@marketnest/utils';
import { Icon } from '../src/components/icon';
import { PhoneField } from '../src/components/form-fields';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenHeader } from '../src/components/screen-header';
import { useTheme } from '../src/contexts/theme-context';
import { useApi } from '../src/hooks/use-api';
import { api } from '../src/lib/api';
import { font, radii, size } from '../src/theme';

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt: string;
}

type FormMode = 'list' | 'add' | 'edit';

const emptyForm = {
  label: '',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

export default function AddressesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { data, reload } = useApi<{ addresses: SavedAddress[] }>('/buyer/addresses');
  const addresses = data?.addresses ?? [];

  const [mode, setMode] = useState<FormMode>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setForm(emptyForm);
    setEditId(null);
    setError(null);
    setMode('add');
  }

  function startEdit(address: SavedAddress) {
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });
    setEditId(address.id);
    setError(null);
    setMode('edit');
  }

  function cancel() {
    setMode('list');
    setEditId(null);
    setError(null);
  }

  async function handleSave() {
    if (!form.label.trim() || !form.fullName.trim() || !form.line1.trim() || !form.city.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    const phoneErr = pkMobileError(form.phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      label: form.label.trim(),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim() || 'PK',
    };

    try {
      if (mode === 'edit' && editId) {
        await api.request(`/buyer/addresses/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api.request('/buyer/addresses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      await reload();
      cancel();
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Could not save address.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.request(`/buyer/addresses/${id}`, { method: 'DELETE' });
            await reload();
          } catch {
            Alert.alert('Error', 'Could not delete address.');
          }
        },
      },
    ]);
  }

  if (mode !== 'list') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title={mode === 'add' ? 'Add Address' : 'Edit Address'}
            back
            backFallback="/addresses"
            right={
              <PressableScale accessibilityRole="button" onPress={cancel} haptic={null}>
                <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
              </PressableScale>
            }
          />

          <View style={styles.form}>
            <Field label="Label *" placeholder="e.g. Home, Work" value={form.label} onChangeText={(v) => setForm({ ...form, label: v })} theme={theme} />
            <Field label="Full Name *" placeholder="John Doe" value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} theme={theme} autoComplete="name" />
            <PhoneField
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              required
            />
            <Field label="Address Line 1 *" placeholder="123 Main St" value={form.line1} onChangeText={(v) => setForm({ ...form, line1: v })} theme={theme} autoComplete="street-address" />
            <Field label="Address Line 2" placeholder="Apt 4B" value={form.line2} onChangeText={(v) => setForm({ ...form, line2: v })} theme={theme} />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="City *" placeholder="New York" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} theme={theme} />
              </View>
              <View style={styles.flex}>
                <Field label="State" placeholder="NY" value={form.state} onChangeText={(v) => setForm({ ...form, state: v })} theme={theme} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="Postal Code" placeholder="10001" value={form.postalCode} onChangeText={(v) => setForm({ ...form, postalCode: v })} theme={theme} keyboardType="number-pad" autoComplete="postal-code" />
              </View>
              <View style={styles.flex}>
                <Field label="Country" placeholder="US" value={form.country} onChangeText={(v) => setForm({ ...form, country: v })} theme={theme} />
              </View>
            </View>

            {error ? <Text style={[styles.error, { color: theme.textMuted }]}>{error}</Text> : null}

            <PressableScale
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => void handleSave()}
              style={[styles.saveButton, { backgroundColor: theme.accent, opacity: submitting ? 0.6 : 1 }]}
            >
              <Text style={styles.saveText}>{submitting ? 'Saving…' : 'Save Address'}</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Addresses"
        subtitle={`${addresses.length} saved`}
        back
        backFallback="/account"
      />

      <View style={styles.list}>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyGlyph}>📍</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No addresses yet</Text>
            <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
              Add a delivery address to speed up checkout.
            </Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View
              key={address.id}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.cardHead}>
                <Icon name="pin" size={15} color={theme.accent} />
                <Text style={[styles.cardLabel, { color: theme.text }]}>{address.label}</Text>
                <View style={styles.cardActions}>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Edit address"
                    onPress={() => startEdit(address)}
                    haptic={null}
                  >
                    <Icon name="edit" size={14} color={theme.textMuted} />
                  </PressableScale>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Delete address"
                    onPress={() => void handleDelete(address.id)}
                    haptic={null}
                  >
                    <Icon name="trash" size={14} color={theme.textMuted} />
                  </PressableScale>
                </View>
              </View>
              <Text style={[styles.cardName, { color: theme.text }]}>{address.fullName}</Text>
              <Text style={[styles.cardBody, { color: theme.textMuted }]}>
                {[address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
              {address.phone ? (
                <Text style={[styles.cardPhone, { color: theme.textMuted }]}>{address.phone}</Text>
              ) : null}
            </View>
          ))
        )}

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Add new address"
          onPress={startAdd}
          style={[styles.addButton, { borderColor: theme.border }]}
        >
          <Icon name="plus" size={15} color={theme.textMuted} />
          <Text style={[styles.addText, { color: theme.textMuted }]}>Add new address</Text>
        </PressableScale>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  theme,
  keyboardType,
  autoComplete,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  theme: ReturnType<typeof useTheme>['theme'];
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  autoComplete?: 'name' | 'tel' | 'street-address' | 'postal-code';
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textFaint}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        autoCapitalize={autoComplete === 'name' ? 'words' : 'none'}
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyGlyph: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontFamily: font.display, marginBottom: 6 },
  emptyBody: { fontSize: size.body, fontFamily: font.body, textAlign: 'center' },
  card: { padding: 14, borderRadius: radii.card, borderWidth: 1, marginBottom: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardLabel: { fontSize: size.body, fontFamily: font.bodyBold, flex: 1 },
  cardActions: { flexDirection: 'row', gap: 12 },
  cardName: { fontSize: size.body, fontFamily: font.bodySemibold, marginBottom: 2 },
  cardBody: { fontSize: size.small, fontFamily: font.body, lineHeight: size.small * 1.5 },
  cardPhone: { fontSize: size.small, fontFamily: font.body, marginTop: 4 },
  addButton: {
    padding: 14,
    borderRadius: radii.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  addText: { fontSize: size.body, fontFamily: font.body },
  form: { paddingHorizontal: 20, paddingTop: 8 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 5 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    fontSize: size.body,
    fontFamily: font.body,
  },
  row: { flexDirection: 'row', gap: 12 },
  error: { fontSize: size.caption, fontFamily: font.body, marginBottom: 12 },
  saveButton: { paddingVertical: 14, borderRadius: radii.tile, alignItems: 'center', marginTop: 8 },
  saveText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
  cancelText: { fontSize: size.body, fontFamily: font.bodySemibold },
});
