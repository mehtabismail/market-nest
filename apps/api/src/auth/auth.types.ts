import type { UserRole } from '@marketnest/shared-types';

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  sellerId?: string;
}
