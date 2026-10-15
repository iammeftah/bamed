/**
 * Dashboard API. Browser only: every call goes through /api/admin/*,
 * which adds the token and forwards to Laravel /admin/*.
 *
 * It reads both camelCase and snake_case keys, so small naming differences
 * on the backend do not break the dashboard.
 */
import { ApiError, apiFetch } from "@/lib/api/client";
import type { ProductColor, ProductImage } from "@/lib/products";
import { defaultScale, isScaleId } from "@/lib/sizes";
import type {
  AdminInput,
  CategoryInput,
  SaleInput,
  StockProductInput,
} from "@/lib/dashboard/store";
import type {
  AdminUser,
  Category,
  DashboardData,
  LogAction,
  LogEntity,
  LogEntry,
  Sale,
  StockProduct,
} from "@/types/dashboard";

type Raw = Record<string, unknown>;

const get = (r: Raw, ...keys: string[]): unknown => {
  for (const k of keys) if (r[k] !== undefined && r[k] !== null) return r[k];
  return undefined;
};
const text = (v: unknown, d = "") => (v == null ? d : String(v));
const num = (v: unknown, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const time = (v: unknown) =>
  typeof v === "number" ? v : v ? Date.parse(String(v)) || 0 : 0;

/** Accepts [..], { data: [..] }, { items: [..] } or { content: [..] }. */
function list(res: unknown): Raw[] {
  if (Array.isArray(res)) return res as Raw[];
  if (res && typeof res === "object") {
    const r = res as Raw;
    for (const k of ["data", "items", "content"]) {
      if (Array.isArray(r[k])) return r[k] as Raw[];
    }
  }
  return [];
}

function toImages(v: unknown, alt: string): ProductImage[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((i) =>
      typeof i === "string"
        ? { src: i, alt }
        : {
            src: text((i as Raw).src ?? (i as Raw).url),
            alt: text((i as Raw).alt, alt),
          },
    )
    .filter((i) => i.src);
}

function toColors(v: unknown, productName: string): ProductColor[] {
  if (!Array.isArray(v)) return [];
  return v.map((c) => {
    const r = c as Raw;
    const name = text(r.name);
    return {
      name,
      hex: text(r.hex, "#8a8a8a"),
      images: toImages(r.images, `${productName}, ${name}`),
    };
  });
}

function toCategory(r: Raw): Category {
  const name = text(get(r, "name", "label"));
  const scale = get(r, "sizeScale", "size_scale");
  return {
    id: text(r.id),
    name,
    slug: text(r.slug, text(r.id)),
    description: text(r.description),
    sizeScale: isScaleId(scale) ? scale : defaultScale,
    createdAt: time(get(r, "createdAt", "created_at")),
  };
}

function toProduct(r: Raw): StockProduct {
  const name = text(r.name);
  const old = get(r, "oldPrice", "old_price");
  return {
    id: text(r.id),
    sku: text(r.sku),
    name,
    categoryId: text(get(r, "categoryId", "category_id", "type")),
    colors: toColors(r.colors, name),
    price: num(r.price),
    oldPrice: old != null ? num(old) : undefined,
    cost: num(r.cost),
    stock: num(r.stock),
    lowStockAt: num(get(r, "lowStockAt", "low_stock_at"), 10),
    sizes: Array.isArray(r.sizes) ? r.sizes.map(String) : [],
    active: r.active === undefined ? true : Boolean(r.active),
    createdAt: time(get(r, "createdAt", "created_at")),
  };
}

function toAdmin(r: Raw): AdminUser {
  return {
    id: text(r.id),
    name: text(r.name),
    phone: text(r.phone),
    active: r.active === undefined ? true : Boolean(r.active),
    createdAt: time(get(r, "createdAt", "created_at")),
  };
}

function toSale(r: Raw): Sale {
  return {
    id: text(r.id),
    at: time(get(r, "at", "soldAt", "sold_at", "createdAt", "created_at")),
    productId: text(get(r, "productId", "product_id")),
    productName: text(get(r, "productName", "product_name")),
    categoryId: text(get(r, "categoryId", "category_id")),
    qty: num(r.qty),
    unitPrice: num(get(r, "unitPrice", "unit_price")),
    unitCost: num(get(r, "unitCost", "unit_cost")),
    total: num(r.total),
    soldById: text(get(r, "soldById", "sold_by_id")),
    soldByName: text(get(r, "soldByName", "sold_by_name")),
  };
}

function toLog(r: Raw): LogEntry {
  return {
    id: text(r.id),
    at: time(get(r, "at", "createdAt", "created_at")),
    actorId: text(get(r, "actorId", "actor_id")),
    actorName: text(get(r, "actorName", "actor_name")),
    action: text(r.action) as LogAction,
    entity: text(r.entity) as LogEntity,
    entityId: text(get(r, "entityId", "entity_id")),
    summary: text(r.summary),
  };
}

/** One readable message for a failed call (first field error, else the message). */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const first = e.fieldErrors && Object.values(e.fieldErrors)[0];
    return first || e.message;
  }
  return "Une erreur est survenue. Réessayez.";
}

