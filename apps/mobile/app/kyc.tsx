import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import { pkMobileError } from '@marketnest/utils';
import { Icon } from '../src/components/icon';
import { DateField, PhoneField } from '../src/components/form-fields';
import { PressableScale } from '../src/components/pressable-scale';
import { ProductArt } from '../src/components/product-tile';
import { ScreenHeader } from '../src/components/screen-header';
import { useAuth } from '../src/contexts/auth-context';
import { useTheme } from '../src/contexts/theme-context';
import { api } from '../src/lib/api';
import { pickAndUploadImage } from '../src/lib/upload';
import { ctaGradient, font, formatPrice, glow, radii, size, statusColors } from '../src/theme';

/**
 * Seller verification wizard — wired to the live KYC API.
 *
 * The tab Plus FAB opens this screen. Before verification it is the KYC wizard;
 * after approval it becomes the seller listing hub (products + “List new product”).
 */

type StepKey = 'personal' | 'business' | 'documents' | 'bank';
type DocKey = 'idFront' | 'idBack' | 'selfie';
type KycStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

interface KycRecord {
  status: KycStatus;
  completedStep: number;
  personal: Record<string, string> | null;
  business: Record<string, string> | null;
  documents: Partial<Record<DocKey, string>> | null;
  bank: (Record<string, string> & { accountLast4?: string | null }) | null;
  rejectionReason: string | null;
}

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  optional?: boolean;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}

const PERSONAL_FIELDS: FieldDef[] = [
  { key: 'fullName', label: 'Full Legal Name' },
  { key: 'nationality', label: 'Nationality' },
];
const BUSINESS_FIELDS: FieldDef[] = [
  { key: 'businessName', label: 'Business Name' },
  { key: 'businessType', label: 'Business Type', placeholder: 'e.g. Sole proprietor' },
  { key: 'taxId', label: 'Tax ID / EIN' },
  { key: 'website', label: 'Website', optional: true, placeholder: 'https:// (optional)' },
];
const BANK_FIELDS: FieldDef[] = [
  { key: 'accountHolder', label: 'Account Holder Name' },
  { key: 'bankName', label: 'Bank Name' },
  { key: 'accountNumber', label: 'Account Number', secure: true, keyboardType: 'numeric' },
  { key: 'routingNumber', label: 'Routing / ABA Number', keyboardType: 'numeric' },
  { key: 'swift', label: 'SWIFT / BIC (International)', optional: true },
];
const DOC_SLOTS: { key: DocKey; label: string }[] = [
  { key: 'idFront', label: 'National ID / Passport (Front)' },
  { key: 'idBack', label: 'National ID / Passport (Back)' },
  { key: 'selfie', label: 'Selfie holding your ID' },
];

const STEP_TITLES = ['Personal Info', 'Business Details', 'ID Verification', 'Bank Details', 'Review & Submit'];
const STEP_SUBTITLES = [
  'Tell us about yourself',
  'Describe your business',
  'Upload government-issued ID',
  'Enter your payout bank details',
  'Review all info before submitting',
];
const STEP_GLYPHS = ['👤', '🏪', '🪪', '🏦', '✅'];
const TOTAL = STEP_TITLES.length;

