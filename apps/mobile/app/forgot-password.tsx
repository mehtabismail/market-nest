import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import { emailError } from '@marketnest/utils';
import { Icon } from '../src/components/icon';
import { EmailField } from '../src/components/form-fields';
import { PressableScale } from '../src/components/pressable-scale';
import { useTheme } from '../src/contexts/theme-context';
import { api } from '../src/lib/api';
import { avatarGradient, ctaGradient, font, glow, radii, size } from '../src/theme';

export default function ForgotPasswordScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const mailErr = emailError(email);
    if (mailErr) {
      setError(mailErr);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
        anonymous: true,
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Could not send reset email.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <View style={[styles.success, { backgroundColor: theme.bg }]}>
        <LinearGradient colors={ctaGradient(isDark)} style={[styles.successIcon, glow(theme, 32)]}>
          <Icon name="check" size={36} color="#ffffff" />
        </LinearGradient>
        <Text style={[styles.successTitle, { color: theme.text }]}>Check your email</Text>
        <Text style={[styles.successBody, { color: theme.textMuted }]}>
          We&apos;ve sent password reset instructions to {email.trim()}
        </Text>
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.replace('/sign-in' as never)}
          style={[styles.backButton, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.backText}>Back to Sign In</Text>
        </PressableScale>
      </View>
    );
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
            <Icon name="shield" size={28} color="#ffffff" />
          </LinearGradient>
          <Text style={[styles.title, { color: theme.text }]}>Forgot password?</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Enter your email and we&apos;ll send you reset instructions
          </Text>
        </View>

        <EmailField
          label="Email Address"
          value={email}
          onChange={(text) => {
            setEmail(text);
            setError(null);
          }}
          required
        />

        {error ? <Text style={[styles.error, { color: theme.textMuted }]}>{error}</Text> : null}

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Send reset email"
          disabled={submitting}
          onPress={() => void handleSubmit()}
          style={[glow(theme), { opacity: submitting ? 0.6 : 1, marginBottom: 16 }]}
        >
          <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
            <Text style={styles.primaryText}>{submitting ? 'Sending…' : 'Send Reset Link'}</Text>
          </LinearGradient>
        </PressableScale>

        <PressableScale accessibilityRole="button" haptic={null} onPress={() => router.replace('/sign-in' as never)}>
          <Text style={[styles.backLink, { color: theme.textMuted }]}>Back to Sign In</Text>
        </PressableScale>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', paddingTop: 24, marginBottom: 32 },
  logo: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontFamily: font.display, marginBottom: 6 },
  subtitle: { fontSize: size.body, fontFamily: font.body, textAlign: 'center', paddingHorizontal: 20 },
  field: { marginBottom: 20 },
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
  primary: { paddingVertical: 15, borderRadius: radii.tile, alignItems: 'center' },
  primaryText: { fontSize: 15, fontFamily: font.bodyBold, color: '#ffffff' },
  backLink: { textAlign: 'center', fontSize: size.body, fontFamily: font.body, paddingVertical: 8 },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontFamily: font.display, marginBottom: 8 },
  successBody: { fontSize: size.body, fontFamily: font.body, textAlign: 'center', marginBottom: 28 },
  backButton: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: radii.tile },
  backText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
});
