'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expiryService, stockService } from '@/services/api';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, AlertCircle, Trash2, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function ExpiryTracker() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Customizable days filter for soon-to-expire
  const [daysFilter, setDaysFilter] = useState(30);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // Queries
  const { data: expiredRes, isLoading: isExpiredLoading } = useQuery({
    queryKey: ['expiry-expired'],
    queryFn: () => expiryService.getExpired(),
  });
  const expiredStock = expiredRes?.data || [];

  const { data: soonRes, isLoading: isSoonLoading } = useQuery({
    queryKey: ['expiry-soon', daysFilter],
    queryFn: () => expiryService.getExpiringSoon(daysFilter),
  });
  const soonStock = soonRes?.data || [];

  // Mutations
  const purgeMutation = useMutation({
    mutationFn: () => stockService.deleteExpired(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['expiry-expired'] });
      queryClient.invalidateQueries({ queryKey: ['expiry-soon'] });
      queryClient.invalidateQueries({ queryKey: ['stock-entries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      
      const count = res.data?.deletedCount || 0;
      showToast.success(`Purged! Automatically deleted ${count} expired stock batches.`);
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || 'Failed to delete expired entries';
      showToast.error(errMsg);
    },
  });

  const handlePurge = () => {
    setShowPurgeConfirm(true);
  };

  const getDaysRemainingText = (expiryDateStr: string) => {
    const timeDiff = new Date(expiryDateStr).getTime() - Date.now();
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    if (days < 0) {
      return { text: `Expired ${Math.abs(days)} days ago`, isExpired: true, daysCount: days };
    }
    if (days === 0) {
      return { text: 'Expires Today', isExpired: false, daysCount: 0 };
    }
    return { text: `${days} days left`, isExpired: false, daysCount: days };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Expiry Tracking</h1>
          <p className="text-sm text-muted-foreground">Monitor expired items and protect incoming stock batches</p>
        </div>
        {isAdmin && expiredStock.length > 0 && (
          <Button variant="destructive" onClick={handlePurge} className="flex items-center gap-2 self-start sm:self-auto">
            <Trash2 size={16} /> Purge Expired Stock ({expiredStock.length})
          </Button>
        )}
      </div>

      {/* Grid of panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Expired Stock Card */}
        <Card className="border-rose-500/20 dark:border-rose-500/10">
          <CardHeader className="pb-3 border-b border-border bg-rose-500/[0.02]">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-rose-500" size={20} />
              <div>
                <CardTitle>Expired Batches</CardTitle>
                <CardDescription>Items that have passed their expiration dates and must not be sold</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isExpiredLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-rose-500 mr-2" size={24} />
                <span className="text-sm text-muted-foreground">Analyzing expired batches...</span>
              </div>
            ) : expiredStock.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No expired stock found! Your inventory is fresh.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs">Product</TableHead>
                    <TableHead className="font-semibold text-xs text-center">SKU</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Qty</TableHead>
                    <TableHead className="font-semibold text-xs text-center font-bold">Expired On</TableHead>
                    <TableHead className="font-semibold text-xs">Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiredStock.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-rose-500/[0.01]">
                      <TableCell className="font-semibold py-3 text-xs">{entry.product?.name}</TableCell>
                      <TableCell className="font-mono text-[10px] text-center">{entry.product?.SKU}</TableCell>
                      <TableCell className="text-right py-3 font-semibold text-xs text-rose-600">
                        {entry.quantity}
                      </TableCell>
                      <TableCell className="text-center py-3 text-xs">
                        <span className="text-rose-600 font-bold block">
                          {new Date(entry.expiryDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground block italic">
                          {getDaysRemainingText(entry.expiryDate).text}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs py-3">{entry.supplierName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon Card */}
        <Card className="border-amber-500/20 dark:border-amber-500/10">
          <CardHeader className="pb-3 border-b border-border bg-amber-500/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              <div>
                <CardTitle>Expiring Soon</CardTitle>
                <CardDescription>Active stock batches nearing deadlines</CardDescription>
              </div>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Calendar size={14} className="text-muted-foreground" />
              <Select
                value={daysFilter}
                onChange={(e) => setDaysFilter(Number(e.target.value))}
                className="h-8 py-0.5 text-xs max-w-[7.5rem] bg-card"
              >
                <option value="7">Next 7 Days</option>
                <option value="30">Next 30 Days</option>
                <option value="90">Next 90 Days</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isSoonLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-amber-500 mr-2" size={24} />
                <span className="text-sm text-muted-foreground">Checking expiry schedules...</span>
              </div>
            ) : soonStock.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No items expiring within the next {daysFilter} days.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs">Product</TableHead>
                    <TableHead className="font-semibold text-xs text-center">SKU</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Qty</TableHead>
                    <TableHead className="font-semibold text-xs text-center font-bold">Expiry Date</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Urgency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soonStock.map((entry) => {
                    const daysInfo = getDaysRemainingText(entry.expiryDate);
                    const isUrgent = daysInfo.daysCount <= 7;

                    return (
                      <TableRow key={entry.id} className="hover:bg-amber-500/[0.01]">
                        <TableCell className="font-semibold py-3 text-xs">{entry.product?.name}</TableCell>
                        <TableCell className="font-mono text-[10px] text-center">{entry.product?.SKU}</TableCell>
                        <TableCell className="text-right py-3 font-semibold text-xs text-foreground">
                          {entry.quantity}
                        </TableCell>
                        <TableCell className="text-center py-3 text-xs">
                          <span className="block font-medium">
                            {new Date(entry.expiryDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">{daysInfo.text}</span>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <Badge variant={isUrgent ? 'destructive' : 'warning'}>
                            {isUrgent ? 'Urgent' : 'Watch'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={showPurgeConfirm}
        onClose={() => setShowPurgeConfirm(false)}
        onConfirm={() => {
          purgeMutation.mutate();
        }}
        title="Purge Expired Batches"
        description="Purge ALL expired batches from database? This cannot be undone."
        isLoading={purgeMutation.isPending}
      />
    </div>
  );
}
