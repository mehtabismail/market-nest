import { ShopLayoutClient } from './shop-layout-client';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <ShopLayoutClient>{children}</ShopLayoutClient>;
}
