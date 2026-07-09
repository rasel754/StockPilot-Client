'use client';

import MainLayout from '@/components/layout/MainLayout';
import ExpiryTracker from '@/modules/expiry/ExpiryTracker';

export default function ExpiryTrackingPage() {
  return (
    <MainLayout>
      <ExpiryTracker />
    </MainLayout>
  );
}
