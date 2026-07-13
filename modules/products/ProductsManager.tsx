'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productService, categoryService } from '@/services/api';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Search, Filter, Loader2, PackageOpen } from 'lucide-react';
import { Product } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  SKU: z.string().min(2, 'SKU code must be at least 2 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  unit: z.string().min(1, 'Unit description is required (e.g. bottles, kg)'),
  minimumStockLevel: z.coerce.number().min(0, 'Minimum stock level cannot be negative'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Filters state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const limit = 10;

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Debouncing search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Fetch Categories for filters/forms
  const { data: catRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });
  const categories = catRes?.data || [];

  // Fetch Products (TanStack Query)
  const { data: prodRes, isLoading, error } = useQuery({
    queryKey: ['products', { searchTerm: debouncedSearch, categoryId: selectedCategoryFilter, page, limit }],
    queryFn: () =>
      productService.getAll({
        searchTerm: debouncedSearch || undefined,
        categoryId: selectedCategoryFilter || undefined,
        page,
        limit,
      }),
  });

  const products = prodRes?.data || [];
  const meta = prodRes?.meta;
  const totalPages = meta?.totalPage || 1;

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ProductFormValues) => productService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showToast.success('Product created successfully!');
      handleClose();
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || 'Failed to create product';
      showToast.error(errMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormValues }) => productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast.success('Product updated successfully!');
      handleClose();
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || 'Failed to update product';
      showToast.error(errMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showToast.success('Product deleted successfully!');
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || 'Failed to delete product';
      showToast.error(errMsg);
    },
  });

  const handleOpen = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setValue('name', product.name);
      setValue('SKU', product.SKU);
      setValue('categoryId', product.categoryId);
      setValue('unit', product.unit);
      setValue('minimumStockLevel', product.minimumStockLevel);
    } else {
      setEditingProduct(null);
      reset({
        name: '',
        SKU: '',
        categoryId: categories[0]?.id || '',
        unit: 'pcs',
        minimumStockLevel: 5,
      });
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your inventory, pricing models, and stock levels</p>
        </div>
        <Button onClick={() => handleOpen()} className="flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            type="text"
            placeholder="Search by product name or SKU..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3 text-muted-foreground pointer-events-none" size={16} />
          <Select
            className="pl-9"
            value={selectedCategoryFilter}
            onChange={(e) => {
              setSelectedCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-end text-xs text-muted-foreground italic">
          Showing {products.length} of {meta?.total || 0} items
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <PackageOpen size={20} className="text-primary" />
            <CardTitle>Inventory Catalogue</CardTitle>
          </div>
          <CardDescription>Consolidated items directory</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary mr-2" size={24} />
              <span className="text-sm text-muted-foreground">Loading products catalogue...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load products. Please check server availability.
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No matching products found. Try relaxing filters or add a new product.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Product Name</TableHead>
                    <TableHead className="font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Unit</TableHead>
                    <TableHead className="font-semibold text-center">Stock Level</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const currentStock = p.totalStock ?? 0;
                    const minLevel = p.minimumStockLevel;
                    const isLow = currentStock <= minLevel;

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold text-foreground">{p.name}</TableCell>
                        <TableCell className="font-mono text-xs">{p.SKU}</TableCell>
                        <TableCell>{p.category?.name || <span className="italic text-xs text-muted">Uncategorized</span>}</TableCell>
                        <TableCell className="text-muted-foreground">{p.unit}</TableCell>
                        <TableCell className="text-center font-bold">{currentStock}</TableCell>
                        <TableCell className="text-center">
                          {currentStock === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : isLow ? (
                            <Badge variant="warning">Low Stock</Badge>
                          ) : (
                            <Badge variant="success">Healthy</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpen(p)} className="h-8 px-2">
                              <Edit2 size={13} className="text-sky-600" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(p.id)}
                              className="h-8 px-2"
                              disabled={!isAdmin}
                              title={!isAdmin ? 'Administrative role required' : 'Delete product'}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
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

      {/* Product Add/Edit Modal */}
      <Dialog isOpen={isOpen} onClose={handleClose} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
              Product Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Whole Milk 1L"
              className={errors.name ? 'border-destructive focus:ring-destructive/20' : ''}
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive mt-1.5">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                SKU Code
              </label>
              <Input
                type="text"
                placeholder="e.g. MILK-WHOLE-1L"
                className={errors.SKU ? 'border-destructive focus:ring-destructive/20' : ''}
                {...register('SKU')}
              />
              {errors.SKU && <p className="text-xs text-destructive mt-1.5">{errors.SKU.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                Category
              </label>
              <Select className={errors.categoryId ? 'border-destructive focus:ring-destructive/20' : ''} {...register('categoryId')}>
                <option value="">Choose category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {errors.categoryId && <p className="text-xs text-destructive mt-1.5">{errors.categoryId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                Measurement Unit
              </label>
              <Input
                type="text"
                placeholder="e.g. bottles, cartons, kg"
                className={errors.unit ? 'border-destructive focus:ring-destructive/20' : ''}
                {...register('unit')}
              />
              {errors.unit && <p className="text-xs text-destructive mt-1.5">{errors.unit.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                Min Stock Level
              </label>
              <Input
                type="number"
                placeholder="e.g. 10"
                className={errors.minimumStockLevel ? 'border-destructive focus:ring-destructive/20' : ''}
                {...register('minimumStockLevel')}
              />
              {errors.minimumStockLevel && <p className="text-xs text-destructive mt-1.5">{errors.minimumStockLevel.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) {
            deleteMutation.mutate(productToDelete);
          }
        }}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
