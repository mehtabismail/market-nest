import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import { pkMobileError } from '@marketnest/utils';
import { PhoneField } from '../src/components/form-fields';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenHeader } from '../src/components/screen-header';
import { useAuth } from '../src/contexts/auth-context';
import { useTheme } from '../src/contexts/theme-context';
import { api } from '../src/lib/api';
import { font, radii, size } from '../src/theme';

export default function ProfileEditScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!fullName.trim()) {
      setError('Name is required.');
      return;
    }
    if (phone.trim()) {
      const phoneErr = pkMobileError(phone);
      if (phoneErr) {
        setError(phoneErr);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.request('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
        }),
      });
      await refresh();
      if (router.canGoBack()) router.back();
      else router.replace('/account' as never);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Could not update profile.',
      );
    } finally {
      setSubmitting(false);
    }
  }

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
        <ScreenHeader title="Edit Profile" back backFallback="/account" />

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setError(null);
              }}
              placeholder="Your name"
              placeholderTextColor={theme.textFaint}
              autoCapitalize="words"
              autoComplete="name"
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </View>

          <PhoneField
            label="Phone Number"
            value={phone}
            onChange={(next) => {
              setPhone(next);
              setError(null);
            }}
          />

          {error ? <Text style={[styles.error, { color: theme.textMuted }]}>{error}</Text> : null}

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Save changes"
            disabled={submitting}
            onPress={() => void handleSave()}
            style={[styles.saveButton, { backgroundColor: theme.accent, opacity: submitting ? 0.6 : 1 }]}
          >
            <Text style={styles.saveText}>{submitting ? 'Saving…' : 'Save Changes'}</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: 20, paddingTop: 16 },
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 6 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    fontSize: size.base,
    fontFamily: font.body,
  },
  error: { fontSize: size.caption, fontFamily: font.body, marginBottom: 12 },
  saveButton: { paddingVertical: 15, borderRadius: radii.tile, alignItems: 'center', marginTop: 8 },
  saveText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
});
