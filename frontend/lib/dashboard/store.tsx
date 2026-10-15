"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import type { SizeScaleId } from "@/lib/sizes";
import { adminService, errorMessage } from "@/services/admin.service";
import type { DashboardData, StockProduct } from "@/types/dashboard";

/**
 * Every action calls the Laravel API through /api/admin/*, then reloads the data.
 * The backend validates, enforces roles and writes the log entry itself
 * (actor taken from the token). There is no local or demo data.
 */

type Result = string | null; // null = success, string = error message

/** Actions are asynchronous: they resolve to null (success) or an error message. */
export type ActionResult = Result | Promise<Result>;

export type CategoryInput = {
  id?: string;
  name: string;
  description: string;
  sizeScale: SizeScaleId;
};
export type StockProductInput = Omit<StockProduct, "id" | "createdAt"> & {
  id?: string;
};
export type AdminInput = {
  id?: string;
  name: string;
  phone: string;
  active: boolean;
};
export type SaleInput = {
  productId: string;
  qty: number;
  soldById: string;
};

type Actions = {
  saveCategory: (i: CategoryInput) => ActionResult;
  deleteCategory: (id: string) => ActionResult;
  saveProduct: (i: StockProductInput) => ActionResult;
  deleteProduct: (id: string) => ActionResult;
  adjustStock: (id: string, delta: number, reason: string) => ActionResult;
  saveAdmin: (i: AdminInput) => ActionResult;
  deleteAdmin: (id: string) => ActionResult;
  recordSale: (i: SaleInput) => ActionResult;
};

type Ctx = DashboardData &
  Actions & {
    ready: boolean;
    /** Time the data was loaded (kept in state so renders stay pure) */
    now: number;
    actorId: string | null;
    /** Message shown when the backend data could not be loaded */
    loadError: string | null;
    reload: () => void;
  };

const DashboardCtx = createContext<Ctx | null>(null);

const empty: DashboardData = {
  categories: [],
  products: [],
  admins: [],
  sales: [],
  logs: [],
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [now, setNow] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Fetch everything again. */
  const refresh = useCallback(async () => {
    const fresh = await adminService.loadAll();
    setNow(Date.now());
    setData(fresh);
  }, []);

  /** Called by the "Réessayer" button after a failed load. */
  const reload = useCallback(() => {
    setLoadError(null);
    refresh().catch((e) => setLoadError(errorMessage(e)));
  }, [refresh]);

  // Load once
  useEffect(() => {
    let cancelled = false;
    adminService
      .loadAll()
      .then((fresh) => {
        if (cancelled) return;
        setNow(Date.now());
        setData(fresh);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const actions = useMemo<Actions>(() => {
    const run = async (fn: () => Promise<unknown>): Promise<Result> => {
      try {
        await fn();
      } catch (e) {
        return errorMessage(e);
      }
      try {
        // the backend wrote the log entry, so reload all lists
        await refresh();
      } catch {
        /* saved; the lists update on the next load */
      }
      return null;
    };

    return {
      saveCategory: (i) => run(() => adminService.saveCategory(i)),
      deleteCategory: (id) => run(() => adminService.deleteCategory(id)),
      saveProduct: (i) => run(() => adminService.saveProduct(i)),
      deleteProduct: (id) => run(() => adminService.deleteProduct(id)),
      adjustStock: (id, delta, reason) =>
        run(() => adminService.adjustStock(id, delta, reason)),
      saveAdmin: (i) => run(() => adminService.saveAdmin(i)),
      deleteAdmin: (id) => run(() => adminService.deleteAdmin(id)),
      recordSale: (i) => run(() => adminService.recordSale(i)),
    };
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({
      ...(data ?? empty),
      ...actions,
      ready: data !== null,
      now,
      actorId: user?.id ?? null,
      loadError,
      reload,
    }),
    [data, actions, now, user?.id, loadError, reload],
  );

  return <DashboardCtx.Provider value={value}>{children}</DashboardCtx.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardCtx);
  if (!ctx)
    throw new Error("useDashboard doit être utilisé dans <DashboardProvider>.");
  return ctx;
}