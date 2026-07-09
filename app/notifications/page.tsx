'use client';

import MainLayout from '@/components/layout/MainLayout';
import NotificationsList from '@/modules/notifications/NotificationsList';

export default function NotificationsPage() {
  return (
    <MainLayout>
      <NotificationsList />
    </MainLayout>
  );
}
