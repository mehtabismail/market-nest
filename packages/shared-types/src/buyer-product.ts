/**
 * Buyer-safe product shape � NEVER include seller_id, store_name, store_slug, seller email.
 */
export interface BuyerProductVariantDTO {
  id: string;
  name: string;
  options: Record<string, string>;
  priceDelta: number;
  stockQty: number;
  isDefault: boolean;
}

export interface BuyerProductDTO {
  id: string;
  title: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stockQty: number;
  sku: string | null;
  images: string[];
  categoryId: string | null;
  status: string;
  /** Only true for platform_owned � drives "MarketNest Official" badge */
  isMarketNestOfficial: boolean;
  variants: BuyerProductVariantDTO[];
  averageRating?: number;
  reviewCount?: number;
  /**
   * Hue (0�359) keying the generated artwork on mobile, which ships no
   * photography. Safe to expose: it is a presentation attribute of the product,
   * carrying nothing about who sells it.
   */
  hue: number;
  /** Category display name, for the artwork glyph and the tile's eyebrow. */
  categoryName: string | null;
  /** Brand display name. Manufacturer, not seller � anonymity is unaffected. */
  brandName: string | null;
  /** Flash-deal expiry, or null when the product is not on a timed deal. */
  dealEndsAt: string | null;
  /**
   * True when the authenticated viewer owns this listing.
   * Safe to expose: it reveals nothing about *who* the seller is to other buyers,
   * only that "this is yours" to the owner (so the app can hide buy/cart/wishlist).
   */
  isOwnListing?: boolean;
}

export interface BuyerProductListItemDTO {
  id: string;
  title: string;
  price: number;
  comparePrice: number | null;
  thumbnail: string | null;
  isMarketNestOfficial: boolean;
  averageRating?: number | null;
  reviewCount?: number;
  hue: number;
  categoryName: string | null;
  brandName: string | null;
  dealEndsAt: string | null;
  /** Set when the caller resolved the viewer's wishlist alongside the list. */
  wishlisted?: boolean;
}
