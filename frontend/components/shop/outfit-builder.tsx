"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Sparkles } from "lucide-react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { formatNumber, type Product, type ProductColor } from "@/lib/products";
import {
  buildOutfits,
  slotLabels,
  slotOf,
  slotOrder,
  type Outfit,
  type OutfitResult,
  type Slot,
} from "@/lib/outfit";
import { cn } from "@/lib/utils";

/* ---------- One suggested look ---------- */

function LookCard({
  index,
  outfit,
  pools,
}: {
  index: number;
  outfit: Outfit;
  pools: OutfitResult["pools"];
}) {
  const [selection, setSelection] = useState(outfit.selection);

  const items = slotOrder.flatMap((slot) => {
    const pool = pools[slot];
    const i = selection[slot];
    if (!pool || i === undefined) return [];
    return [{ slot, pick: pool[i % pool.length], size: pool.length }];
  });

  const total = items.reduce((sum, it) => sum + it.pick.product.price, 0);

  const swap = (slot: Slot, size: number) =>
    setSelection((s) => ({ ...s, [slot]: ((s[slot] ?? 0) + 1) % size }));

  return (
    <article className="rounded-xl bg-background p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-3xl font-bold uppercase leading-none md:text-4xl">
          Look {index + 1}
        </h3>
        <p className="text-sm font-semibold tabular-nums">
          {formatNumber(total)} MAD
        </p>
      </div>

      <ul
        className={cn(
          "mt-4 grid gap-3",
          items.length >= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {items.map(({ slot, pick, size }) => {
          const { product, color } = pick;
          const cover = color.images[0];
          return (
            <li key={slot} className="relative">
              <div className="relative overflow-hidden rounded-lg bg-muted">
                <ImagePlaceholder
                  src={cover?.src}
                  alt={cover?.alt || `${product.name}, ${color.name}`}
                  ratio="4 / 5"
                  label={slotLabels[slot]}
                  kind="product"
                  sizes="(min-width:1024px) 15vw, 45vw"
                  rounded={false}
                />
                {size > 1 && (
                  <button
                    type="button"
                    onClick={() => swap(slot, size)}
                    aria-label={`Changer : ${slotLabels[slot]}`}
                    className="absolute right-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:bg-background"
                  >
                    <RefreshCw className="size-4" aria-hidden />
                  </button>
                )}
              </div>

              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {slotLabels[slot]}
              </p>
              <Link
                href={`/boutique/${encodeURIComponent(product.id)}?couleur=${encodeURIComponent(color.name)}`}
                className="block text-sm font-semibold leading-snug underline-offset-4 hover:underline"
              >
                {product.name}
              </Link>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  aria-hidden
                  className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.4)]"
                  style={{ backgroundColor: color.hex }}
                />
                {color.name} · {formatNumber(product.price)} MAD
              </p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

/* ---------- Section ---------- */

export function OutfitBuilder({
  products,
  colors,
}: {
  products: Product[];
  colors: ProductColor[];
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  // Only offer colours that can actually make an outfit
  const options = useMemo(
    () => colors.filter((c) => buildOutfits(products, c).outfits.length > 0),
    [products, colors],
  );

  const result = useMemo(() => {
    const color = options.find((c) => c.name === chosen);
    return color ? buildOutfits(products, color) : null;
  }, [products, options, chosen]);

  const usable = products.filter((p) => slotOf(p) !== null).length;
  if (usable < 2 || options.length === 0) return null;

  return (
    <section
      id="looks"
      aria-labelledby="looks-title"
      className="scroll-mt-24 bg-muted py-12 md:py-16"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <Sparkles className="size-3.5 text-gold" aria-hidden />
          Suggestion de looks
        </p>
        <h2
          id="looks-title"
          className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl"
        >
          Composez votre look
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Choisissez une couleur, on vous propose des tenues complètes qui
          vont bien ensemble. Changez chaque pièce jusqu&apos;à trouver la
          bonne.
        </p>

        <div
          role="group"
          aria-label="Couleur du look"
          className="mt-6 flex flex-wrap gap-3"
        >
          {options.map((c) => {
            const on = chosen === c.name;
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                aria-label={c.name}
                title={c.name}
                onClick={() => setChosen(on ? null : c.name)}
                style={{ backgroundColor: c.hex }}
                className={cn(
                  "size-11 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.35)] ring-offset-2 ring-offset-muted transition-shadow",
                  on && "ring-2 ring-foreground",
                )}
              />
            );
          })}
        </div>

        {chosen && result && (
          <>
            <p aria-live="polite" className="mt-6 text-sm text-muted-foreground">
              {result.outfits.length} look{result.outfits.length > 1 ? "s" : ""}{" "}
              en <span className="font-semibold text-foreground">{chosen}</span>
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {result.outfits.map((o, i) => (
                // key includes the colour: swaps reset when the colour changes
                <LookCard
                  key={`${chosen}-${o.id}`}
                  index={i}
                  outfit={o}
                  pools={result.pools}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}