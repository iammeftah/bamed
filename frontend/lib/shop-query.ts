import { productTypes, type ProductType } from "@/lib/products";

export type Sort = "pertinence" | "nouveautes" | "prix-asc" | "prix-desc";

export const sortOptions: { id: Sort; label: string }[] = [
  { id: "pertinence", label: "Pertinence" },
  { id: "nouveautes", label: "Nouveautés" },
  { id: "prix-asc", label: "Prix croissant" },
  { id: "prix-desc", label: "Prix décroissant" },
];

export const sizeOrder = ["S", "M", "L", "XL", "38", "40", "42", "44"];

/** Products per page. Raise it when the catalogue grows. */
export const PAGE_SIZE = 8;

export type ShopState = {
  query: string;
  type: ProductType | "tous";
  sizes: string[];
  colors: string[];
  /** null = no price limit chosen */
  maxPrice: number | null;
  saleOnly: boolean;
  sort: Sort;
  page: number;
};

type Raw = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const csv = (v: string | undefined, max = 8) =>
  v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, max)
    : [];

const COLOR_NAME = /^[\p{L}][\p{L} '-]{0,29}$/u;

/** Reads URL search params and returns a safe, validated state. */
export function parseShopParams(raw: Raw): ShopState {
  const query = (first(raw.q) ?? "").slice(0, 80);

  const cat = first(raw.categorie);
  const type: ShopState["type"] =
    productTypes.find((t) => t.id === cat)?.id ?? "tous";

  const sizes = csv(first(raw.tailles)).filter((s) => sizeOrder.includes(s));
  const colors = csv(first(raw.couleurs)).filter((c) => COLOR_NAME.test(c));

  const max = Number(first(raw.max));
  const maxPrice =
    Number.isFinite(max) && max >= 100 && max <= 100000 ? Math.round(max) : null;

  const sortRaw = first(raw.tri);
  const sort: Sort =
    sortOptions.find((s) => s.id === sortRaw)?.id ?? "pertinence";

  const pageNum = parseInt(first(raw.page) ?? "1", 10);
  const page =
    Number.isInteger(pageNum) && pageNum >= 1 && pageNum <= 1000 ? pageNum : 1;

  return {
    query,
    type,
    sizes,
    colors,
    maxPrice,
    saleOnly: first(raw.promo) === "1",
    sort,
    page,
  };
}

/** Turns the state back into a query string (empty when everything is default). */
export function toQueryString(state: ShopState, priceCeiling: number): string {
  const p = new URLSearchParams();
  if (state.query.trim()) p.set("q", state.query.trim());
  if (state.type !== "tous") p.set("categorie", state.type);
  if (state.sizes.length) p.set("tailles", state.sizes.join(","));
  if (state.colors.length) p.set("couleurs", state.colors.join(","));
  if (state.maxPrice !== null && state.maxPrice < priceCeiling)
    p.set("max", String(state.maxPrice));
  if (state.saleOnly) p.set("promo", "1");
  if (state.sort !== "pertinence") p.set("tri", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  return p.toString();
}