import type { BuyerProductDTO, BuyerProductListItemDTO } from '@marketnest/shared-types';
import type { Product, ProductVariant } from '@prisma/client';

type ProductRow = Pick<
  Product,
  | 'id'
  | 'title'
  | 'description'
  | 'price'
  | 'comparePrice'
  | 'stockQty'
  | 'sku'
  | 'images'
  | 'categoryId'
  | 'status'
  | 'ownerType'
> &
  Partial<Pick<Product, 'hue' | 'dealEndsAt'>> & {
    variants?: Pick<
      ProductVariant,
      'id' | 'name' | 'options' | 'priceDelta' | 'stockQty' | 'isDefault'
    >[];
    /**
     * Category and brand relations, when the caller included them.
     *
     * Both are catalogue metadata, not seller identity — a brand is who
     * manufactured the item, never who is selling it — so surfacing them here
     * does not weaken the anonymity guarantee this mapper exists to enforce.
     */
    category?: { name: string } | null;
    brand?: { name: string } | null;
  };

/**
 * Maps DB product → buyer-safe DTO. Never pass seller relation into this function.
 */
export function toBuyerProductDTO(product: ProductRow): BuyerProductDTO {
  const images = Array.isArray(product.images)
    ? (product.images as string[])
    : typeof product.images === 'string'
      ? JSON.parse(product.images)
      : [];

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    stockQty: product.stockQty,
    sku: product.sku,
    images,
    categoryId: product.categoryId,
    status: product.status,
    isMarketNestOfficial: product.ownerType === 'platform_owned',
    hue: product.hue ?? 160,
    categoryName: product.category?.name ?? null,
    brandName: product.brand?.name ?? null,
    dealEndsAt: product.dealEndsAt ? product.dealEndsAt.toISOString() : null,
    variants: (product.variants ?? []).map((variant) => ({
      id: variant.id,
      name: variant.name,
      options:
        variant.options && typeof variant.options === 'object' && !Array.isArray(variant.options)
          ? (variant.options as Record<string, string>)
          : {},
      priceDelta: Number(variant.priceDelta),
      stockQty: variant.stockQty,
      isDefault: variant.isDefault,
    })),
  };
}

export function toBuyerProductListItemDTO(product: ProductRow): BuyerProductListItemDTO {
  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const thumbnail = images[0] ?? null;

  return {
    id: product.id,
    title: product.title,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    thumbnail,
    isMarketNestOfficial: product.ownerType === 'platform_owned',
    hue: product.hue ?? 160,
    categoryName: product.category?.name ?? null,
    brandName: product.brand?.name ?? null,
    dealEndsAt: product.dealEndsAt ? product.dealEndsAt.toISOString() : null,
  };
}
