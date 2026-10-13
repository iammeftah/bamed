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
import { seedData } from "@/lib/dashboard/seed";
import { slugify } from "@/lib/dashboard/format";
import { formatMAD } from "@/lib/products";
import type {
  AdminUser,
  DashboardData,
  LogEntry,
  Sale,
  SaleChannel,
  StockProduct,
} from "@/types/dashboard";

/**
 * SINGLE SWAP POINT FOR THE BACKEND.
 * Today every action edits local state (saved in localStorage) and writes a log entry.
 * Later, each action becomes an API call. The backend must also:
 *  - check the role on every request (the checks here only hide buttons),
 *  - write the log entry itself, with the actor taken from the token.
 */

const KEY = "bamed.dashboard.v1";
const NOT_READY = "Données non chargées.";

type Result = string | null; // null = success, string = error message

export type CategoryInput = { id?: string; name: string; description: string };
export type StockProductInput = Omit<StockProduct, "id" | "createdAt"> & {
  id?: string;
};
export type AdminInput = {
  id?: string;
  name: string;
  email: string;
  active: boolean;
};
export type SaleInput = {
  productId: string;
  qty: number;
  soldById: string;
  channel: SaleChannel;
};

type LogInput = Pick<LogEntry, "action" | "entity" | "entityId" | "summary">;

type Actions = {
  saveCategory: (i: CategoryInput) => Result;
  deleteCategory: (id: string) => Result;
  saveProduct: (i: StockProductInput) => Result;
  deleteProduct: (id: string) => Result;
  adjustStock: (id: string, delta: number, reason: string) => Result;
  saveAdmin: (i: AdminInput) => Result;
  deleteAdmin: (id: string) => Result;
  recordSale: (i: SaleInput) => Result;
  resetDemo: () => void;
};

type Ctx = DashboardData &
  Actions & {
    ready: boolean;
    /** Time the data was loaded (kept in state so renders stay pure) */
    now: number;
    actorId: string | null;
  };

const DashboardCtx = createContext<Ctx | null>(null);

const empty: DashboardData = {
  categories: [],
  products: [],
  admins: [],
  sales: [],
  logs: [],
};

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

  // Load once: saved data, or demo data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      let loaded: DashboardData | null = null;
      try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) loaded = JSON.parse(raw) as DashboardData;
      } catch {
        /* ignore */
      }
      if (!loaded || !Array.isArray(loaded.sales)) {
        loaded = seedData(Date.now());
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

  // Save on every change
  useEffect(() => {
    if (!data) return;
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
    const saveCategory: Actions["saveCategory"] = (i) => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const name = i.name.trim();
      if (!name) return "Le nom est obligatoire.";
      const slug = slugify(name);
      if (!slug) return "Le nom est invalide.";
      if (d.categories.some((c) => c.slug === slug && c.id !== i.id))
        return "Une catégorie porte déjà ce nom.";
      const description = i.description.trim();
      if (i.id) {
        if (!d.categories.some((c) => c.id === i.id))
          return "Catégorie introuvable.";
        mutate(
          (dd) => ({
            ...dd,
            categories: dd.categories.map((c) =>
              c.id === i.id ? { ...c, name, slug, description } : c,
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
              { id, name, slug, description, createdAt },
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

    const deleteCategory: Actions["deleteCategory"] = (id) => {
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

    const saveProduct: Actions["saveProduct"] = (i) => {
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
      const sku = i.sku.trim().toUpperCase() || nextSku(d.products);
      if (d.products.some((p) => p.sku === sku && p.id !== i.id))
        return "Ce SKU existe déjà.";

      const fields = {
        name,
        sku,
        categoryId: i.categoryId,
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

    const deleteProduct: Actions["deleteProduct"] = (id) => {
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

    const adjustStock: Actions["adjustStock"] = (id, delta, reason) => {
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

    const saveAdmin: Actions["saveAdmin"] = (i) => {
      const d = dataRef.current;
      if (!d) return NOT_READY;
      const name = i.name.trim();
      const email = i.email.trim().toLowerCase();
      if (!name) return "Le nom est obligatoire.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return "Adresse e-mail invalide.";
      if (d.admins.some((a) => a.email === email && a.id !== i.id))
        return "Cette adresse e-mail est déjà utilisée.";

      if (i.id) {
        if (!d.admins.some((a) => a.id === i.id))
          return "Administrateur introuvable.";
        if (i.id === actor.current.id && !i.active)
          return "Vous ne pouvez pas désactiver votre propre compte.";
        const nextList = d.admins.map((a) =>
          a.id === i.id ? { ...a, name, email, active: i.active } : a,
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
              { id, name, email, active: i.active, createdAt },
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

    const deleteAdmin: Actions["deleteAdmin"] = (id) => {
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

    const recordSale: Actions["recordSale"] = (i) => {
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
        channel: i.channel,
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
  }, [mutate]);


     const value = useMemo<Ctx>(
     () => ({
       ...(data ?? empty),
       ...actions,
       ready: data !== null,
       now,
       actorId: user?.id ?? null,
     }),
     [data, actions, now, user?.id],
   );

  return <DashboardCtx.Provider value={value}>{children}</DashboardCtx.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardCtx);
  if (!ctx)
    throw new Error("useDashboard doit être utilisé dans <DashboardProvider>.");
  return ctx;
}