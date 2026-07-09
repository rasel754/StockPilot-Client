'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/api';
import { showToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, CheckCircle2, Clock, Loader2, Info, AlertTriangle, AlertCircle } from 'lucide-react';

export default function NotificationsList() {
  const queryClient = useQueryClient();

  // Fetch Notifications
  const { data: notifRes, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getAll(),
    refetchInterval: 15000, // Refresh every 15s
  });
  const notifications = notifRes?.data || [];

  // Mark Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      showToast.error('Failed to update notification state');
    },
  });

  const handleMarkAllRead = () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) {
      showToast.info('All notifications are already marked read.');
      return;
    }
    unread.forEach((n) => {
      markReadMutation.mutate(n.id);
    });
    showToast.success('Marked all as read!');
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return <AlertTriangle className="text-amber-500 shrink-0" size={18} />;
      case 'EXPIRY':
        return <AlertCircle className="text-rose-500 shrink-0" size={18} />;
      default:
        return <Info className="text-blue-500 shrink-0" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay informed on low stock counts, upcoming batch expiries, and server alerts</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} className="flex items-center gap-2 self-start sm:self-auto">
            <CheckCircle2 size={16} /> Mark All Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-primary animate-swing" />
            <CardTitle>Alert Feeds</CardTitle>
          </div>
          <CardDescription>
            You have {notifications.filter((n) => !n.isRead).length} unread notices out of {notifications.length} logs
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-2 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary mr-2" size={24} />
              <span className="text-sm text-muted-foreground">Syncing notifications feed...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load alerts feed. Please check server connections.
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="p-4 bg-muted/30 rounded-full text-muted">
                <BellOff size={32} />
              </div>
              <p className="text-sm">Workspace is clean. No notifications logged.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all ${
                    n.isRead
                      ? 'bg-muted/10 border-border text-muted-foreground'
                      : 'bg-primary/[0.02] border-primary/20 text-foreground hover:shadow-xs'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                    <div className="space-y-1">
                      <p className={`text-xs sm:text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock size={11} />
                        <span>
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!n.isRead && (
                          <Badge variant="info" className="text-[8px] py-0 px-1">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markReadMutation.mutate(n.id)}
                      className="text-xs h-7 text-primary font-semibold hover:bg-primary/10 shrink-0"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
