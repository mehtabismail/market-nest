import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/skeleton';
import BuyerLoginPage from './login-client';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BuyerLoginPage />
    </Suspense>
  );
}
