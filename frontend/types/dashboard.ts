import type { ProductColor } from "@/lib/products";
import type { SizeScaleId } from "@/lib/sizes";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Which sizes products of this category offer */
  sizeScale: SizeScaleId;
  createdAt: number;
};

export type StockProduct = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  /** Same shape as the storefront: each colour owns its photos (first = cover). */
  colors: ProductColor[];
  price: number;
  oldPrice?: number;
  /** Purchase cost, used to estimate profit */
  cost: number;
  stock: number;
  /** Stock at or under this value raises a low stock alert */
  lowStockAt: number;
  /** Sizes come from the size scale of the category */
  sizes: string[];
  active: boolean;
  createdAt: number;
};

export type AdminUser = {
  id: string;
  name: string;
  /** International format, e.g. +212612345678. This is the login. */
  phone: string;
  active: boolean;
  createdAt: number;
};

/** In-shop sales only: there is no online ordering. */
export type Sale = {
  id: string;
  at: number;
  productId: string;
  productName: string;
  categoryId: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  total: number;
  soldById: string;
  soldByName: string;
};

export type LogAction = "create" | "update" | "delete" | "sale" | "stock";
export type LogEntity = "product" | "category" | "admin" | "sale";

export type LogEntry = {
  id: string;
  at: number;
  actorId: string;
  actorName: string;
  action: LogAction;
  entity: LogEntity;
  entityId: string;
  summary: string;
};

export type DashboardData = {
  categories: Category[];
  products: StockProduct[];
  admins: AdminUser[];
  sales: Sale[];
  logs: LogEntry[];
};