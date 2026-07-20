/**
 * Buyer-safe product shape ù NEVER include seller_id, store_name, store_slug, seller email.
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
  /** Only true for platform_owned ù drives "MarketNest Official" badge */
  isMarketNestOfficial: boolean;
  variants: BuyerProductVariantDTO[];
  averageRating?: number;
  reviewCount?: number;
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
}
