import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { ProductCard } from '../src/components/product-card';
import { ScreenHeader } from '../src/components/screen-header';
import { useTheme } from '../src/contexts/theme-context';
import { useApi } from '../src/hooks/use-api';
import { useWishlist } from '../src/hooks/use-wishlist';
import { font, size } from '../src/theme';

interface WishlistEntry {
  id: string;
  title: string;
  price: number;
  comparePrice: number | null;
  hue: number;
  category: string | null;
}

export default function WishlistScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const wishlist = useWishlist();
  const { data } = useApi<WishlistEntry[]>('/wishlist');

  const entries = data ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Wishlist"
        subtitle={`${entries.length} saved`}
        back
        backFallback="/account"
      />

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyGlyph}>💚</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing saved yet</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            Tap the heart on any product to save it here.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {entries.map((entry) => {
            // The wishlist endpoint returns its own shape; map it onto the card
            // DTO so the same tile renders here as everywhere else.
            const product: BuyerProductListItemDTO = {
              id: entry.id,
              title: entry.title,
              price: entry.price,
              comparePrice: entry.comparePrice,
              thumbnail: null,
              isMarketNestOfficial: false,
              hue: entry.hue,
              categoryName: entry.category,
              brandName: null,
              dealEndsAt: null,
            };
            return (
              <ProductCard
                key={entry.id}
                product={product}
                variant="grid"
                wishlisted={wishlist.has(entry.id)}
                onToggleWishlist={wishlist.toggle}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  emptyGlyph: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: font.display, marginBottom: 6 },
  emptyBody: { fontSize: size.body, fontFamily: font.body, textAlign: 'center' },
  grid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
