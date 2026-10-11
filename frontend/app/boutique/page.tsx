import type { Metadata } from "next";
import { Shop } from "@/components/shop/shop";

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

  return (
    <main className="overflow-x-clip bg-background">
      <Shop key={categorie ?? "tous"} initialType={categorie} />
    </main>
  );
}