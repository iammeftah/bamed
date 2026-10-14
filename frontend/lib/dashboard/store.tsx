"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import { normalizePhone } from "@/lib/auth/phone";
import { mocksEnabled } from "@/lib/config";
import { seedData } from "@/lib/dashboard/seed";
import { slugify } from "@/lib/dashboard/format";
import {
  formatMAD,
  products as sampleProducts,
  sampleCategories,
  type ProductColor,
} from "@/lib/products";
import { defaultScale, isScaleId, type SizeScaleId } from "@/lib/sizes";
import { adminService, errorMessage } from "@/services/admin.service";
import type {
  AdminUser,
  DashboardData,
  LogEntry,
  Sale,
  StockProduct,
} from "@/types/dashboard";

/**
 * Two modes:
 *  - Demo (mocksEnabled): every action edits local state saved in localStorage
 *    and writes a log entry.
 *  - Backend: every action calls the Laravel API through /api/admin/*, then
 *    reloads the data. The backend validates, enforces roles and writes the
 *    log entry itself (actor taken from the token).
 */

// v2: admins now use a phone (no email) and sales have no channel
const KEY = "bamed.dashboard.v2";
const NOT_READY = "Données non chargées.";

/** Demo mode only: photos are data URLs kept in localStorage, so keep them small. */
const MAX_IMAGE_CHARS = 1_200_000;

type Result = string | null; // null = success, string = error message

/** Actions may be synchronous (demo) or asynchronous (backend). */
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

type LogInput = Pick<LogEntry, "action" | "entity" | "entityId" | "summary">;

