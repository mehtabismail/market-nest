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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ScreenHeader } from '../../src/components/screen-header';
import { useAuth } from '../../src/contexts/auth-context';
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { api } from '../../src/lib/api';
import { pickAndUploadImage } from '../../src/lib/upload';
import { ctaGradient, font, glow, radii, size } from '../../src/theme';

interface Category {
  id: string;
  name: string;
}

export default function NewProductScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const returnTo = params.from === 'kyc' ? '/kyc' : '/seller/listings';
  const { user } = useAuth();
  const verified = Boolean(user?.seller?.isVerified);
  const kycStatus = user?.seller?.kycStatus;
  const rejectionReason = user?.seller?.rejectionReason;

  const { data: categories } = useApi<Category[]>('/categories');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional draft variants — created after the product row exists.
  const [draftVariants, setDraftVariants] = useState<
    Array<{ name: string; priceDelta: string; stockQty: string }>
  >([]);
  const [variantName, setVariantName] = useState('');
  const [variantPriceDelta, setVariantPriceDelta] = useState('');
  const [variantStock, setVariantStock] = useState('');

  function addDraftVariant() {
    if (variantName.trim().length < 1) {
      setError('Enter a variant name (e.g. Large, Blue).');
      return;
    }
    setDraftVariants((current) => [
      ...current,
      {
        name: variantName.trim(),
        priceDelta: variantPriceDelta.trim() || '0',
        stockQty: variantStock.trim() || '0',
      },
    ]);
    setVariantName('');
    setVariantPriceDelta('');
    setVariantStock('');
    setError(null);
  }

  function removeDraftVariant(index: number) {
    setDraftVariants((current) => current.filter((_, i) => i !== index));
  }

  async function handleAddImage() {
    setError(null);
    setUploading(true);
    try {
      const uploaded = await pickAndUploadImage();
      if (uploaded) setImages((current) => [...current, uploaded.publicUrl]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((current) => current.filter((image) => image !== url));
  }

  async function submit(status: 'draft' | 'published') {
    const priceValue = Number.parseFloat(price);
    if (title.trim().length < 2) {
      setError('Enter a product title (at least 2 characters).');
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError('Enter a valid price.');
      return;
    }
    // Publishing without a photo would fall back to the generated artwork; that
    // is allowed, but nudge the seller since real images convert better.
    if (status === 'published' && images.length === 0) {
      setError('Add at least one image before publishing.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const compareValue = Number.parseFloat(comparePrice);
      const stockValue = Number.parseInt(stockQty, 10);
      const created = await api.request<{ id: string }>('/seller/products', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId ?? undefined,
          price: priceValue,
          comparePrice: Number.isFinite(compareValue) ? compareValue : undefined,
          stockQty: Number.isFinite(stockValue) ? stockValue : 0,
          sku: sku.trim() || undefined,
          images,
          status,
        }),
      });

      for (const draft of draftVariants) {
        const delta = Number.parseFloat(draft.priceDelta);
        const stock = Number.parseInt(draft.stockQty, 10);
        await api.request(`/seller/products/${created.id}/variants`, {
          method: 'POST',
          body: JSON.stringify({
            name: draft.name,
            priceDelta: Number.isFinite(delta) ? delta : 0,
            stockQty: Number.isFinite(stock) ? stock : 0,
          }),
        });
      }

      // After create from the Plus/KYC hub, return there so listings refresh.
      router.replace(returnTo as never);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not save product.');
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
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Add Product" subtitle="New listing" back backFallback={returnTo} />

        {!verified ? (
          <View style={[styles.content, { gap: 12 }]}>
            <Text style={[styles.label, { color: theme.text }]}>
              {kycStatus === 'submitted'
                ? 'Your verification is pending admin review.'
                : kycStatus === 'rejected'
                  ? `Verification was rejected${rejectionReason ? `: ${rejectionReason}` : '.'}`
                  : 'Complete seller verification before listing products.'}
            </Text>
            <Text style={{ color: theme.textMuted, fontFamily: font.body, fontSize: size.small }}>
              You can browse Seller Central, but product creates stay locked until you are approved.
            </Text>
            <PressableScale
              accessibilityRole="button"
              onPress={() => router.push('/kyc' as never)}
              style={{
                marginTop: 8,
                backgroundColor: theme.accent,
                borderRadius: radii.input,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontFamily: font.bodySemibold, fontSize: size.base }}>
                {kycStatus === 'rejected' ? 'Update verification' : 'Go to verification'}
              </Text>
            </PressableScale>
          </View>
        ) : (
        <View style={styles.content}>
          {/* Images */}
          <Text style={[styles.label, { color: theme.textMuted }]}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
            {images.map((url) => (
              <View key={url} style={styles.imageWrap}>
                <Image source={{ uri: url }} style={styles.image} contentFit="cover" />
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="Remove image"
                  onPress={() => removeImage(url)}
                  style={[styles.removeBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                >
                  <Icon name="x" size={12} color={theme.text} />
                </PressableScale>
              </View>
            ))}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              disabled={uploading}
              onPress={() => void handleAddImage()}
              style={[styles.addImage, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Icon name="upload" size={22} color={theme.accent} />
              <Text style={[styles.addImageText, { color: theme.textMuted }]}>
                {uploading ? 'Uploading…' : 'Add photo'}
              </Text>
            </PressableScale>
          </ScrollView>

          <Field label="Product Title">
            <Input value={title} onChangeText={setTitle} placeholder="e.g. Merino Wool Sweater" autoCapitalize="sentences" />
          </Field>

          <Field label="Description">
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your product…"
              multiline
              style={styles.textarea}
              autoCapitalize="sentences"
            />
          </Field>

          {/* Category */}
          <Text style={[styles.label, { color: theme.textMuted }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {(categories ?? []).map((category) => {
              const active = categoryId === category.id;
              return (
                <PressableScale
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setCategoryId(active ? null : category.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? theme.accent : theme.card, borderColor: active ? theme.accent : theme.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#ffffff' : theme.textMuted }]}>{category.name}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>

          <View style={styles.twoCol}>
            <Field label="Price ($)" style={styles.col}>
              <Input value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
            </Field>
            <Field label="Compare at ($)" style={styles.col}>
              <Input value={comparePrice} onChangeText={setComparePrice} placeholder="Optional" keyboardType="decimal-pad" />
            </Field>
          </View>

          <View style={styles.twoCol}>
            <Field label="Stock Qty" style={styles.col}>
              <Input value={stockQty} onChangeText={setStockQty} placeholder="0" keyboardType="number-pad" />
            </Field>
            <Field label="SKU" style={styles.col}>
              <Input value={sku} onChangeText={setSku} placeholder="Optional" autoCapitalize="characters" />
            </Field>
          </View>

          {/* Optional variants */}
          <View style={[styles.variantsBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.variantsTitle, { color: theme.text }]}>Variants (optional)</Text>
            <Text style={[styles.variantsHelp, { color: theme.textMuted }]}>
              Add sizes, colours, or packs if this product has options. Leave empty for a single
              listing — the price and stock above apply as-is. Each variant can have its own stock
              and a price adjustment (+/−) on top of the base price.
            </Text>

            {draftVariants.map((draft, index) => (
              <View
                key={`${draft.name}-${index}`}
                style={[styles.draftRow, { borderColor: theme.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.bodySemibold, color: theme.text }}>{draft.name}</Text>
                  <Text style={{ fontFamily: font.body, fontSize: size.caption, color: theme.textMuted }}>
                    Δ ${draft.priceDelta || '0'} · stock {draft.stockQty || '0'}
                  </Text>
                </View>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="Remove variant"
                  onPress={() => removeDraftVariant(index)}
                >
                  <Icon name="x" size={14} color="#ef4444" />
                </PressableScale>
              </View>
            ))}

            <Input
              value={variantName}
              onChangeText={setVariantName}
              placeholder="Name (e.g. Large, Blue)"
              style={styles.variantInput}
            />
            <View style={styles.twoCol}>
              <Input
                value={variantPriceDelta}
                onChangeText={setVariantPriceDelta}
                placeholder="Price +/-"
                keyboardType="decimal-pad"
                style={[styles.variantInput, styles.col]}
              />
              <Input
                value={variantStock}
                onChangeText={setVariantStock}
                placeholder="Stock"
                keyboardType="number-pad"
                style={[styles.variantInput, styles.col]}
              />
            </View>
            <PressableScale
              accessibilityRole="button"
              onPress={addDraftVariant}
              style={[styles.addVariantBtn, { borderColor: theme.accent }]}
            >
              <Icon name="plus" size={14} color={theme.accent} />
              <Text style={{ color: theme.accent, fontFamily: font.bodySemibold, fontSize: size.small }}>
                Add variant
              </Text>
            </PressableScale>
          </View>

          {error ? <Text style={[styles.error, { color: '#ef4444' }]}>{error}</Text> : null}

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Publish product"
            disabled={submitting}
            onPress={() => void submit('published')}
            style={[styles.primaryWrap, glow(theme), { opacity: submitting ? 0.6 : 1 }]}
          >
            <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
              <Text style={styles.primaryText}>{submitting ? 'Saving…' : 'Publish Product'}</Text>
            </LinearGradient>
          </PressableScale>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Save as draft"
            disabled={submitting}
            haptic={null}
            onPress={() => void submit('draft')}
            style={[styles.secondary, { borderColor: theme.border }]}
          >
            <Text style={[styles.secondaryText, { color: theme.textMuted }]}>Save as Draft</Text>
          </PressableScale>
        </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

function Input({ style, ...props }: React.ComponentProps<typeof TextInput>) {
  const { theme } = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textFaint}
      autoCapitalize="none"
      {...props}
      style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }, style]}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8 },
  label: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 8 },
  imageRow: { gap: 10, paddingBottom: 18 },
  imageWrap: { position: 'relative' },
  image: { width: 92, height: 92, borderRadius: radii.card },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImage: {
    width: 92,
    height: 92,
    borderRadius: radii.card,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: { fontSize: size.tiny, fontFamily: font.bodyMedium },
  field: { marginBottom: 14 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    fontSize: size.base,
    fontFamily: font.body,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  chipRow: { gap: 8, paddingBottom: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full, borderWidth: 1 },
  chipText: { fontSize: size.small, fontFamily: font.bodyMedium },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  error: { fontSize: size.caption, fontFamily: font.bodyMedium, marginBottom: 12 },
  primaryWrap: { marginTop: 10 },
  primary: { paddingVertical: 15, borderRadius: radii.tile, alignItems: 'center' },
  primaryText: { fontSize: 15, fontFamily: font.bodyBold, color: '#ffffff' },
  secondary: { marginTop: 12, paddingVertical: 14, borderRadius: radii.tile, borderWidth: 1, alignItems: 'center' },
  secondaryText: { fontSize: size.base, fontFamily: font.bodySemibold },
  variantsBox: {
    marginTop: 4,
    marginBottom: 16,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 10,
  },
  variantsTitle: { fontSize: size.base, fontFamily: font.bodyBold },
  variantsHelp: { fontSize: size.caption, fontFamily: font.body, lineHeight: size.caption * 1.55 },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  variantInput: { marginBottom: 0 },
  addVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.input,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
