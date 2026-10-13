import type { SizeScaleId } from "@/lib/sizes";

export type ProductImage = { src: string; alt: string };

/** A colour is a variant: it owns its own photos (first one is the cover). */
export type ProductColor = {
  name: string;
  hex: string;
  images: ProductImage[];
};

/** A shop category. Comes from the dashboard / backend, never hardcoded in the UI. */
export type StoreCategory = {
  id: string;
  label: string;
  /** Which sizes products of this category offer */
  sizeScale: SizeScaleId;
  /** Optional tile photo for the home page */
  image?: string;
};

export type Product = {
  id: string;
  name: string;
  /** Category label shown under the name */
  category: string;
  /** Id of the category, shared by all colours. Used by the shop filters. */
  type: string;
  /** Size scale of the category, copied here so components do not need a lookup */
  sizeScale: SizeScaleId;
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

/* ---------- Sample data (used while there is no backend) ---------- */

/**
 * Sample categories. With a backend they come from GET /categories and the
 * dashboard, so nothing in the UI depends on this list.
 */
export const sampleCategories: StoreCategory[] = [
  { id: "hoodies", label: "Hoodies", sizeScale: "letters" },
  { id: "t-shirts", label: "T-shirts", sizeScale: "letters" },
  { id: "jeans", label: "Jeans", sizeScale: "jeans" },
  {
    id: "pantalons",
    label: "Pantalons",
    sizeScale: "pants",
    image: "/images/categories/trousers.jpg",
  },
  {
    id: "vestes",
    label: "Vestes",
    sizeScale: "letters",
    image: "/images/categories/outerwear.jpg",
  },
  { id: "sneakers", label: "Sneakers", sizeScale: "shoes" },
  {
    id: "chemises",
    label: "Chemises",
    sizeScale: "letters",
    image: "/images/categories/shirts.jpg",
  },
  { id: "polos", label: "Polos", sizeScale: "letters" },
  {
    id: "maille",
    label: "Maille",
    sizeScale: "letters",
    image: "/images/categories/knitwear.jpg",
  },
  { id: "accessoires", label: "Accessoires", sizeScale: "unique" },
];

/** Category fields of a sample product, taken from the category list above. */
function inCategory(id: string) {
  const c = sampleCategories.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown sample category: ${id}`);
  return { type: c.id, category: c.label, sizeScale: c.sizeScale };
}

type ColorBase = { name: string; hex: string };

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * One colour with `count` photos:
 * /images/products/<product-id>/<colour>-1.jpg ... <colour>-<count>.jpg
 */
function variant(
  productId: string,
  color: ColorBase,
  count: number,
  alt: string,
): ProductColor {
  return {
    ...color,
    images: Array.from({ length: count }, (_, i) => ({
      src: `/images/products/${productId}/${slug(color.name)}-${i + 1}.jpg`,
      alt: `${alt}, ${color.name.toLowerCase()}, photo ${i + 1}`,
    })),
  };
}

const blanc = { name: "Blanc", hex: "#f3f3f1" };
const noir = { name: "Noir", hex: "#111111" };
const marine = { name: "Marine", hex: "#1f2a44" };
const beige = { name: "Beige", hex: "#c8b79a" };
const gris = { name: "Gris", hex: "#8a8a8a" };
const anthracite = { name: "Anthracite", hex: "#3a3a3c" };
const olive = { name: "Olive", hex: "#5b6340" };
const ciel = { name: "Bleu ciel", hex: "#a9c4de" };
const sable = { name: "Sable", hex: "#d6c7a8" };
const sauge = { name: "Sauge", hex: "#a3b18a" };

const tops = ["S", "M", "L", "XL", "XXL"];
const bottoms = ["38", "40", "42", "44"];

export const products: Product[] = [
  {
    id: "oxford-shirt",
    name: "Chemise Oxford",
    ...inCategory("chemises"),
    price: 490,
    tag: "Nouveau",
    featured: true,
    addedAt: 8,
    colors: [
      variant("oxford-shirt", ciel, 3, "Chemise Oxford"),
      variant("oxford-shirt", blanc, 2, "Chemise Oxford"),
    ],
    sizes: tops,
  },
  {
    id: "linen-camp-shirt",
    name: "Chemise Camp en Lin",
    ...inCategory("chemises"),
    price: 420,
    tag: "Nouveau",
    addedAt: 7,
    colors: [
      variant("linen-camp-shirt", sable, 2, "Chemise Camp en Lin"),
      variant("linen-camp-shirt", sauge, 2, "Chemise Camp en Lin"),
    ],
    sizes: tops,
  },
  {
    id: "heavyweight-tee",
    name: "T-shirt Épais",
    ...inCategory("t-shirts"),
    price: 220,
    addedAt: 2,
    colors: [
      variant("heavyweight-tee", noir, 2, "T-shirt Épais"),
      variant("heavyweight-tee", blanc, 2, "T-shirt Épais"),
      variant("heavyweight-tee", gris, 2, "T-shirt Épais"),
    ],
    sizes: tops,
  },
  {
    id: "pique-polo",
    name: "Polo Piqué",
    ...inCategory("polos"),
    price: 330,
    tag: "Nouveau",
    addedAt: 6,
    colors: [
      variant("pique-polo", marine, 2, "Polo Piqué"),
      variant("pique-polo", blanc, 2, "Polo Piqué"),
    ],
    sizes: tops,
  },
  {
    id: "tailored-chinos",
    name: "Chino Ajusté",
    ...inCategory("pantalons"),
    price: 590,
    oldPrice: 720,
    tag: "Promo",
    addedAt: 3,
    colors: [
      variant("tailored-chinos", beige, 3, "Chino Ajusté"),
      variant("tailored-chinos", marine, 2, "Chino Ajusté"),
    ],
    sizes: bottoms,
  },
  {
    id: "wool-overshirt",
    name: "Surchemise en Laine Mélangée",
    ...inCategory("vestes"),
    price: 890,
    featured: true,
    addedAt: 4,
    colors: [
      variant("wool-overshirt", anthracite, 2, "Surchemise en laine mélangée"),
      variant("wool-overshirt", olive, 2, "Surchemise en laine mélangée"),
    ],
    sizes: tops,
  },
  {
    id: "merino-crew-knit",
    name: "Pull Mérinos Col Rond",
    ...inCategory("maille"),
    price: 640,
    oldPrice: 790,
    tag: "Promo",
    featured: true,
    addedAt: 1,
    colors: [
      variant("merino-crew-knit", marine, 2, "Pull mérinos col rond"),
      variant("merino-crew-knit", gris, 2, "Pull mérinos col rond"),
    ],
    sizes: tops,
  },
  {
    id: "relaxed-trousers",
    name: "Pantalon Fluide à Pinces",
    ...inCategory("pantalons"),
    price: 620,
    tag: "Nouveau",
    addedAt: 5,
    colors: [
      variant("relaxed-trousers", noir, 2, "Pantalon fluide à pinces"),
      variant("relaxed-trousers", beige, 2, "Pantalon fluide à pinces"),
    ],
    sizes: bottoms,
  },
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