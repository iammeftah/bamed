import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { BrandsMarquee } from "@/components/landing/brands-marquee";
import { CategoryStrip } from "@/components/landing/category-strip";
import { NewArrivals } from "@/components/landing/new-arrivals";
import { ParallaxMarquee } from "@/components/landing/parallax-marquee";
import { Editorial } from "@/components/landing/editorial";
import { Marquee } from "@/components/landing/marquee";
import { ClosingCta } from "@/components/landing/closing-cta";
import type { StoreCategory } from "@/lib/products";
import { productsService } from "@/services/products.service";

/** Up to 4 categories that have products, the ones with a photo first. */
async function getStripCategories(): Promise<StoreCategory[]> {
  try {
    const [categories, products] = await Promise.all([
      productsService.getCategories(),
      productsService.getProducts({ size: 100 }),
    ]);
    const used = new Set(products.map((p) => p.type));
    return categories
      .filter((c) => used.has(c.id))
      .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))
      .slice(0, 4);
  } catch {
    return [];
  }
}

export default async function Home() {
  const stripCategories = await getStripCategories();

  return (
    <main className="overflow-x-clip">
      <Hero />
      <TrustStrip />
      <BrandsMarquee />
      <div id="collections" className="scroll-mt-16 md:scroll-mt-20">
        <CategoryStrip categories={stripCategories} />
      </div>
      <div id="nouveautes" className="scroll-mt-16 md:scroll-mt-20">
        <NewArrivals />
      </div>
      <ParallaxMarquee />
      <Editorial />
      <Marquee />
      <ClosingCta />
    </main>
  );
}