import type { Metadata } from "next";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { ClosingCta } from "@/components/landing/closing-cta";
import { DepthLayer, DepthStage, Float } from "@/components/landing/depth";
import { StoreMap } from "@/components/landing/store-map";
import { StoryTimeline } from "@/components/landing/story-timeline";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";
import { images } from "@/lib/products";

export const metadata: Metadata = {
  title: "À propos | BAMED",
  description:
    "BAMED, boutique de mode homme à Sidi Bernoussi, Casablanca : classique, streetwear et sport, en qualité master.",
};

const universes = [
  {
    title: "Classe",
    text: "Chemises, polos, pantalons et mailles aux coupes nettes, pour les jours où l'on veut soigner sa tenue.",
  },
  {
    title: "Streetwear",
    text: "Hoodies, t-shirts, jeans et sneakers pour le quotidien, avec les coupes et les looks du moment.",
  },
  {
    title: "Sport",
    text: "Des pièces confortables pour bouger, à l'entraînement comme en ville.",
  },
];

const values = [
  {
    title: "Qualité master",
    text: "Nous sélectionnons des pièces de qualité master, avec des finitions soignées.",
  },
  {
    title: "Des coupes nettes",
    text: "Des lignes simples et précises, pensées pour tomber juste sur la plupart des morphologies.",
  },
  {
    title: "Une taille fidèle",
    text: "Nos tailles correspondent à ce que vous attendez, pour choisir sans hésiter.",
  },
  {
    title: "Un guide clair",
    text: "Un guide des tailles et des réponses simples pour bien choisir votre pièce.",
  },
];

const infos = [
  { label: "Boutique", value: "BAMED Store" },
  { label: "Quartier", value: "Sidi Bernoussi" },
  { label: "Ville", value: "Casablanca, Maroc" },
  { label: "Styles", value: "Classe, streetwear, sport" },
];

export default function AProposPage() {
  return (
    <main className="overflow-x-clip">
      <section className="relative overflow-hidden bg-background pb-12 pt-28 md:pb-20 md:pt-40">
        <DepthStage
          tilt={2}
          className="mx-auto w-full max-w-[1440px] px-5 md:px-10"
        >
          {/* Back layer: giant outlined word */}
          <DepthLayer
            depth={-1}
            pointer={30}
            scroll={120}
            className="pointer-events-none absolute inset-0 flex select-none items-center justify-end"
          >
            <span
              aria-hidden
              className="font-display text-[length:clamp(8rem,34vw,30rem)] font-bold uppercase leading-none text-transparent opacity-[0.07] [-webkit-text-stroke:2px_var(--foreground)]"
            >
              BAMED
            </span>
          </DepthLayer>

          {/* Middle layer: the text */}
          <DepthLayer depth={0.25} pointer={14} scroll={40} className="relative">
            <Reveal>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Sidi Bernoussi, Casablanca
              </p>
              <h1 className="max-w-5xl font-display text-[length:clamp(3.5rem,12vw,10rem)] font-bold uppercase leading-[0.9]">
                Des vêtements pour la vraie vie.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
                BAMED est une boutique de mode homme à Casablanca. Du classique
                au streetwear en passant par le sport, des pièces de qualité
                master, à découvrir en boutique.
              </p>
            </Reveal>
          </DepthLayer>

          {/* Front layer: floating gold shapes */}
          <DepthLayer
            depth={1}
            pointer={50}
            scroll={200}
            className="pointer-events-none absolute right-2 top-0 md:right-16"
          >
            <Float amplitude={14} duration={6}>
              <span
                aria-hidden
                className="block size-20 rounded-full border-2 border-gold md:size-32"
              />
            </Float>
          </DepthLayer>
          <DepthLayer
            depth={0.8}
            pointer={40}
            scroll={160}
            className="pointer-events-none absolute bottom-0 right-1/3"
          >
            <Float amplitude={10} duration={4.5} delay={1}>
              <span
                aria-hidden
                className="block size-4 rounded-full bg-gold md:size-6"
              />
            </Float>
          </DepthLayer>
        </DepthStage>
      </section>


      <section className="bg-background pb-16 md:pb-24">
        <div className="mx-auto grid w-full max-w-[1440px] items-start gap-10 px-5 md:px-10 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-5">
            <ImagePlaceholder
              src={images.editorial.src}
              alt={images.editorial.alt}
              ratio="4 / 5"
              label="Photo éditoriale 4:5"
              kind="editorial"
              sizes="(min-width:1024px) 40vw, 100vw"
            />
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7 lg:pt-10">
            <h2 className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl">
              Notre histoire
            </h2>
            <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              <p>
                BAMED est née d&apos;un constat simple : trouver une pièce bien
                coupée, de bonne qualité, ne devrait pas être un parcours du
                combattant.
              </p>
              <p>
                Notre boutique, à Sidi Bernoussi, propose trois univers : le
                classique pour soigner sa tenue, le streetwear pour le
                quotidien, et le sport pour bouger. La plupart de nos articles
                sont importés de Chine et de Turquie, en qualité master.
              </p>
              <p>
                Ce site est notre vitrine : retrouvez nos pièces, leurs couleurs
                et leurs tailles, puis passez les essayer en boutique.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <StoryTimeline />

      <section className="bg-muted py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Trois univers
            </p>
            <h2 className="max-w-3xl font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl">
              Classe, street, sport
            </h2>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-x-12 gap-y-12 md:mt-16 md:grid-cols-3">
            {universes.map(({ title, text }) => (
              <RevealItem key={title}>
                <span className="block h-px w-10 bg-gold" aria-hidden />
                <h3 className="mt-5 font-display text-4xl font-bold uppercase leading-none md:text-5xl">
                  {title}
                </h3>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section
        aria-labelledby="nous-trouver"
        className="bg-background py-16 md:py-24"
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Boutique
            </p>
            <h2
              id="nous-trouver"
              className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl"
            >
              Nous trouver
            </h2>
          </Reveal>

          <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-8">
              <StoreMap className="h-[380px] md:h-[480px]" />
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-4">
              <dl className="divide-y divide-border border-y border-border">
                {infos.map(({ label, value }) => (
                  <div
                    key={label}
                    className="grid grid-cols-[6rem_1fr] gap-4 py-5"
                  >
                    <dt className="text-sm font-semibold">{label}</dt>
                    <dd className="text-sm text-muted-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-muted py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <h2 className="max-w-3xl font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl">
              Ce qui compte pour nous
            </h2>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-x-16 gap-y-14 sm:grid-cols-2 md:mt-16">
            {values.map(({ title, text }) => (
              <RevealItem key={title}>
                <span className="block h-px w-10 bg-gold" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold tracking-tight md:text-2xl">
                  {title}
                </h3>
                <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <ClosingCta />
    </main>
  );
}