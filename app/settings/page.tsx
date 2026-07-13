import MainLayout from '@/components/layout/MainLayout';
import SettingsManager from '@/modules/users/SettingsManager';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <MainLayout>
      <SettingsManager />
    </MainLayout>
  );
}
