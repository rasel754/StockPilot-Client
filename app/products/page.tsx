'use client';

import MainLayout from '@/components/layout/MainLayout';
import ProductsManager from '@/modules/products/ProductsManager';

export default function ProductsPage() {
  return (
    <MainLayout>
      <ProductsManager />
    </MainLayout>
  );
}
