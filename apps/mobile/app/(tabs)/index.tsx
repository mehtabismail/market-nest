import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ProductArt } from '../../src/components/product-tile';
import { ProductCard } from '../../src/components/product-card';
import { SectionHeading } from '../../src/components/section-heading';
import { ProductGridSkeleton } from '../../src/components/skeleton';
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { useWishlist } from '../../src/hooks/use-wishlist';
import {
  accents,
  font,
  formatCountdown,
  formatPriceShort,
  greeting,
  radii,
  size,
} from '../../src/theme';

interface NamedRow {
  id: string;
  name: string;
}
interface ProductPage {
  items: BuyerProductListItemDTO[];
}

const ALL = 'All';

export default function HomeScreen() {
  const { theme, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const wishlist = useWishlist();
  const [activeCategory, setActiveCategory] = useState(ALL);

  const { data: page, loading } = useApi<ProductPage>('/products?limit=40');
  const { data: brands } = useApi<NamedRow[]>('/brands');
  const { data: categories } = useApi<NamedRow[]>('/categories');

  const products = useMemo(() => page?.items ?? [], [page]);

  const deals = useMemo(
    () => products.filter((p) => p.dealEndsAt && new Date(p.dealEndsAt) > new Date()),
    [products],
  );

  const filtered = useMemo(
    () => (activeCategory === ALL ? products : products.filter((p) => p.categoryName === activeCategory)),
    [products, activeCategory],
  );

  const featured = products[0];
  const trending = filtered.slice(0, 4);
  const curated = filtered.slice(4, 10);

  // Counts down the soonest-expiring deal rather than a hardcoded number, so
  // the timer reflects a real promotion instead of decorating the screen.
  const soonestDealEnd = useMemo(() => {
    const times = deals.map((d) => new Date(d.dealEndsAt!).getTime()).filter((t) => t > Date.now());
    return times.length > 0 ? Math.min(...times) : null;
  }, [deals]);

  const secondsLeft = useCountdown(soonestDealEnd);
  const categoryChips = useMemo(() => [ALL, ...(categories ?? []).map((c) => c.name)], [categories]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>{greeting()}</Text>
          <Text style={[styles.wordmark, { color: theme.text }]}>MarketNest</Text>
        </View>
        <View style={styles.topActions}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/notifications' as never)}
            style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Icon name="bell" size={18} color={theme.text} />
            <View style={[styles.dot, { backgroundColor: theme.accent, borderColor: theme.surface }]} />
          </PressableScale>
          <PressableScale
            accessibilityRole="switch"
            accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            onPress={toggle}
            style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={styles.themeGlyph}>{isDark ? '☀️' : '🌙'}</Text>
          </PressableScale>
        </View>
      </View>

      <PressableScale
        accessibilityRole="search"
        accessibilityLabel="Search products and brands"
        onPress={() => router.push('/search' as never)}
        style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Icon name="search" size={17} color={theme.textMuted} />
        <Text style={[styles.searchPlaceholder, { color: theme.textFaint }]}>
          Search products, brands…
        </Text>
        <View style={[styles.filterChip, { backgroundColor: theme.accentWash }]}>
          <Icon name="filter" size={11} color={theme.accent} />
          <Text style={[styles.filterLabel, { color: theme.accent }]}>Filter</Text>
        </View>
      </PressableScale>

      {featured ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Featured: ${featured.title}`}
          onPress={() => router.push(`/product/${featured.id}` as never)}
          style={styles.hero}
        >
          <ProductArt
            hue={featured.hue}
            category={featured.categoryName}
            isDark={isDark}
            glyphSize={96}
            style={styles.heroArt}
          >
            {/* Fixed dark scrim rather than a themed one: the artwork behind it
                is identical in both themes, so white text needs the same
                protection either way. */}
            <LinearGradient
              colors={['rgba(0,0,0,0.74)', 'rgba(0,0,0,0.06)']}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 1, y: 0.9 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <View style={[styles.heroBadge, { backgroundColor: theme.accent }]}>
                <Text style={styles.heroBadgeText}>✦  FEATURED</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {featured.title}
              </Text>
              {featured.brandName ? <Text style={styles.heroSubtitle}>{featured.brandName}</Text> : null}
              <View style={styles.heroFooter}>
                <Text style={[styles.heroPrice, { color: theme.accent }]}>
                  {formatPriceShort(featured.price)}
                </Text>
                <View style={[styles.heroCta, { backgroundColor: theme.accent }]}>
                  <Text style={styles.heroCtaText}>Shop Now</Text>
                </View>
              </View>
            </View>
          </ProductArt>
        </PressableScale>
      ) : null}

      <SectionHeading title="Categories" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {categoryChips.map((name) => {
          const active = activeCategory === name;
          return (
            <PressableScale
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setActiveCategory(name)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active ? theme.accent : theme.card,
                  borderColor: active ? theme.accent : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color: active ? '#ffffff' : theme.textMuted,
                    fontFamily: active ? font.bodyBold : font.bodyMedium,
                  },
                ]}
              >
                {name}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {loading ? <ProductGridSkeleton /> : null}

      {deals.length > 0 ? (
        <>
          <SectionHeading
            title="⚡ Flash Deals"
            action="See all"
            onAction={() => router.push('/search' as never)}
            trailing={
              secondsLeft !== null ? (
                <View style={styles.countdownPill}>
                  <Text style={styles.countdownText}>{formatCountdown(secondsLeft)}</Text>
                </View>
              ) : null
            }
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {deals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlisted={wishlist.has(product.id)}
                onToggleWishlist={wishlist.toggle}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {trending.length > 0 ? (
        <>
          <SectionHeading title="Trending Now" action="See all" onAction={() => router.push('/search' as never)} />
          <View style={styles.grid}>
            {trending.map((product) => (
              <ProductCard key={product.id} product={product} variant="grid" />
            ))}
          </View>
        </>
      ) : null}

      {brands && brands.length > 0 ? (
        <>
          <SectionHeading title="Top Brands" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {brands.map((brand) => (
              <PressableScale
                key={brand.id}
                accessibilityRole="button"
                onPress={() => router.push(`/search?q=${encodeURIComponent(brand.name)}` as never)}
                style={[styles.brandChip, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Text style={[styles.brandText, { color: theme.textMuted }]}>{brand.name}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        </>
      ) : null}

      {curated.length > 0 ? (
        <>
          <SectionHeading
            title="✦ Curated For You"
            action="See all"
            onAction={() => router.push('/search' as never)}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {curated.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlisted={wishlist.has(product.id)}
                onToggleWishlist={wishlist.toggle}
              />
            ))}
          </ScrollView>
        </>
      ) : null}
    </ScrollView>
  );
}

/**
 * Seconds remaining until `endsAt`, ticking once a second.
 *
 * Recomputed from the target timestamp each tick rather than decremented, so a
 * timer throttled while backgrounded self-corrects on return instead of
 * drifting further behind the longer the app stays open.
 */
function useCountdown(endsAt: number | null): number | null {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (endsAt === null) {
      setSeconds(null);
      return;
    }
    const tick = () => setSeconds(Math.max(0, Math.floor((endsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return seconds;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topRow: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: size.small, fontFamily: font.body },
  wordmark: {
    fontSize: size['3xl'],
    fontFamily: font.display,
    letterSpacing: -0.4,
    lineHeight: size['3xl'] * 1.1,
  },
  topActions: { flexDirection: 'row', gap: 10 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeGlyph: { fontSize: 17 },
  dot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchPlaceholder: { flex: 1, fontSize: 13.5, fontFamily: font.body },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.chip,
  },
  filterLabel: { fontSize: size.caption, fontFamily: font.bodySemibold },
  hero: { marginHorizontal: 20, marginBottom: 24 },
  heroArt: { height: 200, borderRadius: radii.hero },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 22,
    justifyContent: 'flex-end',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginBottom: 8,
  },
  heroBadgeText: { fontSize: size.micro, fontFamily: font.bodyBold, color: '#ffffff', letterSpacing: 0.4 },
  heroTitle: {
    fontSize: size['2xl'],
    fontFamily: font.display,
    color: '#ffffff',
    lineHeight: size['2xl'] * 1.1,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: size.small,
    fontFamily: font.body,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroPrice: { fontSize: 22, fontFamily: font.bodyBold },
  heroCta: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: radii.full },
  heroCtaText: { fontSize: size.small, fontFamily: font.bodyBold, color: '#ffffff' },
  chipRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.full, borderWidth: 1 },
  categoryChipText: { fontSize: size.small },
  brandChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.input, borderWidth: 1 },
  brandText: { fontSize: size.small, fontFamily: font.bodySemibold },
  countdownPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.full,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  countdownText: {
    fontSize: size.caption,
    fontFamily: font.bodyBold,
    color: accents.sale,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  rail: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  grid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
