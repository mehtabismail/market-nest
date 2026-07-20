import type { Metadata } from 'next';
import { DM_Mono, DM_Sans, Outfit } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import './globals.css';
import '@/styles/marketnest-theme.css';
import '@/styles/shop-theme.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'MarketNest',
  description: 'Multi-vendor marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${outfit.variable}`}>
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
