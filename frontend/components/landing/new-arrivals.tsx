import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/landing/product-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";
import { products } from "@/lib/products";

export function NewArrivals() {
  return (
    <section className="bg-background pb-16 md:pb-24">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-8 flex items-end justify-between gap-4 md:mb-10">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Fraîchement arrivé
            </p>
            <h2 className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl">
              Nouveautés
            </h2>
          </div>
          <a
            href="#"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline md:text-base"
          >
            Tout voir
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </a>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4 lg:gap-y-14">
          {products.map((p) => (
            <RevealItem key={p.id}>
              <ProductCard product={p} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}