import MainLayout from '@/components/layout/MainLayout';
import StockEntriesManager from '@/modules/stock/StockEntriesManager';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stock Entries',
};

export default function StockEntriesPage() {
  return (
    <MainLayout>
      <StockEntriesManager />
    </MainLayout>
  );
}
