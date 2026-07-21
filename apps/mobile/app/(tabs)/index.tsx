import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { ProductCard } from '../../src/components/product-card';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/states';
import { useApi } from '../../src/hooks/use-api';
import { colors, spacing } from '../../src/theme';

interface ProductListResponse {
  items: BuyerProductListItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ShopScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useApi<ProductListResponse>('/products?limit=20');

  if (loading && !data) return <LoadingState label="Loading products…" />;
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
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.accent} />
      }
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.lg },
  row: { gap: spacing.lg },
  cell: { flex: 1, maxWidth: '50%' },
});
