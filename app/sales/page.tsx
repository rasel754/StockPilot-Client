import MainLayout from '@/components/layout/MainLayout';
import SalesManager from '@/modules/sales/SalesManager';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sales & Invoicing',
};

export default function SalesPage() {
  return (
    <MainLayout>
      <SalesManager />
    </MainLayout>
  );
}
