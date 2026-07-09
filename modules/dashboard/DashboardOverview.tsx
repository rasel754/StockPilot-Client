'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, reportsService, expiryService, productService } from '@/services/api';
import StatsCard from './StatsCard';
import { Package, DollarSign, AlertTriangle, AlertCircle, TrendingUp, Calendar, Loader2, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Eliminate SSR hydration mismatches for Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Dashboard summary stats
  const { data: summaryRes, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
    refetchInterval: 15000, // Refresh every 15s
  });
  const summary = summaryRes?.data;

  // 2. Fetch 30-day sales history for the trend chart
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: salesChartRes, isLoading: isChartLoading } = useQuery({
    queryKey: ['dashboard-sales-chart', start, end],
    queryFn: () => reportsService.getSalesReport(start, end),
    enabled: mounted,
  });
  const chartData = salesChartRes?.data || [];

  // 3. Fetch low stock products (limit 5 for dashboard)
  const { data: lowStockRes } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => productService.getAll({ limit: 100 }), // We filter in memory for low stock
  });
  const lowStockProducts = (lowStockRes?.data || [])
    .filter((p) => (p.totalStock ?? 0) <= p.minimumStockLevel)
    .slice(0, 5);

  // 4. Fetch expiring soon stock entries (next 7 days, limit 5)
  const { data: expiryRes } = useQuery({
    queryKey: ['dashboard-expiry-soon'],
    queryFn: () => expiryService.getExpiringSoon(7),
  });
  const expiringSoonItems = (expiryRes?.data || []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, <span className="font-semibold text-primary">{user?.name}</span>. Here is the operational state of your inventory.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Products"
          value={isSummaryLoading ? '...' : summary?.totalProducts ?? 0}
          description="Registered items in catalog"
          icon={Package}
          iconColor="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-500/10 border border-blue-500/20"
        />
        <StatsCard
          title="Stock Value"
          value={isSummaryLoading ? '...' : `$${(summary?.totalStockValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="Cumulative catalog valuation"
          icon={DollarSign}
          iconColor="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-500/10 border border-emerald-500/20"
        />
        <StatsCard
          title="Low Stock Items"
          value={isSummaryLoading ? '...' : summary?.lowStockCount ?? 0}
          description="Below minimum stock thresholds"
          icon={AlertTriangle}
          iconColor="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-500/10 border border-amber-500/20"
        />
        <StatsCard
          title="Expired Batches"
          value={isSummaryLoading ? '...' : summary?.expiryCount ?? 0}
          description="Expired/Expiring soon entries"
          icon={AlertCircle}
          iconColor="text-rose-600 dark:text-rose-400"
          bgColor="bg-rose-500/10 border border-rose-500/20"
        />
      </div>

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <CardTitle>Sales Revenue (Last 30 Days)</CardTitle>
            </div>
            <CardDescription>Daily gross sales and financial performance logs</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {!mounted || isChartLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Loading sales graphs...</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No sales transactions registered in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, #0f172a)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-primary, #0f172a)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) =>
                      new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    }
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Alerts Widget */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-rose-500" />
              <CardTitle>Expiry Action Board</CardTitle>
            </div>
            <CardDescription>Stock batches expiring within the next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[19.5rem]">
            {expiringSoonItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-sm text-muted-foreground">
                <p>No urgent product expiries detected.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expiringSoonItems.map((item) => {
                  const daysLeft = Math.ceil(
                    (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-foreground block">{item.product?.name}</span>
                        <span className="text-[10px] text-muted-foreground block font-mono">SKU: {item.product?.SKU}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-primary block">{item.quantity} units</span>
                        <Badge variant={daysLeft <= 2 ? 'destructive' : 'warning'} className="text-[9px] px-1.5 py-0">
                          {daysLeft <= 0 ? 'Expired' : `${daysLeft} days left`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Stock Alert Log Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-md font-bold">Low Stock Warning Board</CardTitle>
              <CardDescription>Items with quantities at or below threshold levels</CardDescription>
            </div>
            <Link href="/products" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                All inventory products maintain healthy counts.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-2">Item</TableHead>
                    <TableHead className="font-semibold text-xs text-center py-2">In Stock</TableHead>
                    <TableHead className="font-semibold text-xs text-center py-2">Min Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/10">
                      <TableCell className="py-2">
                        <span className="font-medium text-xs block">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{p.SKU}</span>
                      </TableCell>
                      <TableCell className="text-center py-2 font-bold text-rose-600 text-xs">
                        {p.totalStock ?? 0} {p.unit}
                      </TableCell>
                      <TableCell className="text-center py-2 text-muted-foreground text-xs">
                        {p.minimumStockLevel} {p.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Expiry Tracking Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-md font-bold">Soon to Expire Batch Inventory</CardTitle>
              <CardDescription>Deliveries nearing deadline dates</CardDescription>
            </div>
            <Link href="/expiry-tracking" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              Tracking Portal <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent>
            {expiringSoonItems.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No active delivery batches nearing expiry.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-2">Product Name</TableHead>
                    <TableHead className="font-semibold text-xs text-center py-2">Expiry Date</TableHead>
                    <TableHead className="font-semibold text-xs text-right py-2">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringSoonItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/10">
                      <TableCell className="py-2 font-medium text-xs">
                        {item.product?.name}
                      </TableCell>
                      <TableCell className="text-center py-2 text-xs">
                        {new Date(item.expiryDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right py-2 font-bold text-xs">
                        {item.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
