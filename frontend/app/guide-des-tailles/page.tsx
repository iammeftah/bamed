import type { Metadata } from "next";
import { CtaButton } from "@/components/landing/cta-button";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";
import { sizeScales } from "@/lib/sizes";

export const metadata: Metadata = {
  title: "Guide des tailles | BAMED",
  description:
    "Comment se mesurer et choisir sa taille chez BAMED : lettres, pantalons, jeans et chaussures.",
};

const tips = [
  {
    title: "Haut du corps",
    text: "Mesurez le tour de poitrine à l'endroit le plus large, sous les bras, le mètre bien à plat.",
  },
  {
    title: "Tour de taille",
    text: "Mesurez à hauteur du nombril, sur la peau ou sur un vêtement fin, sans serrer.",
  },
  {
    title: "Pointure",
    text: "Posez le pied sur une feuille, tracez son contour et mesurez du talon au bout du plus long orteil.",
  },
  {
    title: "Entre deux tailles",
    text: "Choisissez selon la coupe que vous aimez : plus ajustée ou plus ample.",
  },
];

/** Pants are sold in EU/FR sizes and jeans in inches: the rule is FR minus 10 (38 = W28). */
const pantsToJeans = sizeScales.pants.sizes.map((fr) => ({
  fr,
  w: String(Number(fr) - 10),
}));

const chip =
  "inline-flex h-10 min-w-11 items-center justify-center rounded-md bg-muted px-3 text-sm font-semibold";

function Sizes({ list }: { list: string[] }) {
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {list.map((s) => (
        <li key={s} className={chip}>
          {s}
        </li>
      ))}
    </ul>
  );
}

export default function SizeGuidePage() {
  const { letters, jeans, shoes } = sizeScales;

  return (
    <main className="overflow-x-clip">
      <section className="bg-background pb-12 pt-28 md:pb-20 md:pt-40">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Aide
            </p>
            <h1 className="max-w-5xl font-display text-[length:clamp(3.5rem,12vw,10rem)] font-bold uppercase leading-[0.9]">
              Guide des tailles.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
              Chaque catégorie a sa propre échelle. Repérez la vôtre avant de
              choisir votre pièce.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-muted py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <h2 className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl">
              Bien se mesurer
            </h2>
          </Reveal>
          <RevealGroup className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {tips.map(({ title, text }) => (
              <RevealItem key={title}>
                <span className="block h-px w-10 bg-gold" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-14 px-5 md:px-10 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {letters.title} : {letters.short}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {letters.hint}
            </p>
            <Sizes list={letters.sizes} />
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {shoes.title}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">{shoes.hint}</p>
            <Sizes list={shoes.sizes} />
          </Reveal>

          <Reveal className="lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Pantalons et jeans
            </h2>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              {jeans.hint} Les pantalons se choisissent en taille européenne
              (française), les jeans en tour de taille (W).
            </p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[480px] text-left text-sm">
                <caption className="sr-only">
                  Équivalence entre la taille européenne et le tour de taille en
                  pouces
                </caption>
                <thead>
                  <tr className="bg-muted">
                    <th scope="row" className="px-4 py-3 font-semibold">
                      Pantalon (EU / FR)
                    </th>
                    {pantsToJeans.map(({ fr }) => (
                      <td
                        key={fr}
                        className="px-4 py-3 text-center font-semibold tabular-nums"
                      >
                        {fr}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-semibold">
                      Jean (tour de taille W)
                    </th>
                    {pantsToJeans.map(({ fr, w }) => (
                      <td
                        key={fr}
                        className="px-4 py-3 text-center tabular-nums"
                      >
                        W{w}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-background pb-16 md:pb-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <CtaButton href="/boutique" variant="dark" arrow>
            Voir la boutique
          </CtaButton>
        </div>
      </section>
    </main>
  );
}