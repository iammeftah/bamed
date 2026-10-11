import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { BrandsMarquee } from "@/components/landing/brands-marquee";
import { CategoryStrip } from "@/components/landing/category-strip";
import { NewArrivals } from "@/components/landing/new-arrivals";
import { Editorial } from "@/components/landing/editorial";
import { Marquee } from "@/components/landing/marquee";
import { ClosingCta } from "@/components/landing/closing-cta";

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      <TrustStrip />
      <BrandsMarquee />
      <div id="collections" className="scroll-mt-16 md:scroll-mt-20">
        <CategoryStrip />
      </div>
      <div id="nouveautes" className="scroll-mt-16 md:scroll-mt-20">
        <NewArrivals />
      </div>
      <Editorial />
      <Marquee />
      <ClosingCta />
    </main>
  );
}