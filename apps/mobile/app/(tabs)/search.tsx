import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ProductArt } from '../../src/components/product-tile';
import { ProductCard } from '../../src/components/product-card';
import { ProductGridSkeleton } from '../../src/components/skeleton';
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { font, radii, size } from '../../src/theme';

interface Category {
  id: string;
  name: string;
  emoji: string | null;
  hue: number;
}
interface ProductPage {
  items: BuyerProductListItemDTO[];
}

const TRENDING = [
  'Sony WH-1000XM6',
  'Nothing Phone',
  'Dyson Zone',
  'Aesop Rosehip',
  'Linen Throw',
];

export default function SearchScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();

  const [query, setQuery] = useState(params.q ?? '');
  const [semantic, setSemantic] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const debounced = useDebounced(query, 250);
  const active = debounced.trim().length > 1;

  const searchUrl = useMemo(() => {
    if (!active) return null;
    const base = `/products?search=${encodeURIComponent(debounced.trim())}&limit=30`;
    return semantic ? `${base}&semantic=true` : base;
  }, [active, debounced, semantic]);

  const { data: results, loading, reload } = useApi<ProductPage>(searchUrl, [searchUrl]);
  const { data: categories } = useApi<Category[]>('/categories');

  const items = results?.items ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 140 }}
      keyboardShouldPersistTaps="handled"
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
      <View style={styles.searchRow}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as never))}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Icon name="back" size={18} color={theme.text} />
        </PressableScale>

        <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Icon name="search" size={16} color={theme.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search products, brands…"
            placeholderTextColor={theme.textFaint}
            autoFocus={!params.q}
            returnKeyType="search"
            style={[styles.input, { color: theme.text }]}
          />
          {query.length > 0 ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery('')}
              haptic={null}
            >
              <Icon name="x" size={15} color={theme.textMuted} />
            </PressableScale>
          ) : null}
        </View>
      </View>

      {active ? (
        <PressableScale
          accessibilityRole="switch"
          accessibilityState={{ checked: semantic }}
          onPress={() => setSemantic((s) => !s)}
          style={[styles.smartToggle, { backgroundColor: semantic ? theme.accentWash : theme.card, borderColor: semantic ? theme.accent : theme.border }]}
        >
          <Text style={[styles.smartIcon, { color: semantic ? theme.accent : theme.textMuted }]}>✦</Text>
          <Text style={[styles.smartLabel, { color: semantic ? theme.accent : theme.textMuted }]}>
            Smart search
          </Text>
          <View
            style={[
              styles.smartIndicator,
              { backgroundColor: semantic ? theme.accent : theme.border },
            ]}
          />
        </PressableScale>
      ) : null}

      {!active ? (
        <>
          <View style={styles.block}>
            <Text style={[styles.blockTitle, { color: theme.text }]}>Trending Searches</Text>
            {TRENDING.map((term) => (
              <PressableScale
                key={term}
                accessibilityRole="button"
                onPress={() => setQuery(term)}
                style={[styles.trendingRow, { borderBottomColor: theme.border }]}
              >
                <Icon name="search" size={15} color={theme.textMuted} />
                <Text style={[styles.trendingText, { color: theme.text }]}>{term}</Text>
                <Icon name="chevronRight" size={13} color={theme.textFaint} />
              </PressableScale>
            ))}
          </View>

          <View style={styles.block}>
            <Text style={[styles.blockTitle, { color: theme.text }]}>Browse Categories</Text>
            <View style={styles.categoryGrid}>
              {(categories ?? []).map((category) => (
                <PressableScale
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${category.name}`}
                  onPress={() => setQuery(category.name)}
                  style={styles.categoryCell}
                >
                  <ProductArt
                    hue={category.hue}
                    category={category.name}
                    isDark={isDark}
                    glyphSize={26}
                    style={styles.categoryArt}
                  />
                  <Text style={[styles.categoryLabel, { color: theme.textMuted }]} numberOfLines={1}>
                    {category.name}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </View>
        </>
      ) : loading ? (
        <ProductGridSkeleton />
      ) : (
        <View style={styles.results}>
          <Text style={[styles.resultCount, { color: theme.textMuted }]}>
            {items.length} result{items.length === 1 ? '' : 's'} for “{debounced.trim()}”
          </Text>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyGlyph}>🔍</Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No results found</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {items.map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Delays the search term so typing does not fire a request per keystroke.
 *
 * 250ms sits below the threshold where results feel laggy but still collapses
 * a burst of typing into one request.
 */
function useDebounced(value: string, delayMs: number): string {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return settled;
}

const styles = StyleSheet.create({
  searchRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smartToggle: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.input,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smartIcon: {
    fontSize: 14,
  },
  smartLabel: {
    flex: 1,
    fontSize: size.small,
    fontFamily: font.bodySemibold,
  },
  smartIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.input,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, fontSize: size.base, fontFamily: font.body, padding: 0 },
  block: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  blockTitle: { fontSize: size.body, fontFamily: font.bodyBold, marginBottom: 12 },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  trendingText: { flex: 1, fontSize: size.body, fontFamily: font.body },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCell: { width: '23%', borderRadius: radii.card, overflow: 'hidden' },
  categoryArt: { height: 62 },
  categoryLabel: {
    fontSize: 9.5,
    fontFamily: font.bodyMedium,
    textAlign: 'center',
    paddingVertical: 5,
  },
  results: { paddingHorizontal: 20 },
  resultCount: { fontSize: size.small, fontFamily: font.body, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 40, opacity: 0.6 },
  emptyGlyph: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: size.base, fontFamily: font.body },
});
