'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { salesService, productService } from '@/services/api';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShoppingCart, Plus, Loader2, ArrowUpRight } from 'lucide-react';

const saleSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  quantitySold: z.coerce.number().positive('Quantity must be greater than zero'),
  sellingPrice: z.coerce.number().positive('Selling price must be greater than zero'),
  date: z.string().min(1, 'Sale date is required'),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function SalesManager() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);

  // Fetch products to verify available stock
  const { data: prodRes } = useQuery({
    queryKey: ['products-list-sales'],
    queryFn: () => productService.getAll({ limit: 100 }),
  });
  const products = prodRes?.data || [];

  // Fetch Sales History
  const { data: salesRes, isLoading, error } = useQuery({
    queryKey: ['sales', { page, limit }],
    queryFn: () => salesService.getAll({ page, limit }),
  });
  const sales = salesRes?.data || [];
  const meta = salesRes?.meta;
  const totalPages = meta?.totalPage || 1;

  // Add Sale Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema) as any,
    defaultValues: {
      productId: '',
      quantitySold: 1,
      sellingPrice: 2.0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Watch selected product to show stock limits
  const selectedProductId = watch('productId');
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const availableStock = selectedProduct?.totalStock ?? 0;

  // Record Sale Mutation
  const recordMutation = useMutation({
    mutationFn: (data: SaleFormValues) => {
      // Validate available stock first before sending to server
      if (data.quantitySold > availableStock) {
        throw new Error(`Insufficient stock. Only ${availableStock} units available.`);
      }

      const formattedDate = new Date(data.date).toISOString();
      return salesService.create({ ...data, date: formattedDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      showToast.success('Sale transaction recorded successfully!');
      setIsOpen(false);
      reset();
    },
    onError: (err: any) => {
      const errMsg = err.message || err.response?.data?.message || 'Failed to record sale';
      showToast.error(errMsg);
    },
  });

  const onSubmit = (data: SaleFormValues) => {
    recordMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Sales</h1>
          <p className="text-sm text-muted-foreground">Record client transactions and track FIFO stock deductions</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Record Sale
        </Button>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            <CardTitle>Sales History</CardTitle>
          </div>
          <CardDescription>Chronological list of registered stock deductions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary mr-2" size={24} />
              <span className="text-sm text-muted-foreground">Loading sales history...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load transactions. Check connection.
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No sales logged. Click &quot;Record Sale&quot; to register a transaction.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Sale Date</TableHead>
                    <TableHead className="font-semibold">Product Name</TableHead>
                    <TableHead className="font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold text-center">Qty Sold</TableHead>
                    <TableHead className="font-semibold text-right">Selling Price</TableHead>
                    <TableHead className="font-semibold text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => {
                    const revenue = s.quantitySold * s.sellingPrice;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          {new Date(s.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-semibold">{s.product?.name || <span className="text-muted italic">Unknown Product</span>}</TableCell>
                        <TableCell className="font-mono text-xs">{s.product?.SKU || '-'}</TableCell>
                        <TableCell className="text-center font-semibold text-rose-600">-{s.quantitySold}</TableCell>
                        <TableCell className="text-right">${s.sellingPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-extrabold text-foreground">${revenue.toFixed(2)}</TableCell>
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

      {/* Record Sale Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record New Sale">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
              Select Product
            </label>
            <Select className={errors.productId ? 'border-destructive focus:ring-destructive/20' : ''} {...register('productId')}>
              <option value="">Select product to sell...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={(p.totalStock ?? 0) <= 0}>
                  {p.name} ({p.SKU}) — [Available: {p.totalStock ?? 0} {p.unit}]
                </option>
              ))}
            </Select>
            {errors.productId && <p className="text-xs text-destructive mt-1.5">{errors.productId.message}</p>}
          </div>

          {selectedProduct && (
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs text-sky-800 dark:bg-sky-950/40 dark:border-sky-900/50 dark:text-sky-300">
              <span className="font-semibold block mb-0.5">FIFO Inventory Warning:</span>
              Stock will be deducted from your oldest active batches first. Available units: <span className="font-bold">{availableStock}</span> {selectedProduct.unit}.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                Quantity Sold
              </label>
              <Input
                type="number"
                placeholder="e.g. 5"
                className={errors.quantitySold ? 'border-destructive focus:ring-destructive/20' : ''}
                {...register('quantitySold')}
              />
              {errors.quantitySold && <p className="text-xs text-destructive mt-1.5">{errors.quantitySold.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                Selling Price ($)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 2.50"
                className={errors.sellingPrice ? 'border-destructive focus:ring-destructive/20' : ''}
                {...register('sellingPrice')}
              />
              {errors.sellingPrice && <p className="text-xs text-destructive mt-1.5">{errors.sellingPrice.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
              Date of Sale
            </label>
            <Input
              type="date"
              className={errors.date ? 'border-destructive focus:ring-destructive/20' : ''}
              {...register('date')}
            />
            {errors.date && <p className="text-xs text-destructive mt-1.5">{errors.date.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={recordMutation.isPending}>
              {recordMutation.isPending ? 'Processing...' : 'Complete Sale'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
