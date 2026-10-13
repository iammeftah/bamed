export type ProductType =
  | "chemises"
  | "t-shirts"
  | "polos"
  | "pantalons"
  | "vestes"
  | "maille";

export type ProductColor = { name: string; hex: string };

export type ProductImage = { src: string; alt: string };

export type Product = {
  id: string;
  name: string;
  /** Display label shown under the name */
  category: string;
  /** Used by the shop filters */
  type: ProductType;
  price: number;
  oldPrice?: number;
  tag?: "Nouveau" | "Promo";
  featured?: boolean;
  /** Higher = more recent (used by the "Nouveautés" sort) */
  addedAt: number;
  colors: ProductColor[];
  sizes: string[];
  /** First image is the cover. Can be empty (a placeholder is shown). */
  images: ProductImage[];
};

export type Category = {
  name: string;
  href: string;
  image: string;
  alt: string;
};

export type Brand = {
  name: string;
  /** Drop the logo file in public/images/brands with this exact file name */
  src: string;
};

export const productTypes: { id: ProductType; label: string }[] = [
  { id: "chemises", label: "Chemises" },
  { id: "t-shirts", label: "T-shirts" },
  { id: "polos", label: "Polos" },
  { id: "pantalons", label: "Pantalons" },
  { id: "vestes", label: "Vestes" },
  { id: "maille", label: "Maille" },
];

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

/** The cover image of a product, or an empty one so the placeholder shows. */
export function coverImage(p: Pick<Product, "images" | "name">): ProductImage {
  return p.images[0] ?? { src: "", alt: p.name };
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

export const categories: Category[] = [
  {
    name: "Chemises",
    href: "/boutique?categorie=chemises",
    image: "/images/categories/shirts.jpg",
    alt: "Collection de chemises pour homme",
  },
  {
    name: "Pantalons",
    href: "/boutique?categorie=pantalons",
    image: "/images/categories/trousers.jpg",
    alt: "Collection de pantalons pour homme",
  },
  {
    name: "Vestes",
    href: "/boutique?categorie=vestes",
    image: "/images/categories/outerwear.jpg",
    alt: "Collection de vestes et manteaux pour homme",
  },
  {
    name: "Maille",
    href: "/boutique?categorie=maille",
    image: "/images/categories/knitwear.jpg",
    alt: "Collection de mailles pour homme",
  },
];

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

const tops = ["S", "M", "L", "XL"];
const bottoms = ["38", "40", "42", "44"];

export const products: Product[] = [
  {
    id: "oxford-shirt",
    name: "Chemise Oxford",
    category: "Chemises homme",
    type: "chemises",
    price: 490,
    tag: "Nouveau",
    featured: true,
    addedAt: 8,
    colors: [ciel, blanc],
    sizes: tops,
    images: [
      {
        src: "/images/products/oxford-shirt.jpg",
        alt: "Chemise Oxford à col boutonné, coupe classique",
      },
    ],
  },
  {
    id: "linen-camp-shirt",
    name: "Chemise Camp en Lin",
    category: "Chemises homme",
    type: "chemises",
    price: 420,
    tag: "Nouveau",
    addedAt: 7,
    colors: [sable, sauge],
    sizes: tops,
    images: [
      {
        src: "/images/products/linen-camp-shirt.jpg",
        alt: "Chemise en lin à manches courtes et col cubain",
      },
    ],
  },
  {
    id: "heavyweight-tee",
    name: "T-shirt Épais",
    category: "T-shirts homme",
    type: "t-shirts",
    price: 220,
    addedAt: 2,
    colors: [noir, blanc, gris],
    sizes: tops,
    images: [
      {
        src: "/images/products/heavyweight-tee.jpg",
        alt: "T-shirt col rond en coton épais",
      },
    ],
  },
  {
    id: "pique-polo",
    name: "Polo Piqué",
    category: "Polos homme",
    type: "polos",
    price: 330,
    tag: "Nouveau",
    addedAt: 6,
    colors: [marine, blanc],
    sizes: tops,
    images: [
      {
        src: "/images/products/pique-polo.jpg",
        alt: "Polo en coton piqué",
      },
    ],
  },
  {
    id: "tailored-chinos",
    name: "Chino Ajusté",
    category: "Pantalons homme",
    type: "pantalons",
    price: 590,
    oldPrice: 720,
    tag: "Promo",
    addedAt: 3,
    colors: [beige, marine],
    sizes: bottoms,
    images: [
      {
        src: "/images/products/tailored-chinos.jpg",
        alt: "Pantalon chino ajusté à coupe slim",
      },
    ],
  },
  {
    id: "wool-overshirt",
    name: "Surchemise en Laine Mélangée",
    category: "Vestes homme",
    type: "vestes",
    price: 890,
    featured: true,
    addedAt: 4,
    colors: [anthracite, olive],
    sizes: tops,
    images: [
      {
        src: "/images/products/wool-overshirt.jpg",
        alt: "Surchemise en laine mélangée",
      },
    ],
  },
  {
    id: "merino-crew-knit",
    name: "Pull Mérinos Col Rond",
    category: "Maille homme",
    type: "maille",
    price: 640,
    oldPrice: 790,
    tag: "Promo",
    featured: true,
    addedAt: 1,
    colors: [marine, gris],
    sizes: tops,
    images: [
      {
        src: "/images/products/merino-crew-knit.jpg",
        alt: "Pull fin en laine mérinos à col rond",
      },
    ],
  },
  {
    id: "relaxed-trousers",
    name: "Pantalon Fluide à Pinces",
    category: "Pantalons homme",
    type: "pantalons",
    price: 620,
    tag: "Nouveau",
    addedAt: 5,
    colors: [noir, beige],
    sizes: bottoms,
    images: [
      {
        src: "/images/products/relaxed-trousers.jpg",
        alt: "Pantalon à pinces, coupe large et fluide",
      },
    ],
  },
];

// Add an animation on images switching, carousel switches on hover

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