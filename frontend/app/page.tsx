import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { BrandsMarquee } from "@/components/landing/brands-marquee";
import { CategoryStrip } from "@/components/landing/category-strip";
import { NewArrivals } from "@/components/landing/new-arrivals";
import { ParallaxMarquee } from "@/components/landing/parallax-marquee";
import { Editorial } from "@/components/landing/editorial";
import { Marquee } from "@/components/landing/marquee";
import { ClosingCta } from "@/components/landing/closing-cta";
import type { Product, StoreCategory } from "@/lib/products";
import { productsService } from "@/services/products.service";

/** Up to 4 categories that have products, the ones with a photo first. */
async function getStripCategories(): Promise<StoreCategory[]> {
  try {
    const categories = await productsService.getCategories();
    return categories
      .filter((c) => (c.productCount ?? 0) > 0)
      .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))
      .slice(0, 4);
  } catch {
    return [];
  }
}

/** Up to 8 products added in the last 30 days, most recent first (filtered by the backend). */
async function getNewProducts(): Promise<Product[]> {
  try {
    const list = await productsService.getNewArrivals(8);
    return list.filter((p) => p.tag === "Nouveau");
  } catch {
    return [];
  }
}

export default async function Home() {
  const [stripCategories, newProducts] = await Promise.all([
    getStripCategories(),
    getNewProducts(),
  ]);

  return (
    <main className="overflow-x-clip">
      <Hero />
      <TrustStrip />
      <BrandsMarquee />
      <div id="collections" className="scroll-mt-16 md:scroll-mt-20">
        <CategoryStrip categories={stripCategories} />
      </div>
      <div id="nouveautes" className="scroll-mt-16 md:scroll-mt-20">
        <NewArrivals products={newProducts} />
      </div>
      <ParallaxMarquee />
      <Editorial />
      <Marquee />
      <ClosingCta />
    </main>
  );
}