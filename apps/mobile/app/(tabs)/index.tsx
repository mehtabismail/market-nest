import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { FadeInItem } from '../../src/components/fade-in';
import { ProductCard } from '../../src/components/product-card';
import { ProductGridSkeleton } from '../../src/components/skeleton';
import { EmptyState, ErrorState } from '../../src/components/states';
import { useApi } from '../../src/hooks/use-api';
import { colors, spacing } from '../../src/theme';

interface ProductListResponse {
  items: BuyerProductListItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Clears the floating glass tab bar so the last row is never trapped behind it. */
const TAB_BAR_INSET = 96;

export default function ShopScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useApi<ProductListResponse>('/products?limit=20');

  const renderItem = useCallback(
    ({ item, index }: { item: BuyerProductListItemDTO; index: number }) => (
      <View style={styles.cell}>
        <FadeInItem index={index} style={styles.fill}>
          <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
        </FadeInItem>
      </View>
    ),
    [router],
  );

  // Skeletons rather than a spinner: the grid is already the right shape when
  // data lands, so nothing jumps.
  if (loading && !data) return <ProductGridSkeleton count={6} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet"
        message="No products are published right now. Check back shortly."
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.accent} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: TAB_BAR_INSET,
    gap: spacing.lg,
  },
  row: { gap: spacing.lg },
  cell: { flex: 1, maxWidth: '50%' },
  fill: { flex: 1 },
});
