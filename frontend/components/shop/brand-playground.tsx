"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { Reveal } from "@/components/landing/reveal";
import { BrandLogo } from "@/components/shop/brand-logo";
import {
  coverImage,
  formatMAD,
  type Product,
  type StoreBrand,
} from "@/lib/products";
import { cn } from "@/lib/utils";

type Slot = "layer" | "top" | "bottom" | "shoes";

const SLOT_LABEL: Record<Slot, string> = {
  layer: "Veste",
  top: "Haut",
  bottom: "Bas",
  shoes: "Chaussures",
};

const ORDER: Slot[] = ["layer", "top", "bottom", "shoes"];

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

type Pick = { id: string; color: string };
type Point = { x: number; y: number };

/* ---------- A draggable piece ---------- */

function PieceTile({
  product,
  color,
  picked,
  onPick,
  onColor,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  product: Product;
  color: string;
  picked: boolean;
  onPick: () => void;
  onColor: (name: string) => void;
  onDragStart: () => void;
  onDragMove: (point: Point) => void;
  onDragEnd: (point: Point) => void;
}) {
  const image = coverImage(product, color);
  // A drag ends with a click event on the same element: this flag swallows it
  const moved = useRef(false);

  return (
    <motion.div
      drag
      dragSnapToOrigin
      dragElastic={0.15}
      dragMomentum={false}
      whileDrag={{ scale: 1.05, zIndex: 50, cursor: "grabbing" }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      onDragStart={() => {
        moved.current = true;
        onDragStart();
      }}
      onDrag={(_, info) => onDragMove(info.point)}
      onDragEnd={(_, info) => {
        onDragEnd(info.point);
        window.setTimeout(() => (moved.current = false), 0);
      }}
      className="relative flex cursor-grab flex-col gap-2"
    >
      <button
        type="button"
        onClick={() => {
          if (!moved.current) onPick();
        }}
        aria-pressed={picked}
        className="block overflow-hidden rounded-xl bg-muted"
      >
        <ImagePlaceholder
          src={image.src}
          alt={image.alt}
          ratio="4 / 5"
          label={product.name}
          kind="product"
          sizes="(min-width:1024px) 20vw, 45vw"
          rounded={false}
          className={cn(
            "pointer-events-none transition-opacity",
            picked && "opacity-50",
          )}
        />
        <span className="sr-only">
          {picked ? "Retirer" : "Choisir"} {product.name}
        </span>
      </button>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            {product.name}
          </p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {formatMAD(product.price)}
          </p>
        </div>
        {product.colors.length > 1 && (
          <ul aria-label="Couleurs" className="flex shrink-0 gap-1.5 pt-1">
            {product.colors.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={c.name === color}
                  onClick={() => onColor(c.name)}
                  style={{ backgroundColor: c.hex }}
                  className={cn(
                    "relative block size-4 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.4)] ring-offset-2 ring-offset-background after:absolute after:-inset-1.5 after:content-['']",
                    c.name === color && "ring-1 ring-foreground",
                  )}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Playground: a line of brands. Click a brand, then drag a piece (top,
 * trousers, sneakers...) into "Mon look". Switch brand and keep building.
 */
export function BrandPlayground({
  products,
  brands,
}: {
  products: Product[];
  brands: StoreBrand[];
}) {
  // Pieces that can go in a look, grouped by brand then by slot
  const byBrand = useMemo(() => {
    const map = new Map<string, Record<Slot, Product[]>>();
    for (const p of products) {
      const slot = SLOT_OF_TYPE[p.type];
      if (!slot || !p.brandId || p.colors.length === 0) continue;
      const entry =
        map.get(p.brandId) ??
        ({ layer: [], top: [], bottom: [], shoes: [] } as Record<Slot, Product[]>);
      entry[slot].push(p);
      map.set(p.brandId, entry);
    }
    return map;
  }, [products]);

  const list = brands.filter((b) => byBrand.has(b.id));

  const [brandId, setBrandId] = useState<string>(list[0]?.id ?? "");
  const [slot, setSlot] = useState<Slot>("top");
  const [picks, setPicks] = useState<Partial<Record<Slot, Pick>>>({});
  const [tileColor, setTileColor] = useState<Record<string, string>>({});

  // Drag state: which slot is being dragged, and is the pointer over the look
  const [dragging, setDragging] = useState<Slot | null>(null);
  const [over, setOver] = useState(false);
  const lookRef = useRef<HTMLElement>(null);

  if (list.length === 0) return null;

  const brand = list.find((b) => b.id === brandId) ?? list[0];
  const pool = byBrand.get(brand.id)!;
  const slots = ORDER.filter((s) => pool[s].length > 0);
  const activeSlot = slots.includes(slot) ? slot : slots[0];
  const pieces = pool[activeSlot];

  const colorOf = (p: Product) => tileColor[p.id] ?? p.colors[0].name;

  function isOverLook(point: Point) {
    const r = lookRef.current?.getBoundingClientRect();
    if (!r) return false;
    // Motion gives page coordinates, getBoundingClientRect is viewport based
    const x = point.x - window.scrollX;
    const y = point.y - window.scrollY;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function togglePick(p: Product, s: Slot) {
    setPicks((x) => {
      if (x[s]?.id === p.id) {
        const next = { ...x };
        delete next[s];
        return next;
      }
      return { ...x, [s]: { id: p.id, color: colorOf(p) } };
    });
  }

  function dropPick(p: Product, s: Slot) {
    setPicks((x) => ({ ...x, [s]: { id: p.id, color: colorOf(p) } }));
  }

  function changeColor(p: Product, s: Slot, name: string) {
    setTileColor((x) => ({ ...x, [p.id]: name }));
    setPicks((x) =>
      x[s]?.id === p.id ? { ...x, [s]: { id: p.id, color: name } } : x,
    );
  }

  const chosen = ORDER.map((s) => {
    const pick = picks[s];
    const product = pick ? products.find((p) => p.id === pick.id) : undefined;
    return { slot: s, pick, product };
  });
  const total = chosen.reduce((sum, c) => sum + (c.product?.price ?? 0), 0);
  const count = chosen.filter((c) => c.product).length;

  return (
    <section
      aria-labelledby="playground-title"
      className="border-t border-border bg-background py-16 md:py-24"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Terrain de jeu
            </p>
            <h2
              id="playground-title"
              className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl"
            >
              Votre look, vos marques
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Choisissez une marque, puis glissez un haut, un bas ou des sneakers
            dans votre look. Changez de marque pour compléter votre tenue.
          </p>
        </Reveal>

        {/* The line of brands: centered, grayscale */}
        <nav aria-label="Marques du terrain de jeu">
          <ul className="-mx-5 flex gap-8 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0 [scrollbar-width:none]">
            {list.map((b) => {
              const on = b.id === brand.id;
              return (
                <li key={b.id} className="shrink-0 first:ml-auto last:mr-auto">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setBrandId(b.id)}
                    className="group flex w-20 flex-col items-center gap-2 md:w-24"
                  >
                    <span
                      className={cn(
                        "relative block h-14 w-full grayscale transition-opacity duration-300 dark:invert md:h-16",
                        on ? "opacity-100" : "opacity-50 group-hover:opacity-100",
                      )}
                    >
                      <BrandLogo name={b.label} logo={b.logo} sizes="96px" />
                    </span>
                    <span
                      className={cn(
                        "relative w-full truncate pb-1.5 text-center text-xs font-semibold tracking-tight transition-opacity",
                        on ? "opacity-100" : "opacity-60 group-hover:opacity-100",
                      )}
                    >
                      {b.label}
                      {on && (
                        <span
                          aria-hidden
                          className="absolute inset-x-3 bottom-0 h-px bg-gold"
                        />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Pieces of the selected brand */}
          <div className="lg:col-span-7">
            <div
              role="tablist"
              aria-label={`Pièces ${brand.label}`}
              className="flex overflow-x-auto border-b border-border [scrollbar-width:none]"
            >
              {slots.map((s) => {
                const on = s === activeSlot;
                return (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setSlot(s)}
                    className={cn(
                      "relative shrink-0 whitespace-nowrap px-3 py-3 text-[13px] font-semibold tracking-tight transition-opacity first:-ml-3",
                      on ? "opacity-100" : "opacity-60 hover:opacity-100",
                    )}
                  >
                    {SLOT_LABEL[s]}
                    <span className="ml-1.5 text-[11px] font-medium tabular-nums opacity-60">
                      {pool[s].length}
                    </span>
                    {on && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 -bottom-px h-px bg-gold"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-4">
              {pieces.map((p) => (
                <PieceTile
                  key={p.id}
                  product={p}
                  color={colorOf(p)}
                  picked={picks[activeSlot]?.id === p.id}
                  onPick={() => togglePick(p, activeSlot)}
                  onColor={(name) => changeColor(p, activeSlot, name)}
                  onDragStart={() => setDragging(activeSlot)}
                  onDragMove={(pt) => setOver(isOverLook(pt))}
                  onDragEnd={(pt) => {
                    if (isOverLook(pt)) dropPick(p, activeSlot);
                    setDragging(null);
                    setOver(false);
                  }}
                />
              ))}
            </div>
          </div>

          {/* The look: drop zone */}
          <aside
            ref={lookRef}
            aria-label="Votre look"
            className="lg:sticky lg:top-28 lg:col-span-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-3xl font-bold uppercase leading-none">
                Mon look
              </p>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => setPicks({})}
                  className="text-sm font-semibold underline underline-offset-4"
                >
                  Vider
                </button>
              )}
            </div>

            <ul className="mt-5 divide-y divide-border border-y border-border">
              {chosen.map(({ slot: s, pick, product }) => {
                const color = product?.colors.find((c) => c.name === pick?.color);
                const image = product ? coverImage(product, pick?.color) : null;
                const target = dragging === s;
                return (
                  <li
                    key={s}
                    className={cn(
                      "-mx-2 flex items-center gap-3 rounded-lg border border-dashed px-2 py-3 transition-colors",
                      target
                        ? over
                          ? "border-gold bg-gold/10"
                          : "border-gold/50"
                        : "border-transparent",
                    )}
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                      {product && image ? (
                        <motion.div
                          key={`${product.id}-${pick?.color}`}
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 24,
                          }}
                          className="absolute inset-0"
                        >
                          <ImagePlaceholder
                            src={image.src}
                            alt={image.alt}
                            ratio="fill"
                            label=""
                            kind="product"
                            sizes="64px"
                            rounded={false}
                          />
                        </motion.div>
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {SLOT_LABEL[s]}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {SLOT_LABEL[s]}
                      </p>
                      {product ? (
                        <>
                          <Link
                            href={`/boutique/${encodeURIComponent(product.id)}${
                              color ? `?couleur=${encodeURIComponent(color.name)}` : ""
                            }`}
                            className="block truncate text-sm font-semibold underline-offset-4 hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {product.brand ? `${product.brand} · ` : ""}
                            {color?.name}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {target ? "Déposez ici" : "Pas encore choisi"}
                        </p>
                      )}
                    </div>

                    {product && (
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatMAD(product.price)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Retirer ${product.name}`}
                          onClick={() =>
                            setPicks((x) => {
                              const next = { ...x };
                              delete next[s];
                              return next;
                            })
                          }
                          className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-foreground/10"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Total du look
              </p>
              <p className="mt-1 font-display text-5xl font-bold leading-none tabular-nums">
                {formatMAD(total)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Notez les pièces, puis passez les essayer en boutique.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}