import MainLayout from '@/components/layout/MainLayout';
import DashboardOverview from '@/modules/dashboard/DashboardOverview';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardOverview />
    </MainLayout>
  );
}
