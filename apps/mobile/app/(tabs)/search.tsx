import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { FadeInItem } from '../../src/components/fade-in';
import { ProductCard } from '../../src/components/product-card';
import { ProductGridSkeleton } from '../../src/components/skeleton';
import { EmptyState, ErrorState } from '../../src/components/states';
import { useApi } from '../../src/hooks/use-api';
import { colors, fontSize, radii, spacing } from '../../src/theme';

interface ProductListResponse {
  items: BuyerProductListItemDTO[];
}

export default function SearchScreen() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');

  // Debounce so a request does not fire on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setQuery(term.trim()), 350);
    return () => clearTimeout(id);
  }, [term]);

  const path = query ? `/products?search=${encodeURIComponent(query)}&limit=20` : null;
  const { data, loading, error, reload } = useApi<ProductListResponse>(path, [query]);

  return (
    <View style={styles.container}>
      <TextInput
        value={term}
        onChangeText={setTerm}
        placeholder="Search products"
        placeholderTextColor={colors.mid}
        style={styles.input}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search products"
      />

      {!query ? (
        <EmptyState title="Search the catalogue" message="Type what you are looking for above." />
      ) : loading ? (
        <ProductGridSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No matches" message={`Nothing found for “${query}”.`} />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={styles.cell}>
              <FadeInItem index={index}>
                <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
              </FadeInItem>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    margin: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    fontSize: fontSize.base,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.lg },
  row: { gap: spacing.lg },
  cell: { flex: 1, maxWidth: '50%' },
});
