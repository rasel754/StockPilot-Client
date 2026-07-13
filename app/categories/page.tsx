import MainLayout from '@/components/layout/MainLayout';
import CategoriesManager from '@/modules/categories/CategoriesManager';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categories Manager',
};

export default function CategoriesPage() {
  return (
    <MainLayout>
      <CategoriesManager />
    </MainLayout>
  );
}
