// frontend/components/shop/outfit-builder.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Shuffle, X } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { SwitchingImage } from "@/components/shop/product-media";
import { formatMAD, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

type Slot = "layer" | "top" | "bottom" | "shoes";

const SLOT_LABEL: Record<Slot, string> = {
  layer: "Veste",
  top: "Haut",
  bottom: "Bas",
  shoes: "Chaussures",
};

/** Category slug -> slot of the look. Unknown categories (accessoires...) are ignored. */
const SLOT_OF_TYPE: Record<string, Slot> = {
  chemises: "top",
  "t-shirts": "top",
  polos: "top",
  maille: "top",
  hoodies: "top",
  vestes: "layer",
  pantalons: "bottom",
  jeans: "bottom",
  sneakers: "shoes",
};

const ORDER: Slot[] = ["layer", "top", "bottom", "shoes"];

/** Default pick per slot for a given shuffle number, so each shuffle gives a new look. */
function defaultIndex(slot: Slot, seed: number, len: number) {
  const step = { layer: 1, top: 1, bottom: 2, shoes: 3 }[slot];
  const shift = { layer: 1, top: 0, bottom: 1, shoes: 2 }[slot];
  return (seed * step + shift) % len;
}

type Pick = { p: number; c: number };

export function OutfitBuilder({ products }: { products: Product[] }) {
  const pools = useMemo(() => {
    const map: Record<Slot, Product[]> = {
      layer: [],
      top: [],
      bottom: [],
      shoes: [],
    };
    for (const p of products) {
      const slot = SLOT_OF_TYPE[p.type];
      if (slot && p.colors.length > 0) map[slot].push(p);
    }
    return map;
  }, [products]);

  const [seed, setSeed] = useState(0);
  const [picks, setPicks] = useState<Partial<Record<Slot, Pick>>>({});
  const [layerOn, setLayerOn] = useState(false);

  // A look needs at least a top and a bottom
  if (pools.top.length === 0 || pools.bottom.length === 0) return null;

  const hasLayer = pools.layer.length > 0;
  const hasShoes = pools.shoes.length > 0;

  const active: Slot[] = ORDER.filter((s) => {
    if (s === "layer") return hasLayer && layerOn;
    if (s === "shoes") return hasShoes;
    return true;
  });

  function resolve(slot: Slot) {
    const pool = pools[slot];
    const pick = picks[slot];
    const p = pick ? pick.p % pool.length : defaultIndex(slot, seed, pool.length);
    const product = pool[p];
    const c = Math.min(pick?.c ?? 0, product.colors.length - 1);
    return { product, p, c, color: product.colors[c] };
  }

  const items = active.map((slot) => ({ slot, ...resolve(slot) }));
  const total = items.reduce((sum, i) => sum + i.product.price, 0);
  const byslot = Object.fromEntries(items.map((i) => [i.slot, i])) as Partial<
    Record<Slot, (typeof items)[number]>
  >;

  function shuffle() {
    setSeed((s) => s + 1);
    setPicks({});
  }

  function step(slot: Slot, dir: 1 | -1) {
    const len = pools[slot].length;
    const current = resolve(slot).p;
    setPicks((x) => ({ ...x, [slot]: { p: (current + dir + len) % len, c: 0 } }));
  }

  function setColor(slot: Slot, c: number) {
    const current = resolve(slot).p;
    setPicks((x) => ({ ...x, [slot]: { p: current, c } }));
  }

  const href = (i: (typeof items)[number]) =>
    `/boutique/${encodeURIComponent(i.product.id)}?couleur=${encodeURIComponent(i.color.name)}`;

  function Tile({
    slot,
    className,
  }: {
    slot: Slot;
    className?: string;
  }) {
    const i = byslot[slot];
    if (!i) return null;
    const image = i.color.images[0] ?? { src: "", alt: i.product.name };
    return (
      <Link
        href={href(i)}
        className={cn(
          "group relative isolate block overflow-hidden rounded-xl bg-background",
          className,
        )}
      >
        <SwitchingImage
          image={image}
          label={SLOT_LABEL[slot]}
          sizes="(min-width:1024px) 25vw, 50vw"
        />
        <span className="absolute bottom-2 left-2 z-10 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
          {SLOT_LABEL[slot]}
        </span>
        <span className="sr-only">
          {i.product.name}, {i.color.name}
        </span>
      </Link>
    );
  }

  const layerItem = byslot.layer;
  const layerImage = layerItem?.color.images[0] ?? {
    src: "",
    alt: layerItem?.product.name ?? "",
  };

  return (
    <section
      aria-labelledby="outfit-title"
      className="bg-muted py-16 md:py-24"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Composez
            </p>
            <h2
              id="outfit-title"
              className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl"
            >
              Votre look du jour
            </h2>
          </div>
          <button
            type="button"
            onClick={shuffle}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-gold-foreground transition-colors hover:bg-gold/90 active:scale-[0.98]"
          >
            <Shuffle className="size-4" aria-hidden />
            Autre look
          </button>
        </Reveal>

        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Board */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto grid aspect-[4/5] w-full max-w-xl grid-cols-2 grid-rows-2 gap-2">
              <div className="relative row-span-2">
                <Tile slot="top" className="h-full w-full" />
                {layerItem && (
                  <Link
                    href={href(layerItem)}
                    className="absolute bottom-2 left-2 z-20 block aspect-[4/5] w-[42%] overflow-hidden rounded-xl border-2 border-gold bg-background shadow-[0_10px_30px_rgb(0_0_0/0.25)]"
                  >
                    <SwitchingImage
                      image={layerImage}
                      label="Veste"
                      sizes="20vw"
                    />
                    <span className="sr-only">
                      {layerItem.product.name}, {layerItem.color.name}
                    </span>
                  </Link>
                )}
              </div>
              <Tile
                slot="bottom"
                className={cn("h-full w-full", !hasShoes && "row-span-2")}
              />
              {hasShoes && <Tile slot="shoes" className="h-full w-full" />}
            </div>
          </div>

          {/* Panel */}
          <div className="lg:col-span-6">
            <ul className="divide-y divide-border border-y border-border">
              {items.map((i) => (
                <li key={i.slot} className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {SLOT_LABEL[i.slot]}
                      </p>
                      <Link
                        href={href(i)}
                        className="mt-1 block text-lg font-semibold tracking-tight underline-offset-4 hover:underline"
                      >
                        {i.product.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {i.color.name}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="font-display text-3xl font-bold leading-none tabular-nums">
                        {formatMAD(i.product.price)}
                      </p>
                      <div className="flex items-center gap-1">
                        {pools[i.slot].length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => step(i.slot, -1)}
                              aria-label={`${SLOT_LABEL[i.slot]} précédent`}
                              className="flex size-9 items-center justify-center rounded-md bg-background transition-colors hover:bg-foreground/10"
                            >
                              <ChevronLeft className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => step(i.slot, 1)}
                              aria-label={`${SLOT_LABEL[i.slot]} suivant`}
                              className="flex size-9 items-center justify-center rounded-md bg-background transition-colors hover:bg-foreground/10"
                            >
                              <ChevronRight className="size-4" aria-hidden />
                            </button>
                          </>
                        )}
                        {i.slot === "layer" && (
                          <button
                            type="button"
                            onClick={() => setLayerOn(false)}
                            aria-label="Retirer la veste"
                            className="flex size-9 items-center justify-center rounded-md bg-background transition-colors hover:bg-foreground/10"
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {i.product.colors.length > 1 && (
                    <ul
                      aria-label={`Couleurs, ${SLOT_LABEL[i.slot]}`}
                      className="mt-3 flex items-center gap-2"
                    >
                      {i.product.colors.map((c, n) => (
                        <li key={c.name}>
                          <button
                            type="button"
                            title={c.name}
                            aria-label={c.name}
                            aria-pressed={n === i.c}
                            onClick={() => setColor(i.slot, n)}
                            style={{ backgroundColor: c.hex }}
                            className={cn(
                              "relative block size-5 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.4)] ring-offset-2 ring-offset-muted transition-shadow after:absolute after:-inset-1.5 after:content-['']",
                              n === i.c && "ring-2 ring-foreground",
                            )}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            {hasLayer && !layerOn && (
              <button
                type="button"
                onClick={() => setLayerOn(true)}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold transition-colors hover:bg-background"
              >
                <Plus className="size-4" aria-hidden />
                Ajouter une veste
              </button>
            )}

            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Total du look
                </p>
                <p className="mt-1 font-display text-5xl font-bold leading-none tabular-nums md:text-6xl">
                  {formatMAD(total)}
                </p>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Notez les pièces, puis passez les essayer en boutique.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}