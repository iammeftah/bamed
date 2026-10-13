export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: number;
};

export type StockProduct = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  price: number;
  oldPrice?: number;
  /** Purchase cost, used to estimate profit */
  cost: number;
  stock: number;
  /** Stock at or under this value raises a low stock alert */
  lowStockAt: number;
  sizes: string[];
  active: boolean;
  createdAt: number;
};


export type AdminUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: number;
};

export type SaleChannel = "boutique" | "en-ligne";

/** Name, price and cost are copied at sale time, so history survives later edits and deletions. */
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
  channel: SaleChannel;
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