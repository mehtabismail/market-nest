export type UserRole = 'superadmin' | 'seller' | 'buyer';

export type ProductOwnerType = 'seller_owned' | 'platform_owned' | 'seller_assigned';

export type ProductStatus = 'draft' | 'published' | 'archived';

export type OrderStatus =
  | 'pending_cod'
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'cod' | 'online';
