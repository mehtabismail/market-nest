'use client';

import { useMemo, useState } from 'react';
import type { BuyerProductVariantDTO } from '@marketnest/shared-types/buyer';
import { AddToCartButton } from './add-to-cart-button';

interface ProductVariantSelectorProps {
  productId: string;
  basePrice: number;
  baseStockQty: number;
  variants: BuyerProductVariantDTO[];
}

function formatVariant(variant: BuyerProductVariantDTO) {
  const optionValues = Object.values(variant.options ?? {});
  return optionValues.length ? `${variant.name} (${optionValues.join(' / ')})` : variant.name;
}

export function ProductVariantSelector({
  productId,
  basePrice,
  baseStockQty,
  variants,
}: ProductVariantSelectorProps) {
  const defaultVariant = useMemo(
    () => variants.find((variant) => variant.isDefault) ?? variants[0],
    [variants],
  );
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id ?? '');

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? defaultVariant;
  const effectivePrice = basePrice + (selectedVariant?.priceDelta ?? 0);
  const effectiveStockQty = selectedVariant?.stockQty ?? baseStockQty;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray">
        Variant
        <select
          className="input mt-1"
          value={selectedVariant?.id ?? ''}
          onChange={(event) => setSelectedVariantId(event.target.value)}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {formatVariant(variant)}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm">
        Selected price: <span className="font-semibold text-blue">${effectivePrice.toFixed(2)}</span>
      </p>
      <p className="text-sm text-gray">
        {effectiveStockQty > 0 ? `${effectiveStockQty} variant units in stock` : 'Selected variant is out of stock'}
      </p>
      <AddToCartButton productId={productId} variantId={selectedVariant?.id} />
    </div>
  );
}
