'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { categoryService } from '@/services/api';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { Category } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Fetch Categories
  const { data: res, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const categories = res?.data || [];

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  // Create/Update Mutations
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormValues) => categoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast.success('Category created successfully!');
      handleClose();
    },
    onError: () => {
      showToast.error('Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormValues }) => categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast.success('Category updated successfully!');
      handleClose();
    },
    onError: () => {
      showToast.error('Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast.success('Category deleted successfully!');
    },
    onError: () => {
      showToast.error('Failed to delete category. Verify it is not tied to active products.');
    },
  });

  const handleOpen = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setValue('name', category.name);
      setValue('description', category.description || '');
    } else {
      setEditingCategory(null);
      reset({ name: '', description: '' });
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingCategory(null);
    reset({ name: '', description: '' });
  };

  const onSubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage product categories and metadata</p>
        </div>
        <Button onClick={() => handleOpen()} className="flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FolderOpen size={20} className="text-primary" />
            <CardTitle>Category Registry</CardTitle>
          </div>
          <CardDescription>A total of {categories.length} category records found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary mr-2" size={24} />
              <span className="text-sm text-muted-foreground">Loading categories...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load categories. Please check your network connection.
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No categories found. Click &quot;Add Category&quot; to begin.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Category Name</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">
                      {c.description || <span className="italic text-xs text-muted">No description</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpen(c)}
                          className="h-8 px-2"
                        >
                          <Edit2 size={13} className="text-sky-600" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          className="h-8 px-2"
                          disabled={!isAdmin}
                          title={!isAdmin ? 'Administrative role required' : 'Delete category'}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Categories Add/Edit Modal */}
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
              Category Name
            </label>
            <Input
              type="text"
              placeholder="e.g., Beverages"
              className={errors.name ? 'border-destructive focus:ring-destructive/20' : ''}
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive mt-1.5">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
              Description (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., Soft drinks, water, and juices"
              className={errors.description ? 'border-destructive focus:ring-destructive/20' : ''}
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive mt-1.5">{errors.description.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete);
          }
        }}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
