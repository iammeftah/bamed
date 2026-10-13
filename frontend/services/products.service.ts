/**
 * Product endpoints expected from the backend:
 *   GET    /products?query&type&minPrice&maxPrice&sale&featured&sort&page&size
 *          -> Product[]  or  { items | content | data: Product[] }
 *   GET    /products/:id            -> Product (404 gives null)
 *   POST   /products                -> Product      (admin)
 *   PUT    /products/:id            -> Product      (admin)
 *   DELETE /products/:id            -> 204          (admin)
 *
 * Model: a product has ONE type and several colours. Each colour has its own photos:
 *   { id, name, type, price, sizes,
 *     colors: [{ name, hex, images: [{ src, alt } | "url", ...] }, ...] }
 * Photos are shown per colour, so a product needs at least one colour to have images.
 * Older backends that send "images" / "image" on the product still work: those photos
 * are shared by every colour that has none of its own.
 */
import { ApiError, apiFetch } from "@/lib/api/client";
import { mocksEnabled } from "@/lib/config";
import {
  products as sampleProducts,
  productTypes,
  type Product,
  type ProductColor,
  type ProductImage,
  type ProductType,
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

type ImageDto = string | ProductImage;

type ColorDto = { name: string; hex: string; images?: ImageDto[] };

type ProductDto = Partial<Omit<Product, "colors" | "type">> & {
  id: string | number;
  name: string;
  price: number | string;
  createdAt?: string;
  type?: string;
  colors?: ColorDto[];
  /** Older backends send photos on the product itself */
  images?: ImageDto[];
  image?: string;
  alt?: string;
};

type ListDto =
  | ProductDto[]
  | { items?: ProductDto[]; content?: ProductDto[]; data?: ProductDto[] };

function toImages(list: ImageDto[] | undefined, alt: string): ProductImage[] {
  return (list ?? []).map((img) =>
    typeof img === "string" ? { src: img, alt } : img,
  );
}

function sharedImages(dto: ProductDto): ProductImage[] {
  const list = toImages(dto.images, dto.name);
  if (list.length) return list;
  return dto.image ? [{ src: dto.image, alt: dto.alt ?? dto.name }] : [];
}

function toColors(dto: ProductDto): ProductColor[] {
  const shared = sharedImages(dto);
  return (dto.colors ?? []).map((c) => {
    const own = toImages(c.images, `${dto.name}, ${c.name}`);
    return { name: c.name, hex: c.hex, images: own.length ? own : shared };
  });
}

function toProduct(dto: ProductDto): Product {
  const known = productTypes.find((t) => t.id === dto.type);
  const type: ProductType = known?.id ?? "chemises";
  return {
    id: String(dto.id),
    name: dto.name,
    category: dto.category ?? (known ? `${known.label} homme` : ""),
    type,
    price: Number(dto.price),
    oldPrice: dto.oldPrice != null ? Number(dto.oldPrice) : undefined,
    tag: dto.tag,
    featured: Boolean(dto.featured),
    addedAt: dto.addedAt ?? (dto.createdAt ? Date.parse(dto.createdAt) : 0),
    colors: toColors(dto),
    sizes: dto.sizes ?? [],
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