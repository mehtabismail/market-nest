import type { Metadata } from 'next';
import { DM_Mono, Instrument_Serif, Plus_Jakarta_Sans, Syne } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import './globals.css';
import '@/styles/marketnest-theme.css';
import '@/styles/shop-theme.css';

// Body / UI — clean premium sans.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
});

// Data, prices, order ids — tabular mono.
const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
});

// Display / headings — expressive geometric.
const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['600', '700', '800'],
});

// Editorial serif accent — used sparingly for hero moments.
const instrument = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument',
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'MarketNest',
  description: 'Multi-vendor marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${dmMono.variable} ${syne.variable} ${instrument.variable}`}
    >
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
