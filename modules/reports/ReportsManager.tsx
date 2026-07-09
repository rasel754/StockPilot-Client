'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/api';
import { showToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, Calendar, Download, Loader2, DollarSign } from 'lucide-react';

export default function ReportsManager() {
  const [mounted, setMounted] = useState(false);

  // Set default dates: last 30 days
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultStartStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStartStr);
  const [endDate, setEndDate] = useState(todayStr);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Sales Report
  const { data: salesRes, isLoading: isSalesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['reports-sales', startDate, endDate],
    queryFn: () => reportsService.getSalesReport(startDate, endDate),
    enabled: mounted,
  });
  const salesData = salesRes?.data || [];

  // 2. Fetch Inventory Report
  const { data: invRes, isLoading: isInvLoading } = useQuery({
    queryKey: ['reports-inventory'],
    queryFn: () => reportsService.getInventoryReport(),
    enabled: mounted,
  });
  const inventoryData = invRes?.data || [];

  const handleFetchReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
      showToast.error('Start date cannot be after end date.');
      return;
    }
    refetchSales();
  };

  // Export Sales Report to CSV
  const handleExportSalesCsv = () => {
    if (salesData.length === 0) {
      showToast.warning('No sales data to export.');
      return;
    }
    const headers = 'Date,Total Transactions,Revenue,Estimated Profit\n';
    const rows = salesData
      .map((item) => `${item.date},${item.totalSales},${item.totalRevenue.toFixed(2)},${item.totalProfit.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `sales_report_${startDate}_to_${endDate}.csv`);
    a.click();
    showToast.success('Sales report exported to CSV!');
  };

  // Export Inventory Valuation to CSV
  const handleExportInventoryCsv = () => {
    if (inventoryData.length === 0) {
      showToast.warning('No inventory data to export.');
      return;
    }
    const headers = 'Product Name,SKU,In Stock,Valuation ($)\n';
    const rows = inventoryData
      .map((item) => `"${item.name}",${item.SKU},${item.currentStock},${item.valuation.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `inventory_valuation_report.csv`);
    a.click();
    showToast.success('Inventory valuation report exported to CSV!');
  };

  // Calculations
  const totalRevenueSum = salesData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalProfitSum = salesData.reduce((sum, item) => sum + item.totalProfit, 0);
  const totalStockValuation = inventoryData.reduce((sum, item) => sum + item.valuation, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Operational Reports</h1>
        <p className="text-sm text-muted-foreground">Analyze financial records, sales metrics, and catalog valuation breakdown</p>
      </div>

      {/* Grid: Sales Date Filter & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Date Filter Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <CardTitle className="text-base">Date Range Selector</CardTitle>
            </div>
            <CardDescription>Filter sales records by timeframes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFetchReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button type="submit" className="w-full flex items-center justify-center gap-2">
                Generate Sales Report
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Dynamic Financial Overview Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-500" />
              <CardTitle className="text-base">Financial Statement Summary</CardTitle>
            </div>
            <CardDescription>Overview of generated sales and assets value</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Period Revenue</span>
              <span className="text-xl font-extrabold text-foreground block">${totalRevenueSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-muted-foreground block">Gross billing logs</span>
            </div>
            <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Period Net Profit</span>
              <span className="text-xl font-extrabold text-emerald-600 block">${totalProfitSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-muted-foreground block">Gross minus purchase cost</span>
            </div>
            <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Total Asset Value</span>
              <span className="text-xl font-extrabold text-primary block">${totalStockValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-muted-foreground block">Valued active stock</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart & Sales Log Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Sales Chart */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
            <div>
              <CardTitle className="text-md">Gross Financial Chart</CardTitle>
              <CardDescription>Visual trend of gross revenue and net profit</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportSalesCsv} className="flex items-center gap-1.5 self-start sm:self-auto">
              <Download size={14} /> Export CSV
            </Button>
          </CardHeader>
          <CardContent className="h-80 pt-6">
            {!mounted || isSalesLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Calculating sales metrics...</span>
              </div>
            ) : salesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No financial records recorded for this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" name="Revenue ($)" dataKey="totalRevenue" stroke="var(--primary)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Net Profit ($)" dataKey="totalProfit" stroke="#10b981" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Detailed Sales Data Grid */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-md">Period Sales Ledger</CardTitle>
            <CardDescription>Daily performance details for generated period</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[19.5rem] pt-4">
            {isSalesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary mr-2" size={24} />
                <span className="text-xs text-muted-foreground">Gathering ledger data...</span>
              </div>
            ) : salesData.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No ledger rows found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-2">Date</TableHead>
                    <TableHead className="font-semibold text-xs text-center py-2">Sales Count</TableHead>
                    <TableHead className="font-semibold text-xs text-right py-2">Revenue</TableHead>
                    <TableHead className="font-semibold text-xs text-right py-2">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.map((item) => (
                    <TableRow key={item.date} className="hover:bg-muted/10">
                      <TableCell className="py-2 text-xs">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-center py-2 text-xs font-semibold">{item.totalSales}</TableCell>
                      <TableCell className="text-right py-2 text-xs font-bold">${item.totalRevenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right py-2 text-xs font-bold text-emerald-600">${item.totalProfit.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Valuation Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Inventory Report Valuation List */}
        <Card className="xl:col-span-2 flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
            <div>
              <CardTitle className="text-md">Inventory Assets Valuation</CardTitle>
              <CardDescription>Individual product stock counts and calculated cost assets value</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportInventoryCsv} className="flex items-center gap-1.5 self-start sm:self-auto">
              <Download size={14} /> Export CSV
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[22rem] pt-4">
            {isInvLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary mr-2" size={24} />
                <span className="text-xs text-muted-foreground">Calculating asset matrix...</span>
              </div>
            ) : inventoryData.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No active inventory assets found. Record incoming deliveries.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs">Product Name</TableHead>
                    <TableHead className="font-semibold text-xs">SKU</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Current Stock</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Valuation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/10">
                      <TableCell className="font-semibold py-2.5 text-xs">{item.name}</TableCell>
                      <TableCell className="font-mono text-[10px]">{item.SKU}</TableCell>
                      <TableCell className="text-center py-2.5 text-xs font-bold">{item.currentStock}</TableCell>
                      <TableCell className="text-right py-2.5 text-xs font-extrabold text-primary">${item.valuation.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Valuation Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              <CardTitle className="text-md">Valuation Breakdown</CardTitle>
            </div>
            <CardDescription>Top assets valuation comparison chart</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 h-80 min-h-[16.5rem]">
            {!mounted || isInvLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Generating graphs...</span>
              </div>
            ) : inventoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No items to evaluate.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="SKU"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: '10px', fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Valuation']}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)',
                    }}
                  />
                  <Bar dataKey="valuation" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
