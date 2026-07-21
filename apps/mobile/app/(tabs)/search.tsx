import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { ProductCard } from '../../src/components/product-card';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/states';
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
        <LoadingState label="Searching…" />
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
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
  row: { gap: spacing.lg },
  cell: { flex: 1, maxWidth: '50%' },
});
