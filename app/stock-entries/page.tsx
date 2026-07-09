'use client';

import MainLayout from '@/components/layout/MainLayout';
import StockEntriesManager from '@/modules/stock/StockEntriesManager';

export default function StockEntriesPage() {
  return (
    <MainLayout>
      <StockEntriesManager />
    </MainLayout>
  );
}
