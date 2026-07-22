import type { PaymentMethod } from './enums';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutDto {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface OrderSummaryDTO {
  id: string;
  status: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode: string | null;
  total: number;
  createdAt: string;
  itemCount: number;
  /** Delivery window, ISO strings. Null on legacy orders predating estimates. */
  estimatedFrom: string | null;
  estimatedTo: string | null;
}

export interface OrderDetailDTO extends OrderSummaryDTO {
  shippingAddress: ShippingAddress;
  items: {
    id: string;
    productId: string;
    title: string;
    quantity: number;
    unitPrice: number;
    isMarketNestOfficial: boolean;
    status: string;
    trackingNumber?: string | null;
    courierName?: string | null;
  }[];
}

export interface PaymentIntentResponse {
  orderId: string;
  clientSecret: string | null;
}
