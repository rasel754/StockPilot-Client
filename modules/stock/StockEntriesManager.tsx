'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { stockService, productService } from '@/services/api';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ArrowUpDown, Loader2, Upload, FileText, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const stockEntrySchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  purchasePrice: z.coerce.number().positive('Purchase price must be greater than zero'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  supplierName: z.string().optional(),
});

type StockEntryFormValues = z.infer<typeof stockEntrySchema>;

export default function StockEntriesManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch products for picker
  const { data: prodRes } = useQuery({
    queryKey: ['products-list-all'],
    queryFn: () => productService.getAll({ limit: 100 }),
  });
  const products = prodRes?.data || [];

  // Fetch Stock Entries
  const { data: stockRes, isLoading, error } = useQuery({
    queryKey: ['stock-entries', { page, limit }],
    queryFn: () => stockService.getAll({ page, limit }),
  });
  const stockEntries = stockRes?.data || [];
  const meta = stockRes?.meta;
  const totalPages = meta?.totalPage || 1;

  // Add stock form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockEntryFormValues>({
    resolver: zodResolver(stockEntrySchema) as any,
    defaultValues: {
      productId: '',
      quantity: 10,
      purchasePrice: 1.0,
      expiryDate: '',
      supplierName: '',
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: StockEntryFormValues) => {
      // Convert expiryDate to ISO format
      const formattedDate = new Date(data.expiryDate).toISOString();
      return stockService.create({ ...data, expiryDate: formattedDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-entries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expiry-expired'] });
      queryClient.invalidateQueries({ queryKey: ['expiry-soon'] });
      showToast.success('Stock batch added successfully!');
      setIsAddOpen(false);
      reset();
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || 'Failed to record stock batch';
      showToast.error(errMsg);
    },
  });

  const deleteExpiredMutation = useMutation({
    mutationFn: () => stockService.deleteExpired(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['stock-entries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expiry-expired'] });
      queryClient.invalidateQueries({ queryKey: ['expiry-soon'] });
      
      const count = res.data?.deletedCount || 0;
      showToast.success(`Successfully removed ${count} expired stock batches.`);
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || 'Failed to remove expired stock';
      showToast.error(errMsg);
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: (csv: string) => stockService.bulkUpload(csv),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['stock-entries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showToast.success(`CSV parsed! Successfully uploaded ${res.data?.length || 0} stock records.`);
      setIsBulkOpen(false);
      setCsvContent('');
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || 'Failed to parse CSV. Please check formatting.';
      showToast.error(errMsg);
    },
  });

  const onSubmitAdd = (data: StockEntryFormValues) => {
    createMutation.mutate(data);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  const handleBulkUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      showToast.error('Please select a file or paste CSV content first.');
      return;
    }
    bulkUploadMutation.mutate(csvContent);
  };

  const handleDeleteExpired = () => {
    if (window.confirm('This will purge all expired stock entries from the database. Are you sure?')) {
      deleteExpiredMutation.mutate();
    }
  };

  // Sample CSV format helper
  const handleDownloadSampleCsv = () => {
    const headers = 'productName,SKU,categoryName,unit,minimumStockLevel,quantity,purchasePrice,expiryDate,supplierName\n';
    const sampleRow = 'Orange Juice 1L,JUICE-ORG-1L,Beverages,cartons,10,50,0.85,2026-10-15,Beverage Dist\n';
    const blob = new Blob([headers + sampleRow], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'stock_bulk_sample.csv');
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Stock Entries</h1>
          <p className="text-sm text-muted-foreground">Log incoming deliveries, manage batches, and clean expired stock</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button variant="destructive" onClick={handleDeleteExpired} className="flex items-center gap-2">
              <Trash2 size={16} /> Purge Expired Stock
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsBulkOpen(true)} className="flex items-center gap-2">
            <Upload size={16} /> Bulk Upload (CSV)
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2">
            <Plus size={16} /> Add Stock Batch
          </Button>
        </div>
      </div>

      {/* Main Stock Log Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            <CardTitle>Batch Logs</CardTitle>
          </div>
          <CardDescription>Chronological list of all incoming stock entries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary mr-2" size={24} />
              <span className="text-sm text-muted-foreground">Loading stock batch entries...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load stock entries. Check your backend status.
            </div>
          ) : stockEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No stock entries recorded. Record a batch or run a CSV bulk upload.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold text-center">Qty Received</TableHead>
                    <TableHead className="font-semibold text-right">Unit Price</TableHead>
                    <TableHead className="font-semibold text-right">Total Price</TableHead>
                    <TableHead className="font-semibold text-center">Expiry Date</TableHead>
                    <TableHead className="font-semibold">Supplier</TableHead>
                    <TableHead className="font-semibold text-center">Batch Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockEntries.map((entry) => {
                    const isExpired = new Date(entry.expiryDate) < new Date();
                    const totalCost = entry.quantity * entry.purchasePrice;

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-semibold">{entry.product?.name || <span className="text-muted italic">Unknown Product</span>}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.product?.SKU || '-'}</TableCell>
                        <TableCell className="text-center font-semibold text-primary">{entry.quantity}</TableCell>
                        <TableCell className="text-right">${entry.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold text-foreground">${totalCost.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <span className={isExpired ? 'text-destructive font-semibold' : 'text-foreground'}>
                            {new Date(entry.expiryDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{entry.supplierName || '-'}</TableCell>
                        <TableCell className="text-center">
                          {isExpired ? (
                            <span className="text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-medium">Expired</span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-medium">Active</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Stock Batch Dialog */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Incoming Delivery">
        <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
              Select Product
            </label>
            <Select className={errors.productId ? 'border-destructive focus:ring-destructive/20' : ''} {...register('productId')}>
              <option value="">Select product to load...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.SKU})
                </option>
              ))}
            </Select>
            {errors.productId && <p className="text-xs text-destructive mt-1.5">{errors.productId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                Quantity
              </label>
              <Input
                type="number"
                placeholder="e.g. 50"
                className={errors.quantity ? 'border-destructive focus:ring-destructive/20' : ''}
                {...register('quantity')}
              />
              {errors.quantity && <p className="text-xs text-destructive mt-1.5">{errors.quantity.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                Purchase Price ($)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 1.25"
                className={errors.purchasePrice ? 'border-destructive focus:ring-destructive/20' : ''}
                {...register('purchasePrice')}
              />
              {errors.purchasePrice && <p className="text-xs text-destructive mt-1.5">{errors.purchasePrice.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
              Expiry Date
            </label>
            <Input
              type="date"
              className={errors.expiryDate ? 'border-destructive focus:ring-destructive/20' : ''}
              {...register('expiryDate')}
            />
            {errors.expiryDate && <p className="text-xs text-destructive mt-1.5">{errors.expiryDate.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
              Supplier Name (Optional)
            </label>
            <Input type="text" placeholder="e.g. Farm Fresh Dairy" {...register('supplierName')} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Record Batch'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* CSV Bulk Upload Dialog */}
      <Dialog isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="CSV Bulk Import">
        <form onSubmit={handleBulkUploadSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Upload a comma-separated CSV file containing the necessary column headers.
            </p>
            <div className="bg-muted p-2 rounded-lg font-mono text-[10px] select-all overflow-x-auto whitespace-nowrap">
              productName,SKU,categoryName,unit,minimumStockLevel,quantity,purchasePrice,expiryDate,supplierName
            </div>
            <Button type="button" variant="link" onClick={handleDownloadSampleCsv} className="p-0 h-auto text-xs font-bold text-primary">
              Download Sample CSV Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer relative">
            <Upload size={32} className="text-muted-foreground mb-2" />
            <span className="text-xs font-semibold text-foreground text-center">
              {isUploading ? 'Reading file...' : csvContent ? 'CSV Loaded Successfully' : 'Select CSV File'}
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </div>

          {csvContent && (
            <div className="bg-card border border-border p-3 rounded-lg max-h-40 overflow-y-auto font-mono text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground text-xs block mb-1">CSV Preview:</span>
              <pre>{csvContent.split('\n').slice(0, 5).join('\n')}</pre>
              {csvContent.split('\n').length > 5 && '...'}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsBulkOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={bulkUploadMutation.isPending || isUploading || !csvContent}>
              {bulkUploadMutation.isPending ? 'Importing...' : 'Start Import'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
