export type ProductImage = { src: string; alt: string };

/** A colour is a variant: it owns its own photos (first one is the cover). */
export type ProductColor = {
  name: string;
  hex: string;
  images: ProductImage[];
};

/** A shop category. Comes from the backend (GET /categories), never hardcoded in the UI. */
export type StoreCategory = {
  id: string;
  label: string;
  /** Which sizes products of this category offer */
  sizeScale: import("@/lib/sizes").SizeScaleId;
  /** Optional tile photo for the home page */
  image?: string;
  /** Number of active products (lets the site hide empty categories) */
  productCount?: number;
};

/** A brand of the shop. Comes from the backend (GET /brands). */
export type StoreBrand = {
  id: string;
  label: string;
  logo?: string;
  /** Number of active products */
  productCount?: number;
};

export type Product = {
  id: string;
  name: string;
  /** Category label shown under the name */
  category: string;
  /** Id of the category, shared by all colours. Used by the shop filters. */

    /** Brand name shown on the piece, if it has one */
  brand?: string;
  /** Slug of the brand (used by the shop filter) */
  brandId?: string;


  type: string;
  /** Size scale of the category, copied here so components do not need a lookup */
  sizeScale: import("@/lib/sizes").SizeScaleId;
  price: number;
  oldPrice?: number;
  tag?: "Nouveau" | "Promo";
  featured?: boolean;
  /** Higher = more recent (used by the "Nouveautés" sort) */
  addedAt: number;
  colors: ProductColor[];
  sizes: string[];
};

export type Brand = {
  name: string;
  /** Drop the logo file in public/images/brands with this exact file name */
  src: string;
};

export const images = {
  hero: {
    src: "/images/hero/hero.jpg",
    alt: "Mannequin portant une tenue BAMED décontractée et ajustée",
  },
  editorial: {
    src: "/images/editorial/editorial.jpg",
    alt: "Éditorial BAMED : un homme en pièces ajustées du quotidien",
  },
};

/** Photos of one colour. Empty list = a placeholder is shown. */
export function colorImages(
  p: Pick<Product, "colors">,
  colorName?: string,
): ProductImage[] {
  const color = p.colors.find((c) => c.name === colorName) ?? p.colors[0];
  return color?.images ?? [];
}

/** The cover image of a product (in a given colour), or an empty one so the placeholder shows. */
export function coverImage(
  p: Pick<Product, "colors" | "name">,
  colorName?: string,
): ProductImage {
  return colorImages(p, colorName)[0] ?? { src: "", alt: p.name };
}

/**
 * Brands marquee. Logo files go in public/images/brands/ with the names below.
 * If a logo file is missing, the brand name is shown as text instead.
 */
export const brands: Brand[] = [
  { name: "Lacoste", src: "/images/brands/lacoste.svg" },
  { name: "Polo Ralph Lauren", src: "/images/brands/polo-ralph-lauren.svg" },
  { name: "Tommy Hilfiger", src: "/images/brands/tommy-hilfiger.svg" },
  { name: "Zara", src: "/images/brands/zara.svg" },
  { name: "The North Face", src: "/images/brands/the-north-face.svg" },
  { name: "Adidas", src: "/images/brands/adidas.svg" },
  { name: "Puma", src: "/images/brands/puma.svg" },
  { name: "Reebok", src: "/images/brands/reebok.svg" },
];

/** 1290 -> "1 290" (manual formatting, so server and client always match) */
export function formatNumber(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

/** 1290 -> "1 290 MAD" */
export function formatMAD(amount: number): string {
  return `${formatNumber(amount)}\u00A0MAD`;
}