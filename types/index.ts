export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  businessId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  SKU: string;
  categoryId: string;
  unit: string;
  minimumStockLevel: number;
  totalStock?: number;
  category?: {
    id: string;
    name: string;
  };
  businessId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockEntry {
  id: string;
  productId: string;
  quantity: number;
  purchasePrice: number;
  expiryDate: string;
  supplierName?: string;
  product?: {
    id: string;
    name: string;
    SKU: string;
  };
  businessId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
  id: string;
  productId: string;
  quantitySold: number;
  sellingPrice: number;
  date: string;
  product?: {
    id: string;
    name: string;
    SKU: string;
  };
  businessId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'LOW_STOCK' | 'EXPIRY' | 'INFO';
  isRead: boolean;
  businessId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  expiryCount: number;
}

export interface SalesReportItem {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface InventoryReportItem {
  id: string;
  name: string;
  SKU: string;
  currentStock: number;
  valuation: number;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
}
