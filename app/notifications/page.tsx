import MainLayout from '@/components/layout/MainLayout';
import NotificationsList from '@/modules/notifications/NotificationsList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications',
};

export default function NotificationsPage() {
  return (
    <MainLayout>
      <NotificationsList />
    </MainLayout>
  );
}
