import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import type { AuthSession } from '@marketnest/shared-types';
import { emailError } from '@marketnest/utils';
import { Icon } from '../src/components/icon';
import { EmailField } from '../src/components/form-fields';
import { PressableScale } from '../src/components/pressable-scale';
import { useAuth } from '../src/contexts/auth-context';
import { useTheme } from '../src/contexts/theme-context';
import { api } from '../src/lib/api';
import { avatarGradient, ctaGradient, font, glow, radii, size } from '../src/theme';

export default function SignInScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const mailErr = emailError(email);
    if (mailErr) {
      setError(mailErr);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const session = await api.request<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
        anonymous: true,
      });
      await signIn({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      // replace, not back: a fresh sign-in should not leave the modal in the
      // stack for a swipe-back to return to.
      router.replace('/' as never);
    } catch (err) {
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 28, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <LinearGradient colors={avatarGradient(isDark)} style={[styles.logo, glow(theme, 28)]}>
            <Text style={styles.logoGlyph}>🛍️</Text>
          </LinearGradient>
          <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Sign in to your MarketNest account
          </Text>
        </View>

        <EmailField label="Email Address" value={email} onChange={setEmail} required />

        <Field label="Password">
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••••"
              placeholderTextColor={theme.textFaint}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={[
                styles.input,
                { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, paddingRight: 44 },
              ]}
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword((s) => !s)}
              haptic={null}
              style={styles.eyeButton}
            >
              <Icon name="eye" size={16} color={theme.textMuted} />
            </PressableScale>
          </View>
        </Field>

        <PressableScale
          accessibilityRole="link"
          haptic={null}
          onPress={() => router.push('/forgot-password' as never)}
        >
          <Text style={[styles.forgot, { color: theme.accent }]}>Forgot password?</Text>
        </PressableScale>

        {error ? <Text style={[styles.error, { color: theme.textMuted }]}>{error}</Text> : null}

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          disabled={submitting}
          onPress={() => void handleSubmit()}
          style={[glow(theme), { opacity: submitting ? 0.6 : 1, marginBottom: 14 }]}
        >
          <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
            <Text style={styles.primaryText}>{submitting ? 'Signing in…' : 'Sign In'}</Text>
          </LinearGradient>
        </PressableScale>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textFaint }]}>or continue with</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>

        <View style={styles.socialRow}>
          {[
            { glyph: '🍎', label: 'Apple' },
            { glyph: '🔍', label: 'Google' },
          ].map((provider) => (
            <PressableScale
              key={provider.label}
              accessibilityRole="button"
              accessibilityLabel={`Sign in with ${provider.label}`}
              onPress={() => Alert.alert('Coming Soon', `${provider.label} sign-in will be available in a future update.`)}
              style={[styles.social, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Text style={styles.socialGlyph}>{provider.glyph}</Text>
              <Text style={[styles.socialLabel, { color: theme.text }]}>{provider.label}</Text>
            </PressableScale>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>Don&apos;t have an account? </Text>
          <PressableScale accessibilityRole="link" haptic={null} onPress={() => router.replace('/sign-up' as never)}>
            <Text style={[styles.footerLink, { color: theme.accent }]}>Sign Up</Text>
          </PressableScale>
        </View>

        <PressableScale accessibilityRole="button" haptic={null} onPress={() => router.replace('/' as never)}>
          <Text style={[styles.guest, { color: theme.textFaint }]}>Continue as guest</Text>
        </PressableScale>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', paddingTop: 14, marginBottom: 30 },
  logo: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoGlyph: { fontSize: 32 },
  title: { fontSize: 28, fontFamily: font.display, marginBottom: 4 },
  subtitle: { fontSize: size.body, fontFamily: font.body },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 5 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: radii.card,
    borderWidth: 1,
    fontSize: size.base,
    fontFamily: font.body,
  },
  passwordWrap: { position: 'relative', justifyContent: 'center' },
  eyeButton: { position: 'absolute', right: 14 },
  forgot: { alignSelf: 'flex-end', fontSize: size.small, fontFamily: font.bodySemibold, marginBottom: 20 },
  error: { fontSize: size.caption, fontFamily: font.body, marginBottom: 12 },
  primary: { paddingVertical: 15, borderRadius: radii.tile, alignItems: 'center' },
  primaryText: { fontSize: 15, fontFamily: font.bodyBold, color: '#ffffff' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4, marginBottom: 14 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: size.small, fontFamily: font.body },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  social: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radii.input,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  socialGlyph: { fontSize: 16 },
  socialLabel: { fontSize: size.small, fontFamily: font.bodySemibold },
  footer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  footerText: { fontSize: size.body, fontFamily: font.body },
  footerLink: { fontSize: size.body, fontFamily: font.bodyBold },
  guest: { textAlign: 'center', fontSize: size.small, fontFamily: font.body, paddingVertical: 8 },
});
