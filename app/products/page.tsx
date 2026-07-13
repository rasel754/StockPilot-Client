import MainLayout from '@/components/layout/MainLayout';
import ProductsManager from '@/modules/products/ProductsManager';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products Manager',
};

export default function ProductsPage() {
  return (
    <MainLayout>
      <ProductsManager />
    </MainLayout>
  );
}