type Actions = {
  saveCategory: (i: CategoryInput) => ActionResult;
  deleteCategory: (id: string) => ActionResult;
  saveProduct: (i: StockProductInput) => ActionResult;
  deleteProduct: (id: string) => ActionResult;
  adjustStock: (id: string, delta: number, reason: string) => ActionResult;
  saveAdmin: (i: AdminInput) => ActionResult;
  deleteAdmin: (id: string) => ActionResult;
  recordSale: (i: SaleInput) => ActionResult;
  resetDemo: () => void;
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

/** Products saved before colours existed (they had a single "image"). */
type LegacyProduct = StockProduct & { image?: string };

/** Gives old saved products a "colors" list so every product has the same shape. */
function withColors(d: DashboardData): DashboardData {
  return {
    ...d,
    products: d.products.map((p) => {
      if (Array.isArray(p.colors)) return p;
      const { image, ...rest } = p as LegacyProduct;
      const sample = sampleProducts.find((s) => s.id === p.id);
      let colors: ProductColor[] = [];
      if (image?.startsWith("data:")) {
        colors = [
          {
            name: "Défaut",
            hex: "#8a8a8a",
            images: [{ src: image, alt: p.name }],
          },
        ];
      } else if (sample) {
        colors = sample.colors;
      }
      return { ...rest, colors };
    }),
  };
}

/** Categories saved before size scales existed get one (the sample one, or letters). */
function withScales(d: DashboardData): DashboardData {
  return {
    ...d,
    categories: d.categories.map((c) =>
      isScaleId(c.sizeScale)
        ? c
        : {
            ...c,
            sizeScale:
              sampleCategories.find((s) => s.id === c.id)?.sizeScale ??
              defaultScale,
          },
    ),
  };
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function nextSku(products: StockProduct[]) {
  const max = products.reduce((m, p) => {
    const n = Number(p.sku.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `BAM-${max + 1}`;
}

const activeAdmins = (list: AdminUser[]) =>
  list.filter((a) => a.active).length;

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [now, setNow] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const dataRef = useRef<DashboardData | null>(null);
  const actor = useRef({ id: "system", name: "Système" });

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    actor.current = user
      ? { id: user.id, name: user.name }
      : { id: "system", name: "Système" };
  }, [user]);

  /** Backend mode: fetch everything again. */
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

  // Load once: from the backend, or saved/demo data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!mocksEnabled) {
        try {
          const fresh = await adminService.loadAll();
          if (!cancelled) {
            setNow(Date.now());
            setData(fresh);
          }
        } catch (e) {
          if (!cancelled) setLoadError(errorMessage(e));
        }
        return;
      }

      let loaded: DashboardData | null = null;
      try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) loaded = JSON.parse(raw) as DashboardData;
      } catch {
        /* ignore */
      }
      if (!loaded || !Array.isArray(loaded.sales)) {
        loaded = seedData(Date.now());
      } else {
        loaded = withColors(withScales(loaded));
      }
      if (!cancelled) {
        setNow(Date.now());
        setData(loaded);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Demo mode only: save on every change
  useEffect(() => {
    if (!data || !mocksEnabled) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable */
    }
  }, [data]);

  const mutate = useCallback(
    (fn: (d: DashboardData) => DashboardData, log: LogInput) => {
      const entry: LogEntry = {
        id: uid(),
        at: Date.now(),
        actorId: actor.current.id,
        actorName: actor.current.name,
        ...log,
      };
      setData((d) => {
        if (!d) return d;
        const next = fn(d);
        return { ...next, logs: [entry, ...next.logs].slice(0, 500) };
      });
    },
    [],
  );

  const actions = useMemo<Actions>(() => {
    const saveCategory = (i: CategoryInput): Result => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const name = i.name.trim();
      if (!name) return "Le nom est obligatoire.";
      const slug = slugify(name);
      if (!slug) return "Le nom est invalide.";
      if (d.categories.some((c) => c.slug === slug && c.id !== i.id))
        return "Une catégorie porte déjà ce nom.";
      if (!isScaleId(i.sizeScale)) return "Choisissez une échelle de tailles.";
      const description = i.description.trim();
      if (i.id) {
        if (!d.categories.some((c) => c.id === i.id))
          return "Catégorie introuvable.";
        mutate(
          (dd) => ({
            ...dd,
            categories: dd.categories.map((c) =>
              c.id === i.id
                ? { ...c, name, slug, description, sizeScale: i.sizeScale }
                : c,
            ),
          }),
          {
            action: "update",
            entity: "category",
            entityId: i.id,
            summary: `Catégorie « ${name} » modifiée`,
          },
        );
      } else {
        const id = uid();
        const createdAt = Date.now();
        mutate(
          (dd) => ({
            ...dd,
            categories: [
              ...dd.categories,
              {
                id,
                name,
                slug,
                description,
                sizeScale: i.sizeScale,
                createdAt,
              },
            ],
          }),
          {
            action: "create",
            entity: "category",
            entityId: id,
            summary: `Catégorie « ${name} » créée`,
          },
        );
      }
      return null;
    };

    const deleteCategory = (id: string): Result => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const cat = d.categories.find((c) => c.id === id);
      if (!cat) return "Catégorie introuvable.";
      const used = d.products.filter((p) => p.categoryId === id).length;
      if (used > 0)
        return `Impossible : ${used} produit${used > 1 ? "s" : ""} utilise${used > 1 ? "nt" : ""} cette catégorie.`;
      mutate(
        (dd) => ({
          ...dd,
          categories: dd.categories.filter((c) => c.id !== id),
        }),
        {
          action: "delete",
          entity: "category",
          entityId: id,
          summary: `Catégorie « ${cat.name} » supprimée`,
        },
      );
      return null;
    };

    const saveProduct = (i: StockProductInput): Result => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const name = i.name.trim();
      if (!name) return "Le nom est obligatoire.";
      if (!d.categories.some((c) => c.id === i.categoryId))
        return "Choisissez une catégorie.";
      if (!Number.isFinite(i.price) || i.price <= 0)
        return "Le prix doit être supérieur à 0.";
      if (i.oldPrice !== undefined && !(i.oldPrice > i.price))
        return "L'ancien prix doit être supérieur au prix actuel.";
      if (!Number.isFinite(i.cost) || i.cost < 0)
        return "Le coût d'achat est invalide.";
      if (!Number.isInteger(i.stock) || i.stock < 0)
        return "Le stock doit être un entier positif.";
      if (!Number.isInteger(i.lowStockAt) || i.lowStockAt < 0)
        return "Le seuil d'alerte est invalide.";

      // Colours: a name is required, names are unique, each colour keeps its photos
      const seen = new Set<string>();
      const colors: ProductColor[] = [];
      for (const c of i.colors) {
        const colorName = c.name.trim();
        if (!colorName) return "Donnez un nom à chaque couleur.";
        const key = colorName.toLowerCase();
        if (seen.has(key)) return `La couleur « ${colorName} » existe déjà.`;
        seen.add(key);
        if (!/^#[0-9a-f]{6}$/i.test(c.hex))
          return `La teinte de « ${colorName} » est invalide.`;
        colors.push({
          name: colorName,
          hex: c.hex.toLowerCase(),
          images: c.images
            .filter((img) => img.src)
            .map((img, n) => ({
              src: img.src,
              alt: `${name}, ${colorName.toLowerCase()}, photo ${n + 1}`,
            })),
        });
      }
      const weight = colors.reduce(
        (s, c) => s + c.images.reduce((t, img) => t + img.src.length, 0),
        0,
      );
      if (weight > MAX_IMAGE_CHARS)
        return "Les photos sont trop lourdes pour le mode démo. Retirez-en quelques-unes.";

      const sku = i.sku.trim().toUpperCase() || nextSku(d.products);
      if (d.products.some((p) => p.sku === sku && p.id !== i.id))
        return "Ce SKU existe déjà.";

      const fields = {
        name,
        sku,
        categoryId: i.categoryId,
        colors,
        price: i.price,
        oldPrice: i.oldPrice,
        cost: i.cost,
        lowStockAt: i.lowStockAt,
        sizes: i.sizes,
        active: i.active,
      };

      if (i.id) {
        if (!d.products.some((p) => p.id === i.id))
          return "Produit introuvable.";
        mutate(
          (dd) => ({
            ...dd,
            // stock is never changed here, only through adjustStock / sales
            products: dd.products.map((p) =>
              p.id === i.id ? { ...p, ...fields } : p,
            ),
          }),
          {
            action: "update",
            entity: "product",
            entityId: i.id,
            summary: `Produit « ${name} » modifié`,
          },
        );
      } else {
        const id = uid();
        const createdAt = Date.now();
        mutate(
          (dd) => ({
            ...dd,
            products: [
              { id, ...fields, stock: i.stock, createdAt },
              ...dd.products,
            ],
          }),
          {
            action: "create",
            entity: "product",
            entityId: id,
            summary: `Produit « ${name} » créé (stock ${i.stock})`,
          },
        );
      }
      return null;
    };

    const deleteProduct = (id: string): Result => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const p = d.products.find((x) => x.id === id);
      if (!p) return "Produit introuvable.";
      mutate(
        (dd) => ({ ...dd, products: dd.products.filter((x) => x.id !== id) }),
        {
          action: "delete",
          entity: "product",
          entityId: id,
          summary: `Produit « ${p.name} » supprimé`,
        },
      );
      return null;
    };

    const adjustStock = (id: string, delta: number, reason: string): Result => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const p = d.products.find((x) => x.id === id);
      if (!p) return "Produit introuvable.";
      if (!Number.isInteger(delta) || delta === 0)
        return "Entrez un nombre entier différent de 0.";
      if (p.stock + delta < 0) return "Le stock ne peut pas être négatif.";
      const why = reason.trim();
      mutate(
        (dd) => ({
          ...dd,
          products: dd.products.map((x) =>
            x.id === id ? { ...x, stock: x.stock + delta } : x,
          ),
        }),
        {
          action: "stock",
          entity: "product",
          entityId: id,
          summary: `Stock « ${p.name} » : ${delta > 0 ? "+" : ""}${delta}${why ? ` (${why})` : ""}`,
        },
      );
      return null;
    };

    const saveAdmin = (i: AdminInput): Result => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const name = i.name.trim();
      const phone = normalizePhone(i.phone);
      if (!name) return "Le nom est obligatoire.";
      if (!phone) return "Numéro de téléphone invalide.";
      if (d.admins.some((a) => a.phone === phone && a.id !== i.id))
        return "Ce numéro est déjà utilisé.";

      if (i.id) {
        if (!d.admins.some((a) => a.id === i.id))
          return "Administrateur introuvable.";
        if (i.id === actor.current.id && !i.active)
          return "Vous ne pouvez pas désactiver votre propre compte.";
        const nextList = d.admins.map((a) =>
          a.id === i.id ? { ...a, name, phone, active: i.active } : a,
        );
        if (activeAdmins(nextList) < 1)
          return "Il doit rester au moins un administrateur actif.";
        mutate((dd) => ({ ...dd, admins: nextList }), {
          action: "update",
          entity: "admin",
          entityId: i.id,
          summary: `Administrateur « ${name} » modifié (${i.active ? "actif" : "désactivé"})`,
        });
      } else {
        const id = uid();
        const createdAt = Date.now();
        mutate(
          (dd) => ({
            ...dd,
            admins: [
              ...dd.admins,
              { id, name, phone, active: i.active, createdAt },
            ],
          }),
          {
            action: "create",
            entity: "admin",
            entityId: id,
            summary: `Administrateur « ${name} » créé`,
          },
        );
      }
      return null;
    };

    const deleteAdmin = (id: string): Result => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const a = d.admins.find((x) => x.id === id);
      if (!a) return "Administrateur introuvable.";
      if (id === actor.current.id)
        return "Vous ne pouvez pas supprimer votre propre compte.";
      if (activeAdmins(d.admins.filter((x) => x.id !== id)) < 1)
        return "Il doit rester au moins un administrateur actif.";
      mutate(
        (dd) => ({ ...dd, admins: dd.admins.filter((x) => x.id !== id) }),
        {
          action: "delete",
          entity: "admin",
          entityId: id,
          summary: `Administrateur « ${a.name} » supprimé`,
        },
      );
      return null;
    };

    const recordSale = (i: SaleInput): Result => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const p = d.products.find((x) => x.id === i.productId);
      if (!p || !p.active) return "Produit introuvable ou inactif.";
      if (!Number.isInteger(i.qty) || i.qty < 1)
        return "La quantité doit être d'au moins 1.";
      if (i.qty > p.stock) return `Stock insuffisant (${p.stock} disponible).`;
      const seller = d.admins.find((a) => a.id === i.soldById);
      if (!seller || !seller.active) return "Choisissez un vendeur actif.";

      const sale: Sale = {
        id: uid(),
        at: Date.now(),
        productId: p.id,
        productName: p.name,
        categoryId: p.categoryId,
        qty: i.qty,
        unitPrice: p.price,
        unitCost: p.cost,
        total: p.price * i.qty,
        soldById: seller.id,
        soldByName: seller.name,
      };
      mutate(
        (dd) => ({
          ...dd,
          sales: [sale, ...dd.sales],
          products: dd.products.map((x) =>
            x.id === p.id ? { ...x, stock: x.stock - i.qty } : x,
          ),
        }),
        {
          action: "sale",
          entity: "sale",
          entityId: sale.id,
          summary: `Vente : ${i.qty} × ${p.name} (${formatMAD(sale.total)}) par ${seller.name}`,
        },
      );
      return null;
    };

    // Backend mode: call the API, then reload everything
    if (!mocksEnabled) {
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
        resetDemo: () => {},
      };
    }

    const resetDemo = () => {
      setNow(Date.now());
      setData(seedData(Date.now()));
    };

    return {
      saveCategory,
      deleteCategory,
      saveProduct,
      deleteProduct,
      adjustStock,
      saveAdmin,
      deleteAdmin,
      recordSale,
      resetDemo,
    };
  }, [mutate, refresh]);

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