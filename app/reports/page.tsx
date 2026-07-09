'use client';

import MainLayout from '@/components/layout/MainLayout';
import ReportsManager from '@/modules/reports/ReportsManager';

export default function ReportsPage() {
  return (
    <MainLayout>
      <ReportsManager />
    </MainLayout>
  );
}
