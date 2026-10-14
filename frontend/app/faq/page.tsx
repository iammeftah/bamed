import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { CtaButton } from "@/components/landing/cta-button";
import { Reveal } from "@/components/landing/reveal";

export const metadata: Metadata = {
  title: "Questions fréquentes | BAMED",
  description:
    "Les réponses aux questions les plus courantes sur la vitrine BAMED : tailles, prix, nouveautés et promotions.",
};

const faqs: { question: string; answer: ReactNode }[] = [
  {
    question: "Puis-je commander sur le site ?",
    answer:
      "Non. Le site est une vitrine : vous y découvrez les pièces, leurs couleurs, leurs prix et leurs tailles. Il n'y a ni panier, ni paiement en ligne.",
  },
  {
    question: "Comment acheter une pièce que j'ai vue sur le site ?",
    answer:
      "Notez le nom de la pièce, sa couleur et votre taille, puis venez la découvrir en boutique.",
  },
  {
    question: "Comment trouver ma taille ?",
    answer: (
      <>
        Consultez notre{" "}
        <Link
          href="/guide-des-tailles"
          className="font-semibold text-foreground underline underline-offset-4"
        >
          guide des tailles
        </Link>
        . Il explique comment se mesurer et donne les équivalences pour les
        pantalons, les jeans et les chaussures.
      </>
    ),
  },
  {
    question: "Les prix sont-ils en dirhams ?",
    answer: "Oui, tous les prix affichés sont en dirhams marocains (MAD).",
  },
  {
    question: "Que signifient les étiquettes « Nouveau » et « Promo » ?",
    answer:
      "« Nouveau » signale une pièce récemment arrivée. « Promo » indique un prix réduit : l'ancien prix est barré à côté du prix actuel.",
  },
  {
    question: "Une pièce est-elle toujours disponible ?",
    answer:
      "Le stock évolue au fil des ventes : une taille ou une couleur peut être épuisée en boutique.",
  },
  {
    question: "Comment retrouver une pièce rapidement ?",
    answer:
      "Dans la boutique, utilisez la recherche, les catégories et les filtres par taille, couleur, prix, promotion ou nouveautés.",
  },
];

export default function FaqPage() {
  return (
    <main className="overflow-x-clip">
      <section className="bg-background pb-12 pt-28 md:pb-20 md:pt-40">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Aide
            </p>
            <h1 className="max-w-5xl font-display text-[length:clamp(3.5rem,12vw,10rem)] font-bold uppercase leading-[0.9]">
              Questions fréquentes.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
              Tout ce qu&apos;il faut savoir pour bien utiliser la vitrine BAMED.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-background pb-16 md:pb-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <div className="max-w-3xl divide-y divide-border border-y border-border">
              {faqs.map(({ question, answer }) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold tracking-tight md:text-xl [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown
                      className="size-5 shrink-0 transition-transform duration-300 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                    {answer}
                  </p>
                </details>
              ))}
            </div>

            <div className="mt-10">
              <CtaButton href="/boutique" variant="dark" arrow>
                Voir la boutique
              </CtaButton>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}