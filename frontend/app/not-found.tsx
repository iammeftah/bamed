import type { Metadata } from "next";
import { CtaButton } from "@/components/landing/cta-button";

export const metadata: Metadata = { title: "Page introuvable | BAMED" };

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col justify-center bg-background pb-16 pt-28 md:pt-36">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Erreur 404
        </p>
        <h1 className="max-w-5xl font-display text-[length:clamp(3.5rem,13vw,11rem)] font-bold uppercase leading-[0.9]">
          Page introuvable.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <CtaButton href="/" variant="gold" arrow>
            Retour à l&apos;accueil
          </CtaButton>
          <CtaButton href="/boutique" variant="dark">
            Voir la boutique
          </CtaButton>
        </div>
      </div>
    </main>
  );
}