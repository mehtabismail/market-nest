import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { api } from '../../src/lib/api';
import { pickAndUploadImage } from '../../src/lib/upload';
import { ctaGradient, font, glow, radii, size, statusColors } from '../../src/theme';

interface Category {
  id: string;
  name: string;
}

interface SellerProduct {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  comparePrice: string | number | null;
  stockQty: number;
  sku: string | null;
  categoryId: string | null;
  images: string[] | null;
  status: 'draft' | 'published' | 'archived';
}

interface ProductVariant {
  id: string;
  name: string;
  options: Record<string, string> | null;
  priceDelta: string | number;
  stockQty: number;
  sku: string | null;
  isDefault: boolean;
}

export default function EditProductScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: categories } = useApi<Category[]>('/categories');
  const { data: products, loading: productsLoading } = useApi<SellerProduct[]>('/seller/products');

  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New variant form state
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPriceDelta, setNewVariantPriceDelta] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('');
  const [addingVariant, setAddingVariant] = useState(false);

  // Load product from list
  useEffect(() => {
    if (products && id) {
      const found = products.find((p) => p.id === id);
      if (found) {
        setProduct(found);
        setTitle(found.title);
        setDescription(found.description ?? '');
        setPrice(String(Number(found.price)));
        setComparePrice(found.comparePrice ? String(Number(found.comparePrice)) : '');
        setStockQty(String(found.stockQty));
        setSku(found.sku ?? '');
        setCategoryId(found.categoryId);
        setImages(found.images ?? []);
        setStatus(found.status === 'archived' ? 'draft' : found.status);
      }
    }
  }, [products, id]);

  // Load variants
  const loadVariants = useCallback(async () => {
    if (!id) return;
    setVariantsLoading(true);
    try {
      const data = await api.request<ProductVariant[]>(`/seller/products/${id}/variants`);
      setVariants(data);
    } catch {
      // Variants may not exist
      setVariants([]);
    } finally {
      setVariantsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadVariants();
  }, [loadVariants]);

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

  async function submit() {
    const priceValue = Number.parseFloat(price);
    if (title.trim().length < 2) {
      setError('Enter a product title (at least 2 characters).');
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError('Enter a valid price.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const compareValue = Number.parseFloat(comparePrice);
      const stockValue = Number.parseInt(stockQty, 10);
      await api.request(`/seller/products/${id}`, {
        method: 'PATCH',
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
      router.replace('/seller/listings' as never);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not save product.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    Alert.alert(
      'Archive Product',
      'This will remove the product from your store. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setArchiving(true);
            try {
              await api.request(`/seller/products/${id}`, { method: 'DELETE' });
              router.replace('/seller/listings' as never);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not archive product.');
            } finally {
              setArchiving(false);
            }
          },
        },
      ],
    );
  }

  async function handleAddVariant() {
    if (!newVariantName.trim()) {
      Alert.alert('Error', 'Variant name is required.');
      return;
    }

    setAddingVariant(true);
    try {
      await api.request(`/seller/products/${id}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          name: newVariantName.trim(),
          priceDelta: Number.parseFloat(newVariantPriceDelta) || 0,
          stockQty: Number.parseInt(newVariantStock, 10) || 0,
        }),
      });
      setNewVariantName('');
      setNewVariantPriceDelta('');
      setNewVariantStock('');
      void loadVariants();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not add variant.');
    } finally {
      setAddingVariant(false);
    }
  }

  async function handleDeleteVariant(variantId: string) {
    Alert.alert('Delete Variant', 'Remove this variant?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.request(`/seller/products/${id}/variants/${variantId}`, { method: 'DELETE' });
            void loadVariants();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete variant.');
          }
        },
      },
    ]);
  }

  if (productsLoading || !product) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
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
        <ScreenHeader title="Edit Product" subtitle={product.title} back backFallback="/seller/listings" />

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

          {/* Status toggle */}
          <Text style={[styles.label, { color: theme.textMuted }]}>Status</Text>
          <View style={styles.statusRow}>
            {(['draft', 'published'] as const).map((s) => {
              const active = status === s;
              return (
                <PressableScale
                  key={s}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.statusChip,
                    { backgroundColor: active ? theme.accent : theme.card, borderColor: active ? theme.accent : theme.border },
                  ]}
                >
                  <Text style={[styles.statusChipText, { color: active ? '#ffffff' : theme.textMuted }]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {/* Variants section */}
          <View style={styles.variantsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Variants (optional)</Text>
            <Text style={[styles.variantsHelp, { color: theme.textMuted }]}>
              Options like size or colour. Each variant has its own stock and an optional price
              adjustment on top of the base product price. Skip this if the product has a single
              SKU.
            </Text>

            {variantsLoading ? (
              <ActivityIndicator color={theme.accent} style={styles.variantsLoader} />
            ) : (
              <>
                {variants.length === 0 ? (
                  <Text style={[styles.noVariants, { color: theme.textMuted }]}>
                    No variants yet. Add size, color, or other options.
                  </Text>
                ) : (
                  variants.map((variant) => (
                    <View
                      key={variant.id}
                      style={[styles.variantRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <View style={styles.flex}>
                        <Text style={[styles.variantName, { color: theme.text }]}>{variant.name}</Text>
                        <Text style={[styles.variantMeta, { color: theme.textMuted }]}>
                          +${Number(variant.priceDelta).toFixed(2)} · {variant.stockQty} in stock
                          {variant.isDefault ? ' · Default' : ''}
                        </Text>
                      </View>
                      <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel="Delete variant"
                        onPress={() => handleDeleteVariant(variant.id)}
                        style={[styles.deleteVariantBtn, { backgroundColor: `${statusColors.cancelled}1a` }]}
                      >
                        <Icon name="x" size={12} color={statusColors.cancelled} />
                      </PressableScale>
                    </View>
                  ))
                )}

                {/* Add variant form */}
                <View style={[styles.addVariantForm, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.addVariantTitle, { color: theme.text }]}>Add Variant</Text>
                  <Input
                    value={newVariantName}
                    onChangeText={setNewVariantName}
                    placeholder="Name (e.g. Large, Blue)"
                    style={styles.variantInput}
                  />
                  <View style={styles.twoCol}>
                    <Input
                      value={newVariantPriceDelta}
                      onChangeText={setNewVariantPriceDelta}
                      placeholder="Price +/-"
                      keyboardType="decimal-pad"
                      style={[styles.variantInput, styles.col]}
                    />
                    <Input
                      value={newVariantStock}
                      onChangeText={setNewVariantStock}
                      placeholder="Stock"
                      keyboardType="number-pad"
                      style={[styles.variantInput, styles.col]}
                    />
                  </View>
                  <PressableScale
                    accessibilityRole="button"
                    disabled={addingVariant}
                    onPress={() => void handleAddVariant()}
                    style={[styles.addVariantBtn, { backgroundColor: theme.accent, opacity: addingVariant ? 0.6 : 1 }]}
                  >
                    {addingVariant ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.addVariantBtnText}>Add Variant</Text>
                    )}
                  </PressableScale>
                </View>
              </>
            )}
          </View>

          {error ? <Text style={[styles.error, { color: '#ef4444' }]}>{error}</Text> : null}

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Save changes"
            disabled={submitting}
            onPress={() => void submit()}
            style={[styles.primaryWrap, glow(theme), { opacity: submitting ? 0.6 : 1 }]}
          >
            <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
              <Text style={styles.primaryText}>{submitting ? 'Saving…' : 'Save Changes'}</Text>
            </LinearGradient>
          </PressableScale>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Archive product"
            disabled={archiving}
            haptic={null}
            onPress={() => void handleArchive()}
            style={[styles.archiveBtn, { borderColor: statusColors.cancelled }]}
          >
            <Text style={[styles.archiveBtnText, { color: statusColors.cancelled }]}>
              {archiving ? 'Archiving…' : 'Archive Product'}
            </Text>
          </PressableScale>
        </View>
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
  flex: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statusChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.control, borderWidth: 1 },
  statusChipText: { fontSize: size.body, fontFamily: font.bodyMedium },
  variantsSection: { marginTop: 10, marginBottom: 20 },
  sectionTitle: { fontSize: size.body, fontFamily: font.bodyBold, marginBottom: 8 },
  variantsHelp: {
    fontSize: size.caption,
    fontFamily: font.body,
    lineHeight: size.caption * 1.55,
    marginBottom: 12,
  },
  variantsLoader: { marginVertical: 20 },
  noVariants: { fontSize: size.body, fontFamily: font.body, marginBottom: 16 },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: 8,
  },
  variantName: { fontSize: size.body, fontFamily: font.bodyMedium },
  variantMeta: { fontSize: size.caption, fontFamily: font.body, marginTop: 2 },
  deleteVariantBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVariantForm: { padding: 14, borderRadius: radii.card, borderWidth: 1, marginTop: 8 },
  addVariantTitle: { fontSize: size.small, fontFamily: font.bodySemibold, marginBottom: 10 },
  variantInput: { marginBottom: 10 },
  addVariantBtn: { paddingVertical: 10, borderRadius: radii.control, alignItems: 'center' },
  addVariantBtnText: { fontSize: size.small, fontFamily: font.bodyBold, color: '#ffffff' },
  error: { fontSize: size.caption, fontFamily: font.bodyMedium, marginBottom: 12 },
  primaryWrap: { marginTop: 10 },
  primary: { paddingVertical: 15, borderRadius: radii.tile, alignItems: 'center' },
  primaryText: { fontSize: 15, fontFamily: font.bodyBold, color: '#ffffff' },
  archiveBtn: { marginTop: 12, paddingVertical: 14, borderRadius: radii.tile, borderWidth: 1, alignItems: 'center' },
  archiveBtnText: { fontSize: size.base, fontFamily: font.bodySemibold },
});
