'use client';

import MainLayout from '@/components/layout/MainLayout';
import CategoriesManager from '@/modules/categories/CategoriesManager';

export default function CategoriesPage() {
  return (
    <MainLayout>
      <CategoriesManager />
    </MainLayout>
  );
}
