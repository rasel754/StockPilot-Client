'use client';

import MainLayout from '@/components/layout/MainLayout';
import DashboardOverview from '@/modules/dashboard/DashboardOverview';

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardOverview />
    </MainLayout>
  );
}
