import { ArrowRight } from "lucide-react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { Reveal } from "@/components/landing/reveal";
import { ScrollShift, Tilt, TiltGlare } from "@/components/landing/depth";
import { images } from "@/lib/products";

const points = ["Coupes nettes", "Matières sincères", "Pour tous les jours"];

export function Editorial() {
  return (
    <section className="bg-muted py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-5 md:px-10 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <ScrollShift speed={36}>
            <Tilt max={6} className="mx-3 md:mx-0">
              <div
                className="relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Back: an outlined frame sitting behind the photo */}
                <div
                  aria-hidden
                  className="absolute -inset-3 rounded-2xl border border-gold/60 md:-inset-4"
                  style={{ transform: "translateZ(-50px)" }}
                />

                {/* Middle: the photo */}
                <div className="relative isolate overflow-hidden rounded-xl">
                  <ImagePlaceholder
                    src={images.editorial.src}
                    alt={images.editorial.alt}
                    ratio="4 / 5"
                    label="Photo éditoriale 4:5"
                    kind="editorial"
                    sizes="(min-width:1024px) 50vw, 100vw"
                  />
                  <TiltGlare />
                </div>

                {/* Front: gold ring and tag floating in front of the photo */}
                <div
                  aria-hidden
                  className="absolute -right-4 -top-4 size-24 rounded-full border-2 border-gold md:-right-6 md:-top-6 md:size-32"
                  style={{ transform: "translateZ(80px)" }}
                />
                <div
                  className="absolute -bottom-4 left-4 rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold-foreground md:left-6"
                  style={{ transform: "translateZ(60px)" }}
                >
                  Nouvelle saison
                </div>
              </div>
            </Tilt>
          </ScrollShift>
        </Reveal>

        <Reveal delay={0.1} className="max-w-xl">
          <ScrollShift speed={-18}>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
              <span className="h-px w-10 bg-gold" aria-hidden />
              L&apos;esprit BAMED
            </p>
            <h2 className="mt-5 font-display text-[length:clamp(2.75rem,8vw,6rem)] font-bold uppercase leading-[0.9]">
              Fait pour être porté, pas rangé.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
              Des lignes épurées, des matières sincères et des coupes qui
              suivent vos journées, du premier café à la dernière sortie. Pas
              de bruit, juste des vêtements que vous enfilez sans y penser.
            </p>

            <ul className="mt-8 flex flex-wrap gap-2">
              {points.map((label) => (
                <li
                  key={label}
                  className="inline-flex items-center rounded-full bg-background px-4 py-2 text-sm font-semibold"
                >
                  {label}
                </li>
              ))}
            </ul>

            <a
              href="#"
              className="group mt-8 inline-flex items-center gap-2 text-base font-semibold underline underline-offset-4"
            >
              Lire notre histoire
              <ArrowRight
                className="size-5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </a>
          </ScrollShift>
        </Reveal>
      </div>
    </section>
  );
}