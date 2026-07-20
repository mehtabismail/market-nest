import { SellerShell } from './seller-shell';

export const dynamic = 'force-dynamic';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
