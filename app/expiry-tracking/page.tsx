import MainLayout from '@/components/layout/MainLayout';
import ExpiryTracker from '@/modules/expiry/ExpiryTracker';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Expiry Tracking',
};

export default function ExpiryTrackingPage() {
  return (
    <MainLayout>
      <ExpiryTracker />
    </MainLayout>
  );
}
