/** Internal/admin/seller only — NOT exported from buyer barrel */
export interface SellerDTO {
  id: string;
  storeName: string;
  storeSlug: string;
  email?: string;
  isActive: boolean;
  isSystem: boolean;
  commissionRate: number;
  status: string;
}
