import type { Metadata } from "next";
import { Shop } from "@/components/shop/shop";
import type { Product } from "@/lib/products";
import { productsService } from "@/services/products.service";

export const metadata: Metadata = {
  title: "Boutique | BAMED",
  description:
    "Chemises, pantalons, vestes et maille pour homme. Filtrez par taille, couleur ou prix.",
};

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;

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
        key={categorie ?? "tous"}
        products={products}
        loadError={loadError}
        initialType={categorie}
      />
    </main>
  );
}