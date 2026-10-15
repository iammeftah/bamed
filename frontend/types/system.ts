export type Level = "danger" | "warning" | "info";

export type RouteStat = {
  method: string;
  route: string;
  count: number;
  avgMs: number;
  errors: number;
};

export type ErrorEntry = {
  id: string;
  at: number;
  class: string;
  message: string;
  location: string;
  method: string | null;
  path: string | null;
  trace: string;
};

export type TeamMember = {
  id: string;
  name: string;
  phone: string;
  role: "admin" | "super_admin";
  active: boolean;
  sessions: number;
  lastSeen: number | null;
};

export type SystemOverview = {
  generatedAt: number;
  hours: number;
  health: {
    app: {
      name: string;
      env: string;
      debug: boolean;
      laravel: string;
      php: string;
      timezone: string;
      url: string;
    };
    database: {
      ok: boolean;
      driver: string;
      latencyMs: number;
      sizeBytes: number | null;
    };
    cache: { ok: boolean; driver: string };
    queue: { driver: string; pending: number; failed: number };
    disk: {
      freeBytes: number | null;
      totalBytes: number | null;
      storageLinked: boolean;
      writable: boolean;
    };
  };
  problems: { level: Level; message: string }[];
  traffic: {
    total: number;
    ok: number;
    clientErrors: number;
    serverErrors: number;
    avgMs: number;
    p95Ms: number;
    uniqueIps: number;
    series: { at: number; requests: number; errors: number }[];
    topRoutes: RouteStat[];
    slowest: RouteStat[];
  };
  security: {
    successfulLogins: number;
    failedLogins: number;
    rateLimited: number;
    deactivated: number;
    adminDenied: number;
    byIp: { ip: string; count: number; lastAt: number }[];
  };
  errors: { last24h: number; total: number; recent: ErrorEntry[] };
  storage: { files: number; bytes: number; orphans: number; orphanBytes: number };
  business: {
    categories: number;
    products: number;
    activeProducts: number;
    outOfStock: number;
    lowStock: number;
    sales24h: number;
    revenue24h: number;
    salesTotal: number;
  };
  team: TeamMember[];
};