/**
 * Endpoints expected from the backend:
 *
 *   GET    /categories              -> StoreCategory[]  or  { items | content | data: [...] }
 *          { id | slug, label | name, sizeScale?, image?, productCount? }
 *          sizeScale is one of: letters, pants, jeans, shoes, unique
 *
 *   GET    /products?query&type&minPrice&maxPrice&sale&featured&new&sort&page&size
 *          -> Product[]  or  { items | content | data: Product[] }
 *   GET    /products/:id            -> Product (404 gives null)
 *
 * Everything comes from the database through the Laravel API. There is no sample data.
 * A product has ONE category and several colours. Each colour has its own photos.
 */
import { ApiError, apiFetch } from "@/lib/api/client";
import type {
  Product,
  ProductColor,
  ProductImage,
  StoreBrand,
  StoreCategory,
} from "@/lib/products";
import { defaultScale, isScaleId } from "@/lib/sizes";

export type ProductSort = "nouveautes" | "prix-asc" | "prix-desc";

export type ProductQuery = {
  query?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  sale?: boolean;
  featured?: boolean;
  /** Only products added in the last 30 days (same rule as the "Nouveau" tag) */
  new?: boolean;
  sort?: ProductSort;
  page?: number;
  size?: number;
};

type ImageDto = string | ProductImage;

type ColorDto = { name: string; hex: string; images?: ImageDto[] };

type CategoryDto = {
  id?: string | number;
  slug?: string;
  label?: string;
  name?: string;
  sizeScale?: string;
  image?: string;
  productCount?: number;
};

// new DTO, next to CategoryDto
type BrandDto = {
  id?: string | number;
  slug?: string;
  label?: string;
  name?: string;
  logo?: string;
  productCount?: number;
};

type ProductDto = Partial<
  Omit<Product, "colors" | "type" | "sizeScale" | "category">
> & {
  id: string | number;
  name: string;
  price: number | string;
  createdAt?: string;
  type?: string;
  categoryId?: string | number;
  category?: string;
  colors?: ColorDto[];
  /** Older backends send photos on the product itself */
  images?: ImageDto[];
  image?: string;
  alt?: string;
};

type ListDto<T> = T[] | { items?: T[]; content?: T[]; data?: T[] };

function unwrap<T>(res: ListDto<T>): T[] {
  if (Array.isArray(res)) return res;
  return res.items ?? res.content ?? res.data ?? [];
}

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

function toCategory(dto: CategoryDto): StoreCategory {
  const id = String(dto.id ?? dto.slug ?? "");
  return {
    id,
    label: dto.label ?? dto.name ?? id,
    sizeScale: isScaleId(dto.sizeScale) ? dto.sizeScale : defaultScale,
    image: dto.image || undefined,
    productCount:
      dto.productCount != null ? Number(dto.productCount) : undefined,
  };
}

// new mapper, next to toCategory
function toBrand(dto: BrandDto): StoreBrand {
  const id = String(dto.id ?? dto.slug ?? "");
  return {
    id,
    label: dto.label ?? dto.name ?? id,
    logo: dto.logo || undefined,
    productCount:
      dto.productCount != null ? Number(dto.productCount) : undefined,
  };
}

function toProduct(dto: ProductDto, categories: StoreCategory[]): Product {
  const typeId = String(dto.type ?? dto.categoryId ?? "");
  const cat = categories.find((c) => c.id === typeId);
  return {
    id: String(dto.id),
    name: dto.name,
    category: cat?.label ?? dto.category ?? "",
    // in toProduct, replace the `brand: dto.brand || undefined,` line with
    brand: dto.brand || undefined,
    brandId: dto.brandId || undefined,
    type: typeId,
    sizeScale: cat?.sizeScale ?? defaultScale,
    price: Number(dto.price),
    oldPrice: dto.oldPrice != null ? Number(dto.oldPrice) : undefined,
    tag: dto.tag,
    featured: Boolean(dto.featured),
    addedAt: dto.addedAt ?? (dto.createdAt ? Date.parse(dto.createdAt) : 0),
    colors: toColors(dto),
    sizes: dto.sizes ?? [],
  };
}

const cache = { revalidate: 60, tags: ["products"] };

async function getCategories(): Promise<StoreCategory[]> {
  const res = await apiFetch<ListDto<CategoryDto>>("/categories", {
    next: { revalidate: 60, tags: ["categories"] },
  });
  return unwrap(res).map(toCategory);
}

// new function, next to getCategories
async function getBrands(): Promise<StoreBrand[]> {
  const res = await apiFetch<ListDto<BrandDto>>("/brands", {
    next: { revalidate: 60, tags: ["brands"] },
  });
  return unwrap(res).map(toBrand);
}

async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const [categories, res] = await Promise.all([
    getCategories(),
    apiFetch<ListDto<ProductDto>>("/products", { query: q, next: cache }),
  ]);
  return unwrap(res).map((dto) => toProduct(dto, categories));
}

async function getFeatured(limit = 3): Promise<Product[]> {
  return getProducts({ featured: true, size: limit });
}

async function getNewArrivals(limit = 8): Promise<Product[]> {
  return getProducts({ new: true, sort: "nouveautes", size: limit });
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const [categories, dto] = await Promise.all([
      getCategories(),
      apiFetch<ProductDto>(`/products/${encodeURIComponent(id)}`, {
        next: cache,
      }),
    ]);
    return toProduct(dto, categories);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// export it
export const productsService = {
  getCategories,
  getBrands,
  getProducts,
  getFeatured,
  getNewArrivals,
  getProduct,
};