'use client';

import MainLayout from '@/components/layout/MainLayout';
import SalesManager from '@/modules/sales/SalesManager';

export default function SalesPage() {
  return (
    <MainLayout>
      <SalesManager />
    </MainLayout>
  );
}
