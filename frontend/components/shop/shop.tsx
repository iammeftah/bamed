"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/landing/product-card";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { cn } from "@/lib/utils";
import {
  formatNumber,
  productTypes,
  products,
  type Product,
  type ProductColor,
  type ProductType,
} from "@/lib/products";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Sort = "pertinence" | "nouveautes" | "prix-asc" | "prix-desc";

type Filters = {
  query: string;
  type: ProductType | "tous";
  sizes: string[];
  colors: string[];
  maxPrice: number;
  saleOnly: boolean;
};

const priceCeiling =
  Math.ceil(Math.max(...products.map((p) => p.price)) / 100) * 100;

const sizeOrder = ["S", "M", "L", "XL", "38", "40", "42", "44"];
const allSizes = sizeOrder.filter((s) => products.some((p) => p.sizes.includes(s)));

const allColors: ProductColor[] = [];
for (const p of products) {
  for (const c of p.colors) {
    if (!allColors.some((x) => x.name === c.name)) allColors.push(c);
  }
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

/* ---------- Featured bento (3 products: 1 large + 2 stacked) ---------- */

function FeaturedCard({
  product,
  big,
  className,
}: {
  product: Product;
  big?: boolean;
  className?: string;
}) {
  return (
    <a
      href="#"
      className={cn(
        "group relative block aspect-[4/5] overflow-hidden bg-muted sm:aspect-[16/10] lg:aspect-auto",
        className,
      )}
    >
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
        <ImagePlaceholder
          src={product.image}
          alt={product.alt}
          ratio="fill"
          label="Photo produit"
          kind="product"
          tone="dark"
          sizes={big ? "(min-width:1024px) 66vw, 100vw" : "(min-width:1024px) 33vw, 100vw"}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
          {product.category}
        </p>
        <h3
          className={cn(
            "mt-1 font-display font-bold uppercase leading-[0.95]",
            big ? "text-4xl md:text-6xl" : "text-3xl md:text-4xl",
          )}
        >
          {product.name}
        </h3>
        <p className="mt-3 flex items-baseline gap-3 font-display text-3xl font-bold leading-none tabular-nums md:text-4xl">
          {formatNumber(product.price)}
          <span className="font-sans text-sm font-bold">MAD</span>
          {product.oldPrice && (
            <span className="font-sans text-base font-medium text-white/70 line-through">
              {formatNumber(product.oldPrice)}
            </span>
          )}
        </p>
      </div>
    </a>
  );
}

/* ---------- Filters panel (sidebar on desktop, bottom sheet on mobile) ---------- */

function FiltersPanel({
  filters,
  update,
  onReset,
  activeCount,
}: {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  onReset: () => void;
  activeCount: number;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold">Tailles</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {allSizes.map((s) => {
            const on = filters.sizes.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => update({ sizes: toggle(filters.sizes, s) })}
                className={cn(
                  "h-10 min-w-11 rounded-full px-3 text-sm font-semibold transition-colors",
                  on
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground hover:bg-foreground/10",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Couleurs</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {allColors.map((c) => {
            const on = filters.colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                aria-label={c.name}
                title={c.name}
                onClick={() => update({ colors: toggle(filters.colors, c.name) })}
                style={{ backgroundColor: c.hex }}
                className={cn(
                  "size-9 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.35)] ring-offset-2 ring-offset-background transition-shadow",
                  on && "ring-2 ring-foreground",
                )}
              />
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="prix-max" className="text-sm font-semibold">
            Prix maximum
          </label>
          <span className="text-sm font-semibold tabular-nums">
            {formatNumber(filters.maxPrice)} MAD
          </span>
        </div>
        <input
          id="prix-max"
          type="range"
          min={100}
          max={priceCeiling}
          step={10}
          value={filters.maxPrice}
          onChange={(e) => update({ maxPrice: Number(e.target.value) })}
          className="mt-4 w-full accent-[var(--gold)]"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={filters.saleOnly}
          onChange={(e) => update({ saleOnly: e.target.checked })}
          className="size-5 accent-[var(--gold)]"
        />
        En promotion
      </label>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold underline underline-offset-4"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}

/* ---------- Shop ---------- */

export function Shop({ initialType }: { initialType?: string }) {
  const startType = productTypes.some((t) => t.id === initialType)
    ? (initialType as ProductType)
    : "tous";

  const baseFilters: Filters = {
    query: "",
    type: "tous",
    sizes: [],
    colors: [],
    maxPrice: priceCeiling,
    saleOnly: false,
  };

  const [filters, setFilters] = useState<Filters>({ ...baseFilters, type: startType });
  const [sort, setSort] = useState<Sort>("pertinence");
  const [drawer, setDrawer] = useState(false);

  const update = (patch: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters(baseFilters);

  // Lock page scroll and allow Escape while the mobile sheet is open
  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const activeCount =
    filters.sizes.length +
    filters.colors.length +
    (filters.maxPrice < priceCeiling ? 1 : 0) +
    (filters.saleOnly ? 1 : 0);

  const isFiltering =
    activeCount > 0 || filters.type !== "tous" || filters.query.trim() !== "";

  const filtered = useMemo(() => {
    const q = normalize(filters.query.trim());
    const list = products.filter((p) => {
      if (filters.type !== "tous" && p.type !== filters.type) return false;
      if (q && !normalize(`${p.name} ${p.category}`).includes(q)) return false;
      if (p.price > filters.maxPrice) return false;
      if (filters.saleOnly && !p.oldPrice) return false;
      if (filters.sizes.length && !p.sizes.some((s) => filters.sizes.includes(s)))
        return false;
      if (
        filters.colors.length &&
        !p.colors.some((c) => filters.colors.includes(c.name))
      )
        return false;
      return true;
    });
    if (sort === "prix-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "prix-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "nouveautes") list.sort((a, b) => b.addedAt - a.addedAt);
    return list;
  }, [filters, sort]);

  const featured = products.filter((p) => p.featured).slice(0, 3);

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.query.trim())
    chips.push({
      key: "q",
      label: `« ${filters.query.trim()} »`,
      onRemove: () => update({ query: "" }),
    });
  for (const s of filters.sizes)
    chips.push({
      key: `s-${s}`,
      label: `Taille ${s}`,
      onRemove: () => update({ sizes: filters.sizes.filter((x) => x !== s) }),
    });
  for (const c of filters.colors)
    chips.push({
      key: `c-${c}`,
      label: c,
      onRemove: () => update({ colors: filters.colors.filter((x) => x !== c) }),
    });
  if (filters.maxPrice < priceCeiling)
    chips.push({
      key: "p",
      label: `Max ${formatNumber(filters.maxPrice)} MAD`,
      onRemove: () => update({ maxPrice: priceCeiling }),
    });
  if (filters.saleOnly)
    chips.push({
      key: "sale",
      label: "En promotion",
      onRemove: () => update({ saleOnly: false }),
    });

  const typeCount = (id: ProductType | "tous") =>
    id === "tous" ? products.length : products.filter((p) => p.type === id).length;

  return (
    <>
      <section className="pb-10 pt-28 md:pb-14 md:pt-40">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <h1 className="font-display text-[length:clamp(4rem,14vw,11rem)] font-bold uppercase leading-[0.9]">
            Boutique
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Chemises, pantalons, vestes et maille. Filtrez par taille, couleur
            ou prix pour trouver votre pièce.
          </p>
        </div>
      </section>

      {!isFiltering && featured.length > 0 && (
        <section className="pb-14 md:pb-20">
          <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
            <h2 className="mb-6 font-display text-4xl font-bold uppercase leading-[0.9] md:mb-8 md:text-6xl">
              À la une
            </h2>
            <div className="grid gap-3 lg:h-[680px] lg:grid-cols-3 lg:grid-rows-2">
              {featured.map((p, i) => (
                <FeaturedCard
                  key={p.id}
                  product={p}
                  big={i === 0}
                  className={i === 0 ? "lg:col-span-2 lg:row-span-2" : undefined}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section aria-label="Catalogue" className="pb-20 md:pb-28">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          {/* Category pills */}
          <div
            role="group"
            aria-label="Catégories"
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0 [scrollbar-width:none]"
          >
            {[{ id: "tous" as const, label: "Tout" }, ...productTypes].map((t) => {
              const on = filters.type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ type: t.id })}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors",
                    on
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground hover:bg-foreground/10",
                  )}
                >
                  {t.label}
                  <span className="text-xs font-medium opacity-60">
                    {typeCount(t.id)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="relative block min-w-0 flex-1 basis-60">
              <span className="sr-only">Rechercher dans la boutique</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={filters.query}
                onChange={(e) => update({ query: e.target.value })}
                placeholder="Rechercher un article"
                className="h-12 w-full rounded-full bg-muted pl-12 pr-4 text-base outline-none placeholder:text-muted-foreground"
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Trier par</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-12 appearance-none rounded-full bg-muted pl-5 pr-11 text-sm font-semibold outline-none"
              >
                <option value="pertinence">Pertinence</option>
                <option value="nouveautes">Nouveautés</option>
                <option value="prix-asc">Prix croissant</option>
                <option value="prix-desc">Prix décroissant</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2"
                aria-hidden
              />
            </label>

            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background lg:hidden"
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              Filtres
              {activeCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-gold text-xs text-gold-foreground">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Active filter chips and result count */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <p aria-live="polite" className="mr-2 text-sm text-muted-foreground">
              {filtered.length} article{filtered.length > 1 ? "s" : ""}
            </p>
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.onRemove}
                aria-label={`Retirer le filtre ${c.label}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-semibold transition-colors hover:bg-foreground/10"
              >
                {c.label}
                <X className="size-3.5" aria-hidden />
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <FiltersPanel
                  filters={filters}
                  update={update}
                  onReset={reset}
                  activeCount={activeCount}
                />
              </div>
            </aside>

            <div>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4">
                  {filtered.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl bg-muted px-6 py-16 text-center">
                  <p className="font-display text-4xl font-bold uppercase leading-none md:text-5xl">
                    Aucun article trouvé
                  </p>
                  <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
                    Essayez d&apos;enlever un filtre ou de changer votre
                    recherche.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-6 inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-semibold text-background"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filters sheet */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.button
              type="button"
              aria-label="Fermer les filtres"
              onClick={() => setDrawer(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 cursor-default bg-black/50 lg:hidden"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filtres"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease }}
              className="fixed inset-x-0 bottom-0 z-60 flex max-h-[85dvh] flex-col rounded-t-3xl bg-background lg:hidden"
            >
              <div className="flex items-center justify-between px-6 pb-2 pt-5">
                <p className="font-display text-3xl font-bold uppercase leading-none">
                  Filtres
                </p>
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  aria-label="Fermer les filtres"
                  className="flex size-11 items-center justify-center rounded-full hover:bg-muted"
                >
                  <X className="size-6" aria-hidden />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-4">
                <FiltersPanel
                  filters={filters}
                  update={update}
                  onReset={reset}
                  activeCount={activeCount}
                />
              </div>
              <div className="px-6 pb-6 pt-3">
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-gold text-base font-semibold text-gold-foreground"
                >
                  Voir {filtered.length} article{filtered.length > 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}