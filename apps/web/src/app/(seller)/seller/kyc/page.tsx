'use client';

import { SellerKycWizard } from './seller-kyc-wizard';

export default function SellerKycPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <SellerKycWizard heading="Complete seller verification" />
    </div>
  );
}