const page = { per_page: 500, size: 500 };
const call = { auth: true } as const;
const enc = encodeURIComponent;

/** Uploads one photo and returns its public URL. */
async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch<Raw>("/uploads", {
    ...call,
    method: "POST",
    body: form,
  });
  const inner = (res.data ?? res) as Raw;
  const url = text(get(inner, "url", "src", "path"));
  if (!url) throw new ApiError(502, "Réponse d'envoi invalide.");
  return url;
}

/** The product form keeps new photos as data URLs (for the preview). */
async function dataUrlToFile(src: string): Promise<File> {
  const blob = await (await fetch(src)).blob();
  const ext =
    blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `photo.${ext}`, { type: blob.type || "image/jpeg" });
}

/** Sends new photos to the backend and swaps their data URL for the public URL. */
async function resolveColors(
  productName: string,
  colors: ProductColor[],
): Promise<ProductColor[]> {
  const out: ProductColor[] = [];
  for (const c of colors) {
    const images: ProductImage[] = [];
    for (const [n, img] of c.images.entries()) {
      const src = img.src.startsWith("data:")
        ? await uploadImage(await dataUrlToFile(img.src))
        : img.src;
      images.push({
        src,
        alt:
          img.alt ||
          `${productName}, ${c.name.trim().toLowerCase()}, photo ${n + 1}`,
      });
    }
    out.push({ name: c.name.trim(), hex: c.hex.toLowerCase(), images });
  }
  return out;
}

export const adminService = {
  async loadAll(): Promise<DashboardData> {
    const [c, p, a, s, l] = await Promise.all([
      apiFetch<unknown>("/categories", { ...call, query: page }),
      apiFetch<unknown>("/products", { ...call, query: page }),
      apiFetch<unknown>("/admins", { ...call, query: page }),
      apiFetch<unknown>("/sales", { ...call, query: page }),
      apiFetch<unknown>("/logs", { ...call, query: page }),
    ]);
    return {
      categories: list(c).map(toCategory),
      products: list(p).map(toProduct),
      admins: list(a).map(toAdmin),
      sales: list(s).map(toSale).sort((x, y) => y.at - x.at),
      logs: list(l).map(toLog).sort((x, y) => y.at - x.at),
    };
  },

  async saveCategory(i: CategoryInput) {
    const body = {
      name: i.name.trim(),
      description: i.description.trim(),
      sizeScale: i.sizeScale,
    };
    if (i.id) {
      await apiFetch(`/categories/${enc(i.id)}`, {
        ...call,
        method: "PUT",
        body,
      });
    } else {
      await apiFetch("/categories", { ...call, method: "POST", body });
    }
  },

  async deleteCategory(id: string) {
    await apiFetch(`/categories/${enc(id)}`, { ...call, method: "DELETE" });
  },

  async saveProduct(i: StockProductInput) {
    const name = i.name.trim();
    const colors = await resolveColors(name, i.colors);
    const body = {
      name,
      sku: i.sku.trim() || null,
      categoryId: i.categoryId,
      colors,
      price: i.price,
      oldPrice: i.oldPrice ?? null,
      cost: i.cost,
      lowStockAt: i.lowStockAt,
      sizes: i.sizes,
      active: i.active,
    };
    if (i.id) {
      // stock is only changed through adjustStock and sales
      await apiFetch(`/products/${enc(i.id)}`, {
        ...call,
        method: "PUT",
        body,
      });
    } else {
      await apiFetch("/products", {
        ...call,
        method: "POST",
        body: { ...body, stock: i.stock },
      });
    }
  },

  async deleteProduct(id: string) {
    await apiFetch(`/products/${enc(id)}`, { ...call, method: "DELETE" });
  },

  async adjustStock(id: string, delta: number, reason: string) {
    await apiFetch(`/products/${enc(id)}/stock`, {
      ...call,
      method: "POST",
      body: { delta, reason: reason.trim() || null },
    });
  },

  async saveAdmin(i: AdminInput) {
    const body = { name: i.name.trim(), phone: i.phone, active: i.active };
    if (i.id) {
      await apiFetch(`/admins/${enc(i.id)}`, { ...call, method: "PUT", body });
    } else {
      await apiFetch("/admins", { ...call, method: "POST", body });
    }
  },

  async deleteAdmin(id: string) {
    await apiFetch(`/admins/${enc(id)}`, { ...call, method: "DELETE" });
  },

  async recordSale(i: SaleInput) {
    await apiFetch("/sales", { ...call, method: "POST", body: i });
  },

  uploadImage,
};