export default function KycScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSeller, becomeSeller } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [record, setRecord] = useState<KycRecord | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const [personal, setPersonal] = useState<Record<string, string>>({});
  const [business, setBusiness] = useState<Record<string, string>>({});
  const [bank, setBank] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Partial<Record<DocKey, string>>>({});

  // Load (or lazily create) the application, upgrading to a seller first if the
  // account arrived here without the role — the wizard must never 403 on itself.
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!isSeller) await becomeSeller();
      const rec = await api.request<KycRecord>('/seller/kyc');
      setRecord(rec);
      setPersonal(rec.personal ?? {});
      setBusiness(rec.business ?? {});
      setDocuments(rec.documents ?? {});
      // Account number never comes back — keep the rest, drop the masked tail.
      const { accountLast4: _tail, ...restBank } = rec.bank ?? {};
      setBank(restBank);
      setStep(Math.min(rec.completedStep, TOTAL - 1));
    } catch (err) {
      setLoadError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Could not load your verification.',
      );
    } finally {
      setLoading(false);
    }
    // isSeller/becomeSeller are stable enough; re-running on identity change is
    // not wanted (it would reset in-progress fields).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stepState: Record<StepKey, Record<string, string>> = useMemo(
    () => ({ personal, business, documents: {}, bank }),
    [personal, business, bank],
  );

  function validateStep(): string | null {
    if (step === 0) {
      const missing = firstMissing(PERSONAL_FIELDS, personal);
      if (missing) return missing;
      if (!personal.dateOfBirth?.trim()) return 'Date of Birth is required';
      const phoneErr = pkMobileError(personal.phone ?? '');
      if (phoneErr) return phoneErr;
      return null;
    }
    if (step === 1) return firstMissing(BUSINESS_FIELDS, business);
    if (step === 2) {
      const missing = DOC_SLOTS.filter((slot) => !documents[slot.key]);
      return missing.length > 0 ? `Please upload: ${missing.map((m) => m.label).join(', ')}` : null;
    }
    if (step === 3) {
      // On resume the number is masked out; a stored account (last4) means the
      // field may stay blank. A first-time bank step requires it.
      const needsAccount = !record?.bank?.accountLast4;
      const fields = needsAccount ? BANK_FIELDS : BANK_FIELDS.filter((f) => f.key !== 'accountNumber');
      return firstMissing(fields, bank);
    }
    return null;
  }

  async function saveCurrentStep(): Promise<boolean> {
    const key = (['personal', 'business', 'documents', 'bank'] as const)[step];
    if (!key) return true; // review step has nothing to persist here

    let payload: Record<string, string>;
    if (key === 'documents') payload = { ...documents } as Record<string, string>;
    else if (key === 'bank') {
      // Don't wipe a stored account by re-saving the bank step with a blank
      // number: skip the write when nothing new was entered and one is on file.
      if (!bank.accountNumber && record?.bank?.accountLast4) return true;
      payload = bank;
    } else payload = stepState[key];

    const updated = await api.request<KycRecord>(`/seller/kyc/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ payload }),
    });
    setRecord(updated);
    return true;
  }

  async function handleNext() {
    const invalid = validateStep();
    if (invalid) {
      setStepError(invalid);
      return;
    }
    setStepError(null);
    setSaving(true);
    try {
      await saveCurrentStep();
      if (step < TOTAL - 1) {
        setStep(step + 1);
      } else {
        const submitted = await api.request<KycRecord>('/seller/kyc/submit', { method: 'POST' });
        setRecord(submitted);
      }
    } catch (err) {
      setStepError(
        err instanceof ApiError || err instanceof Error ? err.message : 'Could not save. Try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePickDocument(key: DocKey) {
    setStepError(null);
    try {
      const uploaded = await pickAndUploadImage();
      if (uploaded) setDocuments((d) => ({ ...d, [key]: uploaded.publicUrl }));
    } catch (err) {
      setStepError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Upload failed. Try again.',
      );
    }
  }

  // ---- Terminal states -----------------------------------------------------

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg, paddingHorizontal: 32 }]}>
        <Text style={[styles.successTitle, { color: theme.text }]}>Something went wrong</Text>
        <Text style={[styles.successBody, { color: theme.textMuted }]}>{loadError}</Text>
        <PressableScale
          accessibilityRole="button"
          onPress={() => void load()}
          style={[styles.successButton, { backgroundColor: theme.accent }, glow(theme)]}
        >
          <Text style={styles.successButtonText}>Try Again</Text>
        </PressableScale>
      </View>
    );
  }

  if (record?.status === 'approved') {
    return <VerifiedSellerHub />;
  }

  if (record?.status === 'submitted') {
    return (
      <StatusScreen
        glyph="check"
        title="Submitted for Review"
        body="We review applications within 24–48 hours. You'll get a notification once verified."
        cta="Back to Profile"
        onPress={() => router.replace('/account' as never)}
      />
    );
  }

  // ---- Wizard --------------------------------------------------------------

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

        {record?.status === 'rejected' && record.rejectionReason ? (
          <View style={[styles.rejectBanner, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }]}>
            <Text style={styles.rejectTitle}>Verification needs attention</Text>
            <Text style={[styles.rejectBody, { color: theme.textMuted }]}>{record.rejectionReason}</Text>
          </View>
        ) : null}

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL) * 100}%`, backgroundColor: theme.accent }]} />
          </View>
          <View style={styles.progressDots}>
            {STEP_TITLES.map((title, index) => (
              <PressableScale
                key={title}
                accessibilityRole="button"
                accessibilityLabel={`Go to ${title}`}
                haptic={null}
                // Only steps already reached are tappable — jumping ahead would
                // skip the save/validation of the steps in between.
                onPress={() => index <= step && setStep(index)}
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
              </PressableScale>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>{STEP_TITLES[step]}</Text>
          <Text style={[styles.stepSubtitle, { color: theme.textMuted }]}>{STEP_SUBTITLES[step]}</Text>

          {step === 0 ? (
            <View>
              <FormFields fields={PERSONAL_FIELDS} values={personal} onChange={setPersonal} />
              <DateField
                label="Date of Birth"
                value={personal.dateOfBirth ?? ''}
                onChange={(ymd) => setPersonal((p) => ({ ...p, dateOfBirth: ymd }))}
                required
                maximumDate={new Date()}
              />
              <PhoneField
                label="Phone Number"
                value={personal.phone ?? ''}
                onChange={(e164) => setPersonal((p) => ({ ...p, phone: e164 }))}
                required
              />
            </View>
          ) : null}
          {step === 1 ? <FormFields fields={BUSINESS_FIELDS} values={business} onChange={setBusiness} /> : null}
          {step === 2 ? (
            <DocumentUploads documents={documents} onPick={handlePickDocument} />
          ) : null}
          {step === 3 ? (
            <FormFields
              fields={BANK_FIELDS}
              values={bank}
              onChange={setBank}
              placeholderOverride={
                record?.bank?.accountLast4
                  ? { accountNumber: `•••• ${record.bank.accountLast4} — re-enter to change` }
                  : undefined
              }
            />
          ) : null}
          {step === 4 ? (
            <ReviewSummary personal={personal} business={business} documents={documents} bank={bank} last4={record?.bank?.accountLast4 ?? null} />
          ) : null}

          {stepError ? <Text style={[styles.error, { color: '#ef4444' }]}>{stepError}</Text> : null}

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={step < TOTAL - 1 ? 'Continue' : 'Submit for review'}
            disabled={saving}
            onPress={() => void handleNext()}
            style={[styles.primaryWrap, glow(theme), { opacity: saving ? 0.6 : 1 }]}
          >
            <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
              <Text style={styles.primaryText}>
                {saving ? 'Saving…' : step < TOTAL - 1 ? 'Continue' : 'Submit for Review'}
              </Text>
              {!saving ? <Icon name="chevronRight" size={16} color="#ffffff" /> : null}
            </LinearGradient>
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function firstMissing(fields: FieldDef[], values: Record<string, string>): string | null {
  const missing = fields.find((f) => !f.optional && !values[f.key]?.trim());
  return missing ? `${missing.label} is required` : null;
}

function FormFields({
  fields,
  values,
  onChange,
  placeholderOverride,
}: {
  fields: FieldDef[];
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  placeholderOverride?: Record<string, string>;
}) {
  const { theme } = useTheme();
  return (
    <View>
      {fields.map((field) => (
        <View key={field.key} style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
            {field.label}
            {field.optional ? '' : ' *'}
          </Text>
          <TextInput
            value={values[field.key] ?? ''}
            onChangeText={(text) => onChange({ ...values, [field.key]: text })}
            placeholder={placeholderOverride?.[field.key] ?? field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor={theme.textFaint}
            secureTextEntry={field.secure}
            keyboardType={field.keyboardType}
            autoCapitalize={field.keyboardType === 'email-address' ? 'none' : 'sentences'}
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          />
        </View>
      ))}
    </View>
  );
}

function DocumentUploads({
  documents,
  onPick,
}: {
  documents: Partial<Record<DocKey, string>>;
  onPick: (key: DocKey) => void;
}) {
  const { theme } = useTheme();
  return (
    <View>
      <Text style={[styles.uploadHint, { color: theme.textMuted }]}>
        Upload clear photos of your government-issued ID
      </Text>
      {DOC_SLOTS.map((slot) => {
        const uploaded = documents[slot.key];
        return (
          <PressableScale
            key={slot.key}
            accessibilityRole="button"
            accessibilityLabel={`Upload ${slot.label}`}
            onPress={() => onPick(slot.key)}
            style={[
              styles.uploadSlot,
              { backgroundColor: theme.card, borderColor: uploaded ? theme.accent : theme.border },
            ]}
          >
            {uploaded ? (
              <>
                <Image source={{ uri: uploaded }} style={styles.uploadPreview} contentFit="cover" />
                <View style={styles.uploadDone}>
                  <Icon name="check" size={14} color={theme.accent} />
                  <Text style={[styles.uploadLabel, { color: theme.text }]}>{slot.label}</Text>
                </View>
                <Text style={[styles.uploadMeta, { color: theme.accent }]}>Tap to replace</Text>
              </>
            ) : (
              <>
                <Icon name="upload" size={24} color={theme.accent} />
                <Text style={[styles.uploadLabel, { color: theme.text }]}>{slot.label}</Text>
                <Text style={[styles.uploadMeta, { color: theme.textFaint }]}>JPG, PNG up to 5MB</Text>
              </>
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}

function ReviewSummary({
  personal,
  business,
  documents,
  bank,
  last4,
}: {
  personal: Record<string, string>;
  business: Record<string, string>;
  documents: Partial<Record<DocKey, string>>;
  bank: Record<string, string>;
  last4: string | null;
}) {
  const { theme } = useTheme();
  const tail = bank.accountNumber ? bank.accountNumber.slice(-4) : last4;
  const sections: { title: string; lines: string[] }[] = [
    {
      title: 'Personal',
      lines: [personal.fullName || '—', personal.phone || '—', personal.nationality || '—'],
    },
    {
      title: 'Business',
      lines: [business.businessName || '—', business.businessType || '—', business.taxId ? `Tax ID ${business.taxId}` : '—'],
    },
    {
      title: 'Documents',
      lines: [
        documents.idFront ? 'ID Front ✅' : 'ID Front —',
        documents.idBack ? 'ID Back ✅' : 'ID Back —',
        documents.selfie ? 'Selfie ✅' : 'Selfie —',
      ],
    },
    {
      title: 'Bank',
      lines: [bank.bankName || '—', tail ? `Account ••••${tail}` : '—'],
    },
  ];
  return (
    <View>
      {sections.map((section) => (
        <View key={section.title} style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.reviewTitle, { color: theme.accent }]}>{section.title}</Text>
          {section.lines.map((line, i) => (
            <Text key={`${section.title}-${i}`} style={[styles.reviewLine, { color: theme.textMuted }]}>
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

function VerifiedSellerHub() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [products, setProducts] = useState<
    Array<{
      id: string;
      title: string;
      price: string | number;
      stockQty: number;
      status: 'draft' | 'published' | 'archived';
      images: string[] | null;
      hue: number;
      category: { name: string; slug: string } | null;
    }> | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.request<NonNullable<typeof products>>('/seller/products');
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not load listings.');
      setProducts([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const statusColor: Record<'draft' | 'published' | 'archived', string> = {
    published: statusColors.delivered,
    draft: statusColors.processing,
    archived: statusColors.cancelled,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 4,
        paddingBottom: insets.bottom + 40,
        flexGrow: 1,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load().finally(() => setRefreshing(false));
          }}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    >
      <ScreenHeader title="Your Store" subtitle="Verified seller" back backFallback="/account" />

      {/* Verified intro only when the store has no listings yet. */}
      {products !== null && products.length === 0 ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: theme.accentWash,
              borderColor: theme.accentGlow,
              borderWidth: 1,
              borderRadius: radii.card,
              padding: 14,
            }}
          >
            <Text style={{ fontFamily: font.bodyBold, fontSize: size.base, color: theme.text }}>
              You&apos;re verified as a seller
            </Text>
            <Text style={{ marginTop: 4, fontFamily: font.body, fontSize: size.small, color: theme.textMuted }}>
              Your store is live. List your first product — buyers can discover it on MarketNest.
            </Text>
          </View>
        </View>
      ) : null}

      {products === null ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : products.length === 0 ? (
        <View style={{ paddingHorizontal: 28, paddingVertical: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
          <Text style={{ fontFamily: font.bodyBold, fontSize: size.lg, color: theme.text, textAlign: 'center' }}>
            No products yet
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontFamily: font.body,
              fontSize: size.small,
              color: theme.textMuted,
              textAlign: 'center',
            }}
          >
            {error ?? 'Create your first listing to start selling.'}
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {products.map((product) => (
            <View
              key={product.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderRadius: radii.card,
                borderWidth: 1,
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`View ${product.title}`}
                onPress={() =>
                  router.push(
                    (product.status === 'published'
                      ? `/product/${product.id}`
                      : `/seller/edit-product?id=${product.id}`) as never,
                  )
                }
                style={{ flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' }}
              >
                <ProductArt
                  hue={product.hue}
                  category={product.category?.name}
                  isDark={isDark}
                  imageUrl={product.images?.[0] ?? null}
                  glyphSize={22}
                  style={{ width: 56, height: 56, borderRadius: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.bodySemibold, fontSize: size.base, color: theme.text }} numberOfLines={1}>
                    {product.title}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: font.body, fontSize: size.small, color: theme.textMuted }}>
                    {formatPrice(Number(product.price))} · stock {product.stockQty}
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: font.bodyMedium, fontSize: size.caption, color: statusColor[product.status] }}>
                    {product.status}
                  </Text>
                </View>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Edit ${product.title}`}
                onPress={() => router.push(`/seller/edit-product?id=${product.id}` as never)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.accentWash,
                }}
              >
                <Icon name="edit" size={16} color={theme.accent} />
              </PressableScale>
            </View>
          ))}
        </View>
      )}

      <View style={{ paddingHorizontal: 20, marginTop: 'auto', paddingTop: 28 }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={products && products.length > 0 ? 'List new product' : 'List now'}
          onPress={() => router.push('/seller/new-product?from=kyc' as never)}
          style={[glow(theme)]}
        >
          <LinearGradient
            colors={ctaGradient(isDark)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: 16,
              borderRadius: radii.tile,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Icon name="plus" size={16} color="#ffffff" />
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: '#ffffff' }}>
              {products && products.length > 0 ? 'List New Product' : 'List Now'}
            </Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </ScrollView>
  );
}

function StatusScreen({
  glyph,
  title,
  body,
  cta,
  onPress,
}: {
  glyph: 'check';
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}) {
  const { theme, isDark } = useTheme();
  return (
    <View style={[styles.success, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={ctaGradient(isDark)} style={[styles.successIcon, glow(theme, 48)]}>
        <Icon name={glyph} size={44} color="#ffffff" />
      </LinearGradient>
      <Text style={[styles.successTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.successBody, { color: theme.textMuted }]}>{body}</Text>
      <PressableScale
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.successButton, { backgroundColor: theme.accent }, glow(theme)]}
      >
        <Text style={styles.successButtonText}>{cta}</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rejectBanner: { marginHorizontal: 20, marginTop: 4, padding: 14, borderRadius: radii.card, borderWidth: 1 },
  rejectTitle: { fontSize: size.small, fontFamily: font.bodyBold, color: '#ef4444', marginBottom: 4 },
  rejectBody: { fontSize: size.caption, fontFamily: font.body, lineHeight: size.caption * 1.5 },
  progressWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  progressTrack: { height: 4, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressGlyph: { fontSize: 11 },
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
    overflow: 'hidden',
  },
  uploadPreview: { width: '100%', height: 120, borderRadius: radii.control, marginBottom: 8 },
  uploadDone: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uploadLabel: { fontSize: size.small, fontFamily: font.bodySemibold, marginTop: 8 },
  uploadMeta: { fontSize: size.caption, fontFamily: font.body, marginTop: 2 },
  reviewCard: { padding: 14, borderRadius: radii.input, borderWidth: 1, marginBottom: 10 },
  reviewTitle: { fontSize: size.caption, fontFamily: font.bodyBold, marginBottom: 6 },
  reviewLine: { fontSize: size.small, fontFamily: font.body, lineHeight: size.small * 1.8 },
  disclaimer: { padding: 12, borderRadius: radii.control, borderWidth: 1, marginTop: 4 },
  disclaimerText: { fontSize: size.caption, fontFamily: font.body, lineHeight: size.caption * 1.6 },
  error: { fontSize: size.caption, fontFamily: font.bodyMedium, marginTop: 12 },
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
  successTitle: { fontSize: 26, fontFamily: font.display, marginBottom: 8, textAlign: 'center' },
  successBody: { fontSize: size.body, fontFamily: font.body, textAlign: 'center', lineHeight: size.body * 1.6, marginBottom: 32 },
  successButton: { paddingHorizontal: 32, paddingVertical: 13, borderRadius: radii.tile },
  successButtonText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
});
