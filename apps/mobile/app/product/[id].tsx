import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BuyerProductDTO } from '@marketnest/shared-types';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ProductArt } from '../../src/components/product-tile';
import { useAuth } from '../../src/contexts/auth-context';
import { useCart } from '../../src/contexts/cart-context';
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { useWishlist } from '../../src/hooks/use-wishlist';
import {
  accents,
  avatarGradient,
  ctaGradient,
  font,
  formatPrice,
  glow,
  radii,
  size,
} from '../../src/theme';

interface Review {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  buyerName: string;
}
interface ReviewResponse {
  averageRating: number | null;
  reviewCount: number;
  items: Review[];
}

export default function ProductScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { add } = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();

  const { data: product } = useApi<BuyerProductDTO>(id ? `/products/${id}` : null, [id]);
  const { data: reviews } = useApi<ReviewResponse>(id ? `/reviews/product/${id}` : null, [id]);
  const { data: eligibility } = useApi<{ canReview: boolean } | null>(
    id && user ? `/reviews/eligibility/${id}` : null,
    [id, user?.id],
  );

  const [variantIndex, setVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const liked = product ? wishlist.has(product.id) : false;
  const isOwnListing = Boolean(product?.isOwnListing);
  const canReview = Boolean(eligibility?.canReview);

  const variants = product?.variants ?? [];
  const hasColorVariants = variants.length > 0 && variants.every((v) => v.options?.color);
  const selectedVariant = variants[variantIndex];
  const displayPrice = product
    ? product.price + (selectedVariant?.priceDelta ?? 0)
    : 0;

  async function handleShare() {
    if (!product) return;
    await Share.share({
      message: `Check out ${product.title} on MarketNest`,
      url: `marketnest://product/${id}`,
    });
  }

  if (!product) {
    return <View style={[styles.loading, { backgroundColor: theme.bg }]} />;
  }

  const discountPct =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : null;

  async function handleAdd(thenCheckout: boolean) {
    if (!product) return;
    setAdding(true);
    const variantId = product.variants[variantIndex]?.id ?? null;
    try {
      await add(product.id, quantity, variantId);
      router.push((thenCheckout ? '/checkout' : '/cart') as never);
    } finally {
      setAdding(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {/* Hero, full-bleed behind the status bar */}
        <ProductArt
          hue={product.hue}
          category={product.categoryName}
          isDark={isDark}
          glyphSize={108}
          imageUrl={product.images?.[0] ?? null}
          style={styles.hero}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.28)']}
            start={{ x: 0, y: 0.55 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroActions, { top: insets.top + 6 }]}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as never))}
              style={styles.circleButton}
            >
              <Icon name="back" size={18} color="#ffffff" />
            </PressableScale>
            <View style={styles.heroActionsRight}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Share"
                onPress={() => void handleShare()}
                style={styles.circleButton}
              >
                <Icon name="share" size={16} color="#ffffff" />
              </PressableScale>
              {!isOwnListing ? (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={liked ? 'Remove from wishlist' : 'Save to wishlist'}
                  onPress={() => wishlist.toggle(product.id)}
                  style={styles.circleButton}
                >
                  <Icon name={liked ? 'heartFilled' : 'heart'} size={16} color={liked ? accents.like : '#ffffff'} />
                </PressableScale>
              ) : null}
            </View>
          </View>
        </ProductArt>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.surface }]}>
          <View style={styles.metaRow}>
            {product.categoryName ? (
              <Text style={[styles.eyebrow, { color: theme.accent }]}>
                {product.categoryName.toUpperCase()}
              </Text>
            ) : (
              <View />
            )}
            {product.averageRating != null ? (
              <View style={styles.ratingChip}>
                <Icon name="star" size={11} color={accents.star} />
                <Text style={styles.ratingChipValue}>{product.averageRating.toFixed(1)}</Text>
                {product.reviewCount ? (
                  <Text style={[styles.ratingChipCount, { color: theme.textMuted }]}>
                    ({product.reviewCount.toLocaleString()})
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{product.title}</Text>
          {product.brandName ? (
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{product.brandName}</Text>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.accent }]}>{formatPrice(displayPrice)}</Text>
            {product.comparePrice && product.comparePrice > product.price ? (
              <Text style={[styles.comparePrice, { color: theme.textFaint }]}>
                {formatPrice(product.comparePrice)}
              </Text>
            ) : null}
            {discountPct ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>−{discountPct}%</Text>
              </View>
            ) : null}
          </View>

          {/* Variants */}
          {variants.length > 0 ? (
            <>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                {hasColorVariants ? 'Color' : 'Options'}
              </Text>
              {hasColorVariants ? (
                <View style={styles.swatchRow}>
                  {variants.map((variant, index) => {
                    const selected = variantIndex === index;
                    const outOfStock = (variant.stockQty ?? 0) <= 0;
                    return (
                      <PressableScale
                        key={variant.id}
                        accessibilityRole="button"
                        accessibilityLabel={variant.name || `Option ${index + 1}`}
                        accessibilityState={{ selected, disabled: outOfStock }}
                        disabled={outOfStock}
                        onPress={() => setVariantIndex(index)}
                        style={[
                          styles.swatch,
                          {
                            backgroundColor: variant.options?.color ?? theme.textFaint,
                            borderColor: selected ? theme.accent : 'transparent',
                            opacity: outOfStock ? 0.4 : 1,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ) : (
                <View style={styles.variantList}>
                  {variants.map((variant, index) => {
                    const selected = variantIndex === index;
                    const outOfStock = (variant.stockQty ?? 0) <= 0;
                    return (
                      <PressableScale
                        key={variant.id}
                        accessibilityRole="button"
                        accessibilityLabel={variant.name || `Option ${index + 1}`}
                        accessibilityState={{ selected, disabled: outOfStock }}
                        disabled={outOfStock}
                        onPress={() => setVariantIndex(index)}
                        style={[
                          styles.variantChip,
                          {
                            backgroundColor: selected ? theme.accent : theme.card,
                            borderColor: selected ? theme.accent : theme.border,
                            opacity: outOfStock ? 0.5 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.variantChipText,
                            { color: selected ? '#ffffff' : theme.text },
                          ]}
                        >
                          {variant.name}
                          {variant.priceDelta && variant.priceDelta !== 0
                            ? ` (+${formatPrice(variant.priceDelta)})`
                            : ''}
                        </Text>
                        {outOfStock ? (
                          <Text style={[styles.variantOos, { color: selected ? '#ffffff99' : theme.textFaint }]}>
                            Out of stock
                          </Text>
                        ) : null}
                      </PressableScale>
                    );
                  })}
                </View>
              )}
            </>
          ) : null}

          {/* Quantity */}
          <View style={styles.qtyRow}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted, flex: 1, marginBottom: 0 }]}>
              Quantity
            </Text>
            <View style={[styles.stepper, { borderColor: theme.border }]}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={[styles.stepperButton, { backgroundColor: theme.card }]}
              >
                <Icon name="minus" size={16} color={theme.text} />
              </PressableScale>
              <Text style={[styles.qtyValue, { color: theme.text }]} allowFontScaling={false}>
                {quantity}
              </Text>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                onPress={() => setQuantity((q) => q + 1)}
                style={[styles.stepperButton, { backgroundColor: theme.card }]}
              >
                <Icon name="plus" size={16} color={theme.text} />
              </PressableScale>
            </View>
          </View>

          {/* Description */}
          {product.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>About this product</Text>
              <Text style={[styles.body, { color: theme.textMuted }]}>{product.description}</Text>
            </View>
          ) : null}

          {/* Seller trust card — platform identity only, no store name or link:
              buyer-facing seller anonymity is a hard invariant of the DTO. */}
          <View style={[styles.sellerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <LinearGradient colors={avatarGradient(isDark)} style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarGlyph}>🏪</Text>
            </LinearGradient>
            <View style={styles.flex}>
              <Text style={[styles.sellerName, { color: theme.text }]}>
                {product.isMarketNestOfficial ? 'MarketNest Official' : 'MarketNest Marketplace'}
              </Text>
              <Text style={[styles.sellerMeta, { color: theme.textMuted }]}>
                Sold &amp; fulfilled by MarketNest  ·  Verified ✓
              </Text>
            </View>
          </View>

          {/* Reviews */}
          {reviews && reviews.items.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Reviews ({reviews.reviewCount.toLocaleString()})
              </Text>
              {reviews.items.slice(0, 3).map((review) => (
                <View
                  key={review.id}
                  style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={styles.reviewHead}>
                    <LinearGradient colors={avatarGradient(isDark)} style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{review.buyerName.charAt(0)}</Text>
                    </LinearGradient>
                    <View style={styles.flex}>
                      <Text style={[styles.reviewName, { color: theme.text }]}>{review.buyerName}</Text>
                      <Text style={[styles.reviewDate, { color: theme.textFaint }]}>
                        {formatRelative(review.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Icon
                          key={i}
                          name="star"
                          size={10}
                          color={i < review.rating ? accents.star : theme.textFaint}
                        />
                      ))}
                    </View>
                  </View>
                  {review.body ? (
                    <Text style={[styles.reviewBody, { color: theme.textMuted }]}>{review.body}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* Write a review — only when eligibility API says the buyer received this product. */}
          {canReview ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Write a review"
              onPress={() =>
                router.push(
                  `/review/write?productId=${id}${product?.title ? `&title=${encodeURIComponent(product.title)}` : ''}` as never,
                )
              }
              style={[styles.writeReviewButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Icon name="edit" size={16} color={theme.accent} />
              <Text style={[styles.writeReviewText, { color: theme.accent }]}>Write a Review</Text>
            </PressableScale>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky CTA — owners manage the listing; buyers purchase. */}
      <View
        style={[
          styles.cta,
          {
            backgroundColor: theme.glassBg,
            borderColor: theme.glassBorder,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {isOwnListing ? (
          <>
            <View style={[styles.ownBanner, { backgroundColor: theme.accentWash, borderColor: theme.accentGlow }]}>
              <Text style={[styles.ownBannerText, { color: theme.accent }]}>Your listing</Text>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Edit listing"
              onPress={() => router.push(`/seller/edit-product?id=${product.id}` as never)}
              style={[styles.flex, glow(theme, 20)]}
            >
              <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buyButton}>
                <Text style={styles.buyText}>Edit listing</Text>
              </LinearGradient>
            </PressableScale>
          </>
        ) : (
          <>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={liked ? 'Remove from wishlist' : 'Save to wishlist'}
              onPress={() => wishlist.toggle(product.id)}
              style={[
                styles.wishButton,
                {
                  backgroundColor: liked ? 'rgba(244,63,94,0.1)' : theme.card,
                  borderColor: liked ? accents.like : theme.border,
                },
              ]}
            >
              <Icon name={liked ? 'heartFilled' : 'heart'} size={20} color={liked ? accents.like : theme.textMuted} />
            </PressableScale>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Add to cart"
              disabled={adding}
              onPress={() => void handleAdd(false)}
              style={[styles.addButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Icon name="bag" size={17} color={theme.accent} />
              <Text style={[styles.addText, { color: theme.accent }]}>Add to Cart</Text>
            </PressableScale>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Buy now"
              disabled={adding}
              onPress={() => void handleAdd(true)}
              style={[styles.flex, glow(theme, 20)]}
            >
              <LinearGradient colors={ctaGradient(isDark)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buyButton}>
                <Text style={styles.buyText}>Buy Now</Text>
              </LinearGradient>
            </PressableScale>
          </>
        )}
      </View>
    </View>
  );
}

/** "2 days ago" style relative time — reviews only need coarse recency. */
function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
  return `${Math.floor(days / 30)} month${days < 60 ? '' : 's'} ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1 },
  flex: { flex: 1 },
  hero: { height: 340 },
  heroActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroActionsRight: { flexDirection: 'row', gap: 8 },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginTop: -24,
    borderTopLeftRadius: radii.hero,
    borderTopRightRadius: radii.hero,
    padding: 20,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  eyebrow: { fontSize: size.tiny, fontFamily: font.bodyBold, letterSpacing: 0.6 },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  ratingChipValue: { fontSize: size.small, fontFamily: font.bodyBold, color: accents.star },
  ratingChipCount: { fontSize: size.caption, fontFamily: font.body },
  title: { fontSize: size['3xl'], fontFamily: font.display, lineHeight: size['3xl'] * 1.15, marginBottom: 4 },
  subtitle: { fontSize: size.body, fontFamily: font.body, marginBottom: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  price: { fontSize: 30, fontFamily: font.bodyBold },
  comparePrice: { fontSize: size.lg, fontFamily: font.body, textDecorationLine: 'line-through' },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  discountText: { fontSize: size.caption, fontFamily: font.bodyBold, color: accents.sale },
  fieldLabel: { fontSize: size.small, fontFamily: font.bodySemibold, marginBottom: 10 },
  swatchRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5 },
  variantList: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  variantChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  variantChipText: { fontSize: size.small, fontFamily: font.bodySemibold },
  variantOos: { fontSize: size.tiny, fontFamily: font.body, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.input, borderWidth: 1, overflow: 'hidden' },
  stepperButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { width: 40, textAlign: 'center', fontSize: size.base, fontFamily: font.bodyBold },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: size.base, fontFamily: font.bodyBold, marginBottom: 8 },
  body: { fontSize: size.body, fontFamily: font.body, lineHeight: size.body * 1.7 },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: 20,
  },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sellerAvatarGlyph: { fontSize: 18 },
  sellerName: { fontSize: size.body, fontFamily: font.bodySemibold },
  sellerMeta: { fontSize: size.caption, fontFamily: font.body },
  reviewCard: { padding: 14, borderRadius: radii.card, borderWidth: 1, marginBottom: 10 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reviewAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#ffffff', fontSize: size.small, fontFamily: font.bodyBold },
  reviewName: { fontSize: size.small, fontFamily: font.bodySemibold },
  reviewDate: { fontSize: size.tiny, fontFamily: font.body },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewBody: { fontSize: size.small, fontFamily: font.body, lineHeight: size.small * 1.65 },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: 20,
  },
  writeReviewText: { fontSize: size.body, fontFamily: font.bodySemibold },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopLeftRadius: radii.hero,
    borderTopRightRadius: radii.hero,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wishButton: {
    width: 52,
    height: 52,
    borderRadius: radii.card,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flex: 1,
    height: 52,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addText: { fontSize: size.base, fontFamily: font.bodyBold },
  buyButton: { height: 52, borderRadius: radii.card, alignItems: 'center', justifyContent: 'center' },
  buyText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
  ownBanner: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  ownBannerText: { fontSize: size.small, fontFamily: font.bodySemibold },
});
