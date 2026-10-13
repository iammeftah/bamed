import type { Metadata } from "next";
import { Shop } from "@/components/shop/shop";
import type { Product } from "@/lib/products";
import { parseShopParams, toQueryString } from "@/lib/shop-query";
import { productsService } from "@/services/products.service";

export const metadata: Metadata = {
  title: "Boutique | BAMED",
  description:
    "Chemises, pantalons, vestes et maille pour homme. Recherchez et filtrez par taille, couleur ou prix.",
};

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Everything in the URL is validated against allowlists before use
  const initial = parseShopParams(await searchParams);

  let products: Product[] = [];
  let loadError = false;
  try {
    products = await productsService.getProducts({ size: 100 });
  } catch {
    loadError = true;
  }

  return (
    <main className="overflow-x-clip bg-background">
      <Shop
        key={toQueryString(initial, Number.MAX_SAFE_INTEGER)}
        products={products}
        loadError={loadError}
        initial={initial}
      />
    </main>
  );
}