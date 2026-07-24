import type { BuyerProductListItemDTO } from './buyer-product';

export interface CartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CartLineDTO {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: BuyerProductListItemDTO;
}

export interface CartDTO {
  id: string;
  items: CartLineDTO[];
  subtotal: number;
  /** Flat shipping fee the checkout will charge. Zero when the cart is empty. */
  shippingFee: number;
  itemCount: number;
}
