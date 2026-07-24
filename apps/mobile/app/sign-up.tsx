import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import type { AuthSession } from '@marketnest/shared-types';
import { emailError, pkMobileError } from '@marketnest/utils';
import { Icon } from '../src/components/icon';
import { EmailField, PhoneField } from '../src/components/form-fields';
import { PressableScale } from '../src/components/pressable-scale';
import { useAuth } from '../src/contexts/auth-context';
import { useTheme } from '../src/contexts/theme-context';
import { api } from '../src/lib/api';
import { ctaGradient, font, glow, radii, size } from '../src/theme';

export default function SignUpScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmPending, setEmailConfirmPending] = useState(false);

  async function handleSubmit() {
    // Client-side gates the design implies (matching passwords, accepted terms),
    // caught here so the user sees them inline rather than as a server 400.
    const mailErr = emailError(email);
    if (mailErr) {
      setError(mailErr);
      return;
    }
    if (phone.trim()) {
      const phoneErr = pkMobileError(phone);
      if (phoneErr) {
        setError(phoneErr);
        return;
      }
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const session = await api.request<AuthSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        }),
        anonymous: true,
      });
      await signIn({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      router.replace('/' as never);
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Could not create your account.';

      const isEmailConfirm =
        message.toLowerCase().includes('check your email') ||
        message.toLowerCase().includes('confirm') ||
        message.toLowerCase().includes('verification');

      if (isEmailConfirm) {
        setEmailConfirmPending(true);
        setError(null);
      } else {
        setError(message);
        setEmailConfirmPending(false);
      }
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
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 28, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.replace('/sign-in' as never)}
            style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Icon name="back" size={18} color={theme.text} />
          </PressableScale>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
        </View>

        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Join MarketNest — buy, sell, discover.
        </Text>

        <Field label="Full Name">
          <Input value={fullName} onChangeText={setFullName} placeholder="Enter full name" autoCapitalize="words" />
        </Field>
        <EmailField label="Email Address" value={email} onChange={setEmail} required />
        <PhoneField label="Phone Number" value={phone} onChange={setPhone} />
        <Field label="Password">
          <Input value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry />
        </Field>
        <Field label="Confirm Password">
          <Input value={confirm} onChangeText={setConfirm} placeholder="Re-enter password" secureTextEntry />
        </Field>

        <PressableScale
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          onPress={() => setAgreed((a) => !a)}
          haptic={null}
          style={styles.termsRow}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: agreed ? theme.accent : 'transparent',
                borderColor: agreed ? theme.accent : theme.border,
              },
            ]}
          >
            {agreed ? <Icon name="check" size={12} color="#ffffff" /> : null}
          </View>
          <Text style={[styles.termsText, { color: theme.textMuted }]}>
            I agree to MarketNest&apos;s Terms of Service and Privacy Policy
          </Text>
        </PressableScale>

        {error ? <Text style={[styles.error, { color: theme.textMuted }]}>{error}</Text> : null}

        {emailConfirmPending ? (
          <View style={[styles.confirmPanel, { backgroundColor: theme.accentWash, borderColor: theme.accent }]}>
            <View style={[styles.confirmIconWrap, { backgroundColor: theme.accent }]}>
              <Icon name="check" size={18} color="#ffffff" />
            </View>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Check your inbox</Text>
            <Text style={[styles.confirmBody, { color: theme.textMuted }]}>
              We sent a confirmation email to {email || 'your address'}. Tap the link in that email to activate your account.
            </Text>
            <PressableScale
              accessibilityRole="button"
              onPress={() => router.replace('/sign-in' as never)}
              style={[styles.confirmBtn, { borderColor: theme.accent }]}
            >
              <Text style={[styles.confirmBtnText, { color: theme.accent }]}>Go to Sign In</Text>
            </PressableScale>
          </View>
        ) : null}

        {!emailConfirmPending ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Create account"
          disabled={submitting}
          onPress={() => void handleSubmit()}
          style={[glow(theme), { opacity: submitting ? 0.6 : 1 }]}
        >
          <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
            <Text style={styles.primaryText}>{submitting ? 'Creating…' : 'Create Account'}</Text>
          </LinearGradient>
        </PressableScale>
        ) : null}
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

function Input(props: React.ComponentProps<typeof TextInput>) {
  const { theme } = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textFaint}
      autoCapitalize="none"
      {...props}
      style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontFamily: font.display },
  subtitle: { fontSize: size.body, fontFamily: font.body, marginBottom: 22 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 5 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    fontSize: size.body,
    fontFamily: font.body,
  },
  termsRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 18, alignItems: 'flex-start' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsText: { flex: 1, fontSize: size.caption, fontFamily: font.body, lineHeight: size.caption * 1.5 },
  error: { fontSize: size.caption, fontFamily: font.body, marginBottom: 12 },
  primary: { paddingVertical: 15, borderRadius: radii.tile, alignItems: 'center' },
  primaryText: { fontSize: 15, fontFamily: font.bodyBold, color: '#ffffff' },
  confirmPanel: {
    padding: 20,
    borderRadius: radii.card,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: size.xl,
    fontFamily: font.display,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmBody: {
    fontSize: size.body,
    fontFamily: font.body,
    textAlign: 'center',
    lineHeight: size.body * 1.5,
    marginBottom: 16,
  },
  confirmBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.tile,
    borderWidth: 1,
  },
  confirmBtnText: {
    fontSize: size.base,
    fontFamily: font.bodySemibold,
  },
});
