"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-svh flex-col justify-center bg-background pb-16 pt-28 md:pt-36">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Erreur
        </p>
        <h1 className="max-w-5xl font-display text-[length:clamp(3.5rem,13vw,11rem)] font-bold uppercase leading-[0.9]">
          Un souci est survenu.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Quelque chose s&apos;est mal passé de notre côté. Réessayez dans un
          instant.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Référence : <span className="tabular-nums">{error.digest}</span>
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md bg-gold px-4 text-sm font-semibold whitespace-nowrap text-gold-foreground transition-colors hover:bg-gold/90 active:scale-[0.98]"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-semibold whitespace-nowrap text-background transition-colors hover:bg-foreground/90 active:scale-[0.98]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}