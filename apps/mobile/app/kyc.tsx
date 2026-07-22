import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../src/components/icon';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenHeader } from '../src/components/screen-header';
import { useTheme } from '../src/contexts/theme-context';
import { ctaGradient, font, glow, radii, size } from '../src/theme';

/**
 * Seller verification wizard — presentation shell.
 *
 * The KYC API (`PUT /seller/kyc/:step`, `POST /seller/kyc/submit`) exists and is
 * role-guarded to sellers. Wiring the wizard to it is a deliberate second pass:
 * a buyer starting verification does not yet hold the seller role, so the
 * submit path needs an onboarding step this shell intentionally leaves for
 * later. Everything here is local state so the flow can be reviewed end to end.
 */

const STEP_TITLES = ['Personal Info', 'Business Details', 'ID Verification', 'Bank Details', 'Review & Submit'];
const STEP_SUBTITLES = [
  'Tell us about yourself',
  'Describe your business',
  'Upload government-issued ID',
  'Enter your payout bank details',
  'Review all info before submitting',
];
const STEP_GLYPHS = ['👤', '🏪', '🪪', '🏦', '✅'];

const PERSONAL_FIELDS = ['Full Legal Name', 'Date of Birth', 'Phone Number', 'Nationality'];
const BUSINESS_FIELDS = ['Business Name', 'Business Type', 'Tax ID / EIN', 'Website (Optional)'];
const BANK_FIELDS = ['Account Holder Name', 'Bank Name', 'Account Number', 'Routing / ABA Number', 'SWIFT / BIC (International)'];
const DOC_SLOTS = ['National ID / Passport (Front)', 'National ID / Passport (Back)', 'Selfie holding your ID'];

const TOTAL = STEP_TITLES.length;

