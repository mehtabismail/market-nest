import Link from 'next/link';

type Portal = 'buyer' | 'seller' | 'admin';

const portalHome: Record<Portal, string> = {
  buyer: '/shop',
  seller: '/seller',
  admin: '/admin',
};

const portalTheme: Record<Portal, string> = {
  buyer: 'shop-theme mn-theme',
  seller: 'seller-theme mn-theme',
  admin: 'admin-theme mn-theme',
};

const portalSubtitle: Record<Portal, string> = {
  buyer: 'Shop',
  seller: 'Seller Portal',
  admin: 'Super Admin',
};

export function PortalShell({
  portal,
  title,
  children,
}: {
  portal: Portal;
  title: string;
  children: React.ReactNode;
}) {
  const subtitle = title || portalSubtitle[portal];

  const isPremium = portal !== 'admin';

  return (
    <div className={`${portalTheme[portal]} min-h-screen flex flex-col`}>
      <header className="mn-glass sticky top-0 z-50 border-b border-mn-ink/[0.06]">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link
            href={portalHome[portal]}
            className="font-syne text-xl font-extrabold tracking-tight text-mn-ink"
          >
            Market
            <span className={isPremium ? 'mn-grad-text' : 'text-mn-accent'}>Nest</span>
          </Link>
          <span className="hidden text-sm font-medium text-mn-mid sm:inline">{subtitle}</span>
        </div>
      </header>
      {children}
    </div>
  );
}
