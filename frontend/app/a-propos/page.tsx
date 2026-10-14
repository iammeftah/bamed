import type { Metadata } from "next";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { ClosingCta } from "@/components/landing/closing-cta";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";
import { images } from "@/lib/products";

export const metadata: Metadata = {
  title: "À propos | BAMED",
  description:
    "BAMED habille les hommes qui veulent bien s'habiller sans y passer des heures.",
};

const values = [
  {
    title: "Des coupes nettes",
    text: "Des lignes simples et précises, pensées pour tomber juste sur la plupart des morphologies.",
  },
  {
    title: "Des matières honnêtes",
    text: "Coton, lin, laine : des fibres choisies pour leur confort et leur tenue dans le temps.",
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

export default function AProposPage() {
  return (
    <main className="overflow-x-clip">
      <section className="bg-background pb-12 pt-28 md:pb-20 md:pt-40">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <h1 className="max-w-5xl font-display text-[length:clamp(3.5rem,12vw,10rem)] font-bold uppercase leading-[0.9]">
              Des vêtements pour la vraie vie.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
              BAMED habille les hommes qui veulent bien s&apos;habiller sans y
              passer des heures. Des coupes nettes, des matières honnêtes, des
              prix lisibles.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-background pb-16 md:pb-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <ImagePlaceholder
              src={images.hero.src}
              alt={images.hero.alt}
              ratio="16 / 9"
              label="Photo À propos 16:9"
              kind="hero"
              tone="dark"
              sizes="(min-width:1440px) 1360px, 100vw"
            />
          </Reveal>
        </div>
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
                BAMED est partie d&apos;un constat simple : trouver une chemise
                bien coupée ne devrait pas être un parcours du combattant.
              </p>
              <p>
                Nous dessinons des basiques qui vont ensemble, dans des tons
                sobres, avec des finitions soignées. Chaque pièce doit se
                porter dès le premier jour, et le rester longtemps.
              </p>
              <p>
                Ce site est notre vitrine : retrouvez nos pièces, leurs couleurs
                et leurs tailles, puis consultez le guide des tailles avant de
                choisir.
              </p>
            </div>
          </Reveal>
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