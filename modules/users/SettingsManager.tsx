'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, businessService } from '@/services/api';
import { showToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Settings, Users, Building, ShieldAlert, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsManager() {
  const queryClient = useQueryClient();
  const { user: currentUser, updateUserInState } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [editUserName, setEditUserName] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ id: string; newRole: string } | null>(null);

  // 1. Fetch Business Details
  const { data: busRes, isLoading: isBusLoading } = useQuery({
    queryKey: ['business-details'],
    queryFn: () => businessService.getBusiness(),
  });
  const business = busRes?.data;

  // 2. Fetch Associated Users
  const { data: usersRes, isLoading: isUsersLoading } = useQuery({
    queryKey: ['business-users'],
    queryFn: () => userService.getUsers(),
  });
  const users = usersRes?.data || [];

  // Update User Mutation (Role / Name)
  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { role?: string; name?: string } }) =>
      userService.updateUser(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['business-users'] });
      showToast.success('User details updated successfully!');
      
      // If we updated ourselves, synchronize our auth state
      if (res.data?.id === currentUser?.id) {
        updateUserInState(res.data);
      }
      setEditingUserId(null);
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || 'Failed to update user';
      showToast.error(errMsg);
    },
  });

  const handleRoleChange = (id: string, newRole: string) => {
    if (id === currentUser?.id && newRole !== 'ADMIN') {
      setPendingRoleChange({ id, newRole });
    } else {
      updateUserMutation.mutate({ id, payload: { role: newRole } });
    }
  };

  const handleStartEditName = (id: string, currentName: string) => {
    setEditingUserId(id);
    setEditUserName(currentName);
  };

  const handleSaveName = (id: string) => {
    if (!editUserName.trim()) {
      showToast.error('Name cannot be empty');
      return;
    }
    updateUserMutation.mutate({ id, payload: { name: editUserName } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your business profile and team access controls</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Business details panel */}
        <Card className="xl:col-span-1 h-fit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building size={18} className="text-primary" />
              <CardTitle>Business Information</CardTitle>
            </div>
            <CardDescription>Details about your registered organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isBusLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="animate-spin text-primary mr-2" />
                <span className="text-xs text-muted-foreground">Loading details...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Business Name</span>
                  <span className="text-base font-bold text-foreground block">{business?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Business ID</span>
                  <span className="text-xs font-mono bg-muted py-1 px-2 rounded-lg text-foreground block w-fit truncate mt-1">
                    {business?.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Owner ID</span>
                  <span className="text-xs font-mono bg-muted py-1 px-2 rounded-lg text-foreground block w-fit truncate mt-1">
                    {business?.ownerId}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User / Team Management panel */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <CardTitle>Team Management</CardTitle>
            </div>
            <CardDescription>Admin and staff users with access to this inventory console</CardDescription>
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary mr-2" size={24} />
                <span className="text-sm text-muted-foreground">Fetching users registry...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs">Name</TableHead>
                    <TableHead className="font-semibold text-xs">Email</TableHead>
                    <TableHead className="font-semibold text-xs text-center font-bold">Role Privilege</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isEditing = editingUserId === u.id;

                    return (
                      <TableRow key={u.id} className="hover:bg-muted/10">
                        {/* Name Column */}
                        <TableCell className="py-3 text-xs">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editUserName}
                                onChange={(e) => setEditUserName(e.target.value)}
                                className="h-8 max-w-[12rem] py-0.5 text-xs"
                              />
                              <Button variant="outline" size="sm" onClick={() => handleSaveName(u.id)} className="h-8 px-2">
                                <Save size={13} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold block text-foreground">
                                {u.name} {isSelf && <span className="text-[10px] text-primary">(You)</span>}
                              </span>
                              {isAdmin && !isEditing && (
                                <button
                                  onClick={() => handleStartEditName(u.id, u.name)}
                                  className="text-[10px] text-primary hover:underline"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Email Column */}
                        <TableCell className="py-3 text-xs">{u.email}</TableCell>

                        {/* Role Privilege Column */}
                        <TableCell className="py-3 text-xs text-center">
                          {isAdmin ? (
                            <Select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="h-8 py-0.5 text-xs max-w-[6.5rem] inline-block bg-card text-center"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="STAFF">STAFF</option>
                            </Select>
                          ) : (
                            <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                              {u.role}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {!isAdmin && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 flex gap-2 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300">
                <ShieldAlert size={16} className="shrink-0" />
                <span>
                  <strong>Note:</strong> Team privilege editing is restricted to administrators. You can view names and roles, but role adjustments require ADMIN access.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={!!pendingRoleChange}
        onClose={() => setPendingRoleChange(null)}
        onConfirm={() => {
          if (pendingRoleChange) {
            updateUserMutation.mutate({
              id: pendingRoleChange.id,
              payload: { role: pendingRoleChange.newRole },
            });
          }
        }}
        title="Confirm Role Change"
        description="Warning: Demoting yourself from ADMIN will lock you out of admin actions. Continue?"
        isLoading={updateUserMutation.isPending}
      />
    </div>
  );
}
