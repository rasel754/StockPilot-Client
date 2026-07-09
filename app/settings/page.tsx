'use client';

import MainLayout from '@/components/layout/MainLayout';
import SettingsManager from '@/modules/users/SettingsManager';

export default function SettingsPage() {
  return (
    <MainLayout>
      <SettingsManager />
    </MainLayout>
  );
}
