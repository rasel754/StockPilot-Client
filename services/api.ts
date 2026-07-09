import apiClient from '@/lib/api-client';
import {
  ApiResponse,
  User,
  Business,
  Category,
  Product,
  StockEntry,
  Sale,
  Notification,
  DashboardSummary,
  SalesReportItem,
  InventoryReportItem,
} from '@/types';

// ==========================================
// 🔐 Auth Service
// ==========================================
export const authService = {
  register: async (payload: any) => {
    const response = await apiClient.post<ApiResponse<{ user: User; business: Business }>>('/auth/register', payload);
    return response.data;
  },
  login: async (payload: any) => {
    const response = await apiClient.post<
      ApiResponse<{ accessToken: string; refreshToken: string; user: User }>
    >('/auth/login', payload);
    return response.data;
  },
  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken });
    return response.data;
  },
};

// ==========================================
// 👥 Users Service
// ==========================================
export const userService = {
  getUsers: async () => {
    const response = await apiClient.get<ApiResponse<User[]>>('/users');
    return response.data;
  },
  updateUser: async (id: string, payload: { role?: string; name?: string }) => {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, payload);
    return response.data;
  },
};

// ==========================================
// 🏢 Business Service
// ==========================================
export const businessService = {
  getBusiness: async () => {
    const response = await apiClient.get<ApiResponse<Business>>('/business');
    return response.data;
  },
};

// ==========================================
// 🗂️ Categories Service
// ==========================================
export const categoryService = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  },
  create: async (payload: { name: string; description?: string }) => {
    const response = await apiClient.post<ApiResponse<Category>>('/categories', payload);
    return response.data;
  },
  update: async (id: string, payload: { name: string; description?: string }) => {
    const response = await apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/categories/${id}`);
    return response.data;
  },
};

// ==========================================
// 📦 Products Service
// ==========================================
export const productService = {
  getAll: async (params?: { searchTerm?: string; categoryId?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },
  create: async (payload: {
    name: string;
    SKU: string;
    categoryId: string;
    unit: string;
    minimumStockLevel: number;
  }) => {
    const response = await apiClient.post<ApiResponse<Product>>('/products', payload);
    return response.data;
  },
  update: async (
    id: string,
    payload: Partial<{
      name: string;
      SKU: string;
      categoryId: string;
      unit: string;
      minimumStockLevel: number;
    }>
  ) => {
    const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/products/${id}`);
    return response.data;
  },
};

// ==========================================
// 📥 Stock Entries Service
// ==========================================
export const stockService = {
  getAll: async (params?: { productId?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<ApiResponse<StockEntry[]>>('/stock-entries', { params });
    return response.data;
  },
  create: async (payload: {
    productId: string;
    quantity: number;
    purchasePrice: number;
    expiryDate: string;
    supplierName?: string;
  }) => {
    const response = await apiClient.post<ApiResponse<StockEntry>>('/stock-entries', payload);
    return response.data;
  },
  deleteExpired: async () => {
    const response = await apiClient.delete<ApiResponse<{ acknowledged: boolean; deletedCount: number }>>(
      '/stock-entries/expired'
    );
    return response.data;
  },
  bulkUpload: async (csvContent: string) => {
    const response = await apiClient.post<
      ApiResponse<Array<{ productName: string; SKU: string; quantity: number; purchasePrice: number; expiryDate: string }>>
    >('/stock-entries/bulk-upload', { csv: csvContent });
    return response.data;
  },
};

// ==========================================
// 💸 Sales Service
// ==========================================
export const salesService = {
  getAll: async (params?: { productId?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<ApiResponse<Sale[]>>('/sales', { params });
    return response.data;
  },
  create: async (payload: { productId: string; quantitySold: number; sellingPrice: number; date: string }) => {
    const response = await apiClient.post<ApiResponse<Sale>>('/sales', payload);
    return response.data;
  },
};

// ==========================================
// ⏰ Expiry Alerts Service
// ==========================================
export const expiryService = {
  getExpired: async () => {
    const response = await apiClient.get<ApiResponse<StockEntry[]>>('/expiry/expired');
    return response.data;
  },
  getExpiringSoon: async (days: number = 7) => {
    const response = await apiClient.get<ApiResponse<StockEntry[]>>(`/expiry/soon`, { params: { days } });
    return response.data;
  },
};

// ==========================================
// 📊 Dashboard Service
// ==========================================
export const dashboardService = {
  getSummary: async () => {
    const response = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return response.data;
  },
};

// ==========================================
// 📈 Reports Service
// ==========================================
export const reportsService = {
  getSalesReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get<ApiResponse<{
      totalSalesCount: number;
      totalRevenue: number;
      sales: any[];
    }>>('/reports/sales', {
      params: { startDate, endDate },
    });

    const backendData = response.data?.data;
    if (!backendData || !Array.isArray(backendData.sales)) {
      return {
        ...response.data,
        data: [] as SalesReportItem[],
      } as unknown as ApiResponse<SalesReportItem[]>;
    }

    const salesGrouped: Record<string, { totalSales: number; totalRevenue: number; totalProfit: number }> = {};

    backendData.sales.forEach((sale) => {
      const dateStr = sale.date ? new Date(sale.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const revenue = (sale.quantitySold || 0) * (sale.sellingPrice || 0);
      const profit = revenue * 0.30;

      if (!salesGrouped[dateStr]) {
        salesGrouped[dateStr] = {
          totalSales: 0,
          totalRevenue: 0,
          totalProfit: 0,
        };
      }

      salesGrouped[dateStr].totalSales += 1;
      salesGrouped[dateStr].totalRevenue += revenue;
      salesGrouped[dateStr].totalProfit += profit;
    });

    const reportItems: SalesReportItem[] = Object.entries(salesGrouped).map(([date, metrics]) => ({
      date,
      totalSales: metrics.totalSales,
      totalRevenue: metrics.totalRevenue,
      totalProfit: metrics.totalProfit,
    }));

    reportItems.sort((a, b) => a.date.localeCompare(b.date));

    return {
      ...response.data,
      data: reportItems,
    } as unknown as ApiResponse<SalesReportItem[]>;
  },
  getInventoryReport: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/reports/inventory');
    const items = response.data?.data;
    if (!Array.isArray(items)) {
      return response.data as unknown as ApiResponse<InventoryReportItem[]>;
    }

    const mappedItems: InventoryReportItem[] = items.map((item) => ({
      id: item.id || item._id,
      name: item.name,
      SKU: item.SKU,
      currentStock: item.totalStock ?? 0,
      valuation: item.stockValuation ?? 0,
    }));

    return {
      ...response.data,
      data: mappedItems,
    } as unknown as ApiResponse<InventoryReportItem[]>;
  },
};

// ==========================================
// 🔔 Notifications Service
// ==========================================
export const notificationsService = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Notification[]>>('/notifications');
    return response.data;
  },
  markRead: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data;
  },
};
