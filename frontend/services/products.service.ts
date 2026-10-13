/**
 * Product endpoints expected from the backend:
 *   GET    /products?query&type&minPrice&maxPrice&sale&featured&sort&page&size
 *          -> Product[]  or  { items | content | data: Product[] }
 *   GET    /products/:id            -> Product (404 gives null)
 *   POST   /products                -> Product      (admin or manager)
 *   PUT    /products/:id            -> Product      (admin or manager)
 *   DELETE /products/:id            -> 204          (admin or manager)
 * Fields match the Product type in lib/products.ts. Adapt toProduct if yours differ.
 * Images: "images" can be [{ src, alt }] or ["url", ...]. A single "image" also works.
 */
import { ApiError, apiFetch } from "@/lib/api/client";
import { mocksEnabled } from "@/lib/config";
import {
  products as sampleProducts,
  type Product,
  type ProductImage,
} from "@/lib/products";

export type ProductSort = "nouveautes" | "prix-asc" | "prix-desc";

export type ProductQuery = {
  query?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  sale?: boolean;
  featured?: boolean;
  sort?: ProductSort;
  page?: number;
  size?: number;
};

export type ProductInput = Omit<Product, "id">;

type ProductDto = Partial<Omit<Product, "images">> & {
  id: string | number;
  name: string;
  price: number | string;
  createdAt?: string;
  images?: (string | ProductImage)[];
  /** Older backends send one image */
  image?: string;
  alt?: string;
};

type ListDto =
  | ProductDto[]
  | { items?: ProductDto[]; content?: ProductDto[]; data?: ProductDto[] };

function toImages(dto: ProductDto): ProductImage[] {
  if (dto.images?.length) {
    return dto.images.map((img) =>
      typeof img === "string" ? { src: img, alt: dto.name } : img,
    );
  }
  if (dto.image) return [{ src: dto.image, alt: dto.alt ?? dto.name }];
  return [];
}

function toProduct(dto: ProductDto): Product {
  return {
    id: String(dto.id),
    name: dto.name,
    category: dto.category ?? "",
    type: dto.type ?? "chemises",
    price: Number(dto.price),
    oldPrice: dto.oldPrice != null ? Number(dto.oldPrice) : undefined,
    tag: dto.tag,
    featured: Boolean(dto.featured),
    addedAt: dto.addedAt ?? (dto.createdAt ? Date.parse(dto.createdAt) : 0),
    colors: dto.colors ?? [],
    sizes: dto.sizes ?? [],
    images: toImages(dto),
  };
}

function unwrap(res: ListDto): ProductDto[] {
  if (Array.isArray(res)) return res;
  return res.items ?? res.content ?? res.data ?? [];
}

const cache = { revalidate: 60, tags: ["products"] };

async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  if (mocksEnabled) return sampleList(q);
  const res = await apiFetch<ListDto>("/products", { query: q, next: cache });
  return unwrap(res).map(toProduct);
}

async function getFeatured(limit = 3): Promise<Product[]> {
  return getProducts({ featured: true, size: limit });
}

async function getNewArrivals(limit = 8): Promise<Product[]> {
  return getProducts({ sort: "nouveautes", size: limit });
}

async function getProduct(id: string): Promise<Product | null> {
  if (mocksEnabled) return sampleProducts.find((p) => p.id === id) ?? null;
  try {
    const dto = await apiFetch<ProductDto>(
      `/products/${encodeURIComponent(id)}`,
      { next: cache },
    );
    return toProduct(dto);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

function demoOnly(): never {
  throw new ApiError(503, "Mode démo : connectez un backend pour modifier le catalogue.");
}

async function createProduct(input: ProductInput): Promise<Product> {
  if (mocksEnabled) demoOnly();
  const dto = await apiFetch<ProductDto>("/products", {
    method: "POST",
    auth: true,
    body: input,
  });
  return toProduct(dto);
}

async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  if (mocksEnabled) demoOnly();
  const dto = await apiFetch<ProductDto>(`/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: true,
    body: input,
  });
  return toProduct(dto);
}

async function deleteProduct(id: string): Promise<void> {
  if (mocksEnabled) demoOnly();
  await apiFetch<void>(`/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

export const productsService = {
  getProducts,
  getFeatured,
  getNewArrivals,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};

/* ---------- Sample data mode (no backend configured) ---------- */

function sampleList(q: ProductQuery): Product[] {
  const term = q.query?.trim().toLowerCase();
  const list = sampleProducts.filter(
    (p) =>
      (!q.type || p.type === q.type) &&
      (!term || `${p.name} ${p.category}`.toLowerCase().includes(term)) &&
      (q.minPrice == null || p.price >= q.minPrice) &&
      (q.maxPrice == null || p.price <= q.maxPrice) &&
      (!q.sale || Boolean(p.oldPrice)) &&
      (!q.featured || p.featured),
  );
  if (q.sort === "prix-asc") list.sort((a, b) => a.price - b.price);
  if (q.sort === "prix-desc") list.sort((a, b) => b.price - a.price);
  if (q.sort === "nouveautes") list.sort((a, b) => b.addedAt - a.addedAt);
  return q.size ? list.slice(0, q.size) : list;
}