export default function KycScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  function next() {
    if (step < TOTAL - 1) setStep(step + 1);
    else setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={[styles.success, { backgroundColor: theme.bg }]}>
        <LinearGradient colors={ctaGradient(isDark)} style={[styles.successIcon, glow(theme, 48)]}>
          <Icon name="check" size={44} color="#ffffff" />
        </LinearGradient>
        <Text style={[styles.successTitle, { color: theme.text }]}>Submitted for Review</Text>
        <Text style={[styles.successBody, { color: theme.textMuted }]}>
          We review applications within 24–48 hours. You&apos;ll get a notification once verified.
        </Text>
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.replace('/account' as never)}
          style={[styles.successButton, { backgroundColor: theme.accent }, glow(theme)]}
        >
          <Text style={styles.successButtonText}>Back to Profile</Text>
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
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Seller Verification"
          subtitle={`KYC · Step ${step + 1} of ${TOTAL}`}
          back
          backFallback="/account"
        />

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[styles.progressFill, { width: `${((step + 1) / TOTAL) * 100}%`, backgroundColor: theme.accent }]}
            />
          </View>
          <View style={styles.progressDots}>
            {STEP_TITLES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index <= step ? theme.accent : theme.card,
                    borderColor: index <= step ? theme.accent : theme.border,
                  },
                ]}
              >
                {index < step ? (
                  <Icon name="check" size={10} color="#ffffff" />
                ) : (
                  <Text style={styles.progressGlyph}>{STEP_GLYPHS[index]}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>{STEP_TITLES[step]}</Text>
          <Text style={[styles.stepSubtitle, { color: theme.textMuted }]}>{STEP_SUBTITLES[step]}</Text>

          {step === 0 ? <FormFields fields={PERSONAL_FIELDS} /> : null}
          {step === 1 ? <FormFields fields={BUSINESS_FIELDS} /> : null}
          {step === 2 ? <DocumentUploads /> : null}
          {step === 3 ? <FormFields fields={BANK_FIELDS} secureFrom={2} /> : null}
          {step === 4 ? <ReviewSummary /> : null}

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={step < TOTAL - 1 ? 'Continue' : 'Submit for review'}
            onPress={next}
            style={[styles.primaryWrap, glow(theme)]}
          >
            <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
              <Text style={styles.primaryText}>{step < TOTAL - 1 ? 'Continue' : 'Submit for Review'}</Text>
              <Icon name="chevronRight" size={16} color="#ffffff" />
            </LinearGradient>
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormFields({ fields, secureFrom }: { fields: string[]; secureFrom?: number }) {
  const { theme } = useTheme();
  return (
    <View>
      {fields.map((label, index) => (
        <View key={label} style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
          <TextInput
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor={theme.textFaint}
            secureTextEntry={secureFrom != null && index >= secureFrom}
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          />
        </View>
      ))}
    </View>
  );
}

function DocumentUploads() {
  const { theme } = useTheme();
  return (
    <View>
      <Text style={[styles.uploadHint, { color: theme.textMuted }]}>
        Upload clear photos of your government-issued ID
      </Text>
      {DOC_SLOTS.map((label) => (
        <View
          key={label}
          style={[styles.uploadSlot, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Icon name="upload" size={24} color={theme.accent} />
          <Text style={[styles.uploadLabel, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.uploadMeta, { color: theme.textFaint }]}>JPG, PNG up to 10MB</Text>
        </View>
      ))}
    </View>
  );
}

function ReviewSummary() {
  const { theme } = useTheme();
  const sections: { title: string; lines: string[] }[] = [
    { title: 'Personal', lines: ['Full name provided', 'Phone verified', 'Nationality set'] },
    { title: 'Business', lines: ['Business name provided', 'Type selected', 'Tax ID set'] },
    { title: 'Documents', lines: ['ID Front ✅', 'ID Back ✅', 'Selfie ✅'] },
    { title: 'Bank', lines: ['Bank name provided', 'Account ••••4242'] },
  ];
  return (
    <View>
      {sections.map((section) => (
        <View key={section.title} style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.reviewTitle, { color: theme.accent }]}>{section.title}</Text>
          {section.lines.map((line) => (
            <Text key={line} style={[styles.reviewLine, { color: theme.textMuted }]}>
              {line}
            </Text>
          ))}
        </View>
      ))}
      <View style={[styles.disclaimer, { backgroundColor: theme.accentWash, borderColor: theme.accentGlow }]}>
        <Text style={[styles.disclaimerText, { color: theme.textMuted }]}>
          By submitting, you agree to our Seller Terms. Your information will be reviewed within 24–48 hours.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  progressTrack: { height: 4, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressGlyph: { fontSize: 10 },
  content: { paddingHorizontal: 20 },
  stepTitle: { fontSize: size['2xl'], fontFamily: font.display, marginBottom: 4 },
  stepSubtitle: { fontSize: size.small, fontFamily: font.body, marginBottom: 20 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 5 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    fontSize: size.base,
    fontFamily: font.body,
  },
  uploadHint: { fontSize: size.small, fontFamily: font.body, marginBottom: 14 },
  uploadSlot: {
    padding: 20,
    borderRadius: radii.card,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadLabel: { fontSize: size.small, fontFamily: font.bodySemibold, marginTop: 8 },
  uploadMeta: { fontSize: size.caption, fontFamily: font.body, marginTop: 2 },
  reviewCard: { padding: 14, borderRadius: radii.input, borderWidth: 1, marginBottom: 10 },
  reviewTitle: { fontSize: size.caption, fontFamily: font.bodyBold, marginBottom: 6 },
  reviewLine: { fontSize: size.small, fontFamily: font.body, lineHeight: size.small * 1.8 },
  disclaimer: { padding: 12, borderRadius: radii.control, borderWidth: 1, marginTop: 4 },
  disclaimerText: { fontSize: size.caption, fontFamily: font.body, lineHeight: size.caption * 1.6 },
  primaryWrap: { marginTop: 24 },
  primary: {
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
  successTitle: { fontSize: 26, fontFamily: font.display, marginBottom: 8 },
  successBody: { fontSize: size.body, fontFamily: font.body, textAlign: 'center', lineHeight: size.body * 1.6, marginBottom: 32 },
  successButton: { paddingHorizontal: 32, paddingVertical: 13, borderRadius: radii.tile },
  successButtonText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
});
