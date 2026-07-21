import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ApiError } from '@marketnest/api-client';
import type { AuthSession } from '@marketnest/shared-types';
import { useAuth } from '../src/contexts/auth-context';
import { api } from '../src/lib/api';
import { colors, fontSize, radii, spacing } from '../src/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const session = await api.request<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
        anonymous: true,
      });
      await signIn(session.accessToken);
      router.back();
    } catch (err) {
      // ApiError messages are already safe to show — a 401 here reads
      // "Your session has expired", so surface the API's own detail for
      // credential failures instead.
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Invalid email or password.'
          : err instanceof Error
            ? err.message
            : 'Could not sign in.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <>
      <Stack.Screen options={{ title: 'Sign in' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.form}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            accessibilityLabel="Email"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            secureTextEntry
            autoComplete="current-password"
            accessibilityLabel="Password"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.primary, !canSubmit && styles.disabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.primaryLabel}>{submitting ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  form: { padding: spacing.xl, gap: spacing.md },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.base,
  },
  error: { color: colors.accent, fontSize: fontSize.sm },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  primaryLabel: { color: colors.white, fontWeight: '700', fontSize: fontSize.base },
});
