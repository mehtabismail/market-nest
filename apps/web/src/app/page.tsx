import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/landing-page';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: 'MarketNest — The Smart Multi-Vendor Marketplace',
  description:
    'MarketNest is the multi-vendor marketplace where buyers discover anything they need and sellers grow their business.',
};

export default function HomePage() {
  return <LandingPage />;
}
