import type { Metadata } from "next";
import { Shop } from "@/components/shop/shop";
import type { Product, StoreBrand, StoreCategory } from "@/lib/products";
import { parseShopParams, toQueryString } from "@/lib/shop-query";
import { productsService } from "@/services/products.service";

export const metadata: Metadata = {
  title: "Boutique | BAMED",
  description:
    "Hoodies, jeans, sneakers et plus. Recherchez et filtrez par taille, couleur ou prix.",
};

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let products: Product[] = [];
  let categories: StoreCategory[] = [];
  let brands: StoreBrand[] = [];
  let loadError = false;
  try {
    [products, categories] = await Promise.all([
      productsService.getProducts({ size: 100 }),
      productsService.getCategories(),
    ]);
  } catch {
    loadError = true;
  }
  // Brands are optional: if they fail to load, the shop still works without the strip
  try {
    brands = await productsService.getBrands();
  } catch {
    brands = [];
  }

  // Everything in the URL is validated against what exists before use
  const initial = parseShopParams(
    await searchParams,
    categories.map((c) => c.id),
    brands.map((b) => b.id),
  );

  return (
    <main className="overflow-x-clip bg-background">
      <Shop
        key={toQueryString(initial, Number.MAX_SAFE_INTEGER)}
        products={products}
        categories={categories}
        brands={brands}
        loadError={loadError}
        initial={initial}
      />
    </main>
  );
}