import { ArrowUpRight } from "lucide-react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";
import { ScrollShift, Tilt, TiltGlare } from "@/components/landing/depth";
import type { StoreCategory } from "@/lib/products";

/** Each column scrolls at a different speed, which creates depth between tiles. */
const shifts = [28, -30, 44, -10];

export function CategoryStrip({ categories }: { categories: StoreCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-8 md:mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Collections
          </p>
          <h2 className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl">
            Explorez par catégorie
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <RevealItem key={c.id}>
              <ScrollShift speed={shifts[i % shifts.length]}>
                <Tilt max={7}>
                  <a
                    href={`/boutique?categorie=${encodeURIComponent(c.id)}`}
                    className="group relative block"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Flat layer: the photo (overflow-hidden lives here, not on the 3D parent) */}
                    <div className="relative isolate overflow-hidden rounded-xl">
                      <div className="transition-transform duration-700 ease-out group-hover:scale-105">
                        <ImagePlaceholder
                          src={c.image}
                          alt={`Collection ${c.label}`}
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
                      <TiltGlare />
                    </div>

                    {/* Raised layer: the label floats in front of the photo */}
                    <div
                      className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4 md:p-6"
                      style={{ transform: "translateZ(48px)" }}
                    >
                      <span className="font-display text-2xl font-bold uppercase leading-none text-white sm:text-3xl md:text-5xl">
                        {c.label}
                      </span>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 md:size-12">
                        <ArrowUpRight
                          className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </span>
                    </div>
                    <span className="sr-only">Découvrir {c.label}</span>
                  </a>
                </Tilt>
              </ScrollShift>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}