import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";
import { categories } from "@/lib/products";

export function CategoryStrip() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-8 md:mb-10">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <LayoutGrid className="size-4 text-gold" aria-hidden />
            Collections
          </p>
          <h2 className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl">
            Explorez par catégorie
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {categories.map((c) => (
            <RevealItem key={c.name}>
              <a
                href={c.href}
                className="group relative block overflow-hidden"
              >
                <div className="transition-transform duration-700 ease-out group-hover:scale-105">
                  <ImagePlaceholder
                    src={c.image}
                    alt={c.alt}
                    ratio="3 / 4"
                    label="Photo catégorie 3:4"
                    kind="category"
                    tone="dark"
                    sizes="(min-width:1024px) 25vw, 50vw"
                  />
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4 md:p-6">
                  <span className="font-display text-2xl font-bold uppercase leading-none text-white sm:text-3xl md:text-5xl">
                    {c.name}
                  </span>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 md:size-12">
                    <ArrowUpRight
                      className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
                <span className="sr-only">Découvrir {c.name}</span>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}