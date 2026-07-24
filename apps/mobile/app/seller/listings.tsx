import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ProductArt } from '../../src/components/product-tile';
import { ScreenHeader } from '../../src/components/screen-header';
import { useAuth } from '../../src/contexts/auth-context';
import { useTheme } from '../../src/contexts/theme-context';
import { api } from '../../src/lib/api';
import { font, formatPrice, radii, size, statusColors } from '../../src/theme';

/** Raw seller product row (GET /seller/products). Decimals arrive as strings. */
interface SellerProduct {
  id: string;
  title: string;
  price: string | number;
  stockQty: number;
  status: 'draft' | 'published' | 'archived';
  images: string[] | null;
  hue: number;
  category: { name: string; slug: string } | null;
}

const STATUS_COLOR: Record<SellerProduct['status'], string> = {
  published: statusColors.delivered,
  draft: statusColors.processing,
  archived: statusColors.cancelled,
};

export default function ListingsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const verified = Boolean(user?.seller?.isVerified);

  const [products, setProducts] = useState<SellerProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.request<SellerProduct[]>('/seller/products');
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not load your listings.');
      setProducts([]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Refetch each time the screen regains focus, so a product added on the
  // new-product screen appears the moment we navigate back.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    >
      <ScreenHeader
        title="My Listings"
        subtitle={products ? `${products.length} product${products.length === 1 ? '' : 's'}` : 'Loading…'}
        back
        backFallback="/seller"
        right={
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add product"
            onPress={() =>
              router.push((verified ? '/seller/new-product' : '/kyc') as never)
            }
            style={[styles.addBtn, { backgroundColor: theme.accent }]}
          >
            <Icon name="plus" size={16} color="#ffffff" />
          </PressableScale>
        }
      />

      {!verified && (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={{ color: theme.textMuted, fontFamily: font.body, fontSize: size.small }}>
            Complete verification before creating products.{' '}
            <Text
              style={{ color: theme.accent, fontFamily: font.bodySemibold }}
              onPress={() => router.push('/kyc' as never)}
            >
              Open verification
            </Text>
          </Text>
        </View>
      )}

      {products === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyGlyph}>📦</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No products yet</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            {error ?? 'Add your first product to start selling on MarketNest.'}
          </Text>
          <PressableScale
            accessibilityRole="button"
            onPress={() =>
              router.push((verified ? '/seller/new-product' : '/kyc') as never)
            }
            style={[styles.emptyCta, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.emptyCtaText}>{verified ? 'Add Product' : 'Complete Verification'}</Text>
          </PressableScale>
        </View>
      ) : (
        <View style={styles.list}>
          {products.map((product) => (
            <View
              key={product.id}
              style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
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
                style={styles.rowMain}
              >
                <ProductArt
                  hue={product.hue}
                  category={product.category?.name}
                  isDark={isDark}
                  glyphSize={26}
                  imageUrl={product.images?.[0] ?? null}
                  style={styles.thumb}
                />
                <View style={styles.flex}>
                  <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                    {product.title}
                  </Text>
                  <Text style={[styles.meta, { color: theme.textMuted }]}>
                    {product.category?.name ?? 'Uncategorised'} · {product.stockQty} in stock
                  </Text>
                  <View style={styles.rowFooter}>
                    <Text style={[styles.price, { color: theme.accent }]}>{formatPrice(Number(product.price))}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[product.status]}1a` }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLOR[product.status] }]}>
                        {product.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Edit ${product.title}`}
                onPress={() => router.push(`/seller/edit-product?id=${product.id}` as never)}
                style={[styles.editBtn, { backgroundColor: theme.accentWash }]}
              >
                <Icon name="edit" size={16} color={theme.accent} />
              </PressableScale>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  addBtn: { width: 34, height: 34, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center' },
  centered: { paddingTop: 60, alignItems: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyGlyph: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: size.xl, fontFamily: font.display, marginBottom: 6 },
  emptyBody: { fontSize: size.body, fontFamily: font.body, textAlign: 'center', lineHeight: size.body * 1.5, marginBottom: 20 },
  emptyCta: { paddingHorizontal: 26, paddingVertical: 12, borderRadius: radii.tile },
  emptyCtaText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
  list: { paddingHorizontal: 20, gap: 10 },
  row: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radii.card, borderWidth: 1, alignItems: 'center' },
  rowMain: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: radii.control },
  title: { fontSize: size.body, fontFamily: font.bodySemibold },
  meta: { fontSize: size.caption, fontFamily: font.body, marginTop: 2 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  price: { fontSize: size.base, fontFamily: font.bodyBold },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.chip },
  statusText: { fontSize: size.micro, fontFamily: font.bodyBold, textTransform: 'capitalize' },
  editBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
