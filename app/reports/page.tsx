import MainLayout from '@/components/layout/MainLayout';
import ReportsManager from '@/modules/reports/ReportsManager';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports & Analytics',
};

export default function ReportsPage() {
  return (
    <MainLayout>
      <ReportsManager />
    </MainLayout>
  );
}
