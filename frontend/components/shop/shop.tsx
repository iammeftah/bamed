"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  CircleAlert,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/shop/brand-logo";
import { BrandPlayground } from "@/components/shop/brand-playground";
import { OutfitBuilder } from "@/components/shop/outfit-builder";
import { ShopProductCard } from "@/components/shop/shop-product-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PAGE_SIZE as SECTION_SIZE,
  parseShopParams,
  sortOptions,
  toQueryString,
  type ShopState,
  type Sort,
} from "@/lib/shop-query";
import {
  formatNumber,
  type Product,
  type ProductColor,
  type StoreBrand,
  type StoreCategory,
} from "@/lib/products";
import { scaleOrder, sizeScales, type SizeScaleId } from "@/lib/sizes";
import { cn } from "@/lib/utils";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Filters are remembered here (as a query string) between visits. */
const STORE_KEY = "bamed.shop.v1";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

type SizeGroup = {
  id: SizeScaleId;
  title: string;
  hint: string;
  sizes: string[];
};

type Section = {
  id: string;
  label: string;
  logo?: string;
  items: Product[];
};

/* ---------- Filters panel (sidebar on desktop, bottom sheet on mobile) ---------- */

function FiltersPanel({
  state,
  update,
  onReset,
  activeCount,
  sizeGroups,
  sizesNeedCategory,
  allColors,
  priceCeiling,
}: {
  state: ShopState;
  update: (patch: Partial<ShopState>) => void;
  onReset: () => void;
  activeCount: number;
  sizeGroups: SizeGroup[];
  sizesNeedCategory: boolean;
  allColors: ProductColor[];
  priceCeiling: number;
}) {
  const maxPrice = state.maxPrice ?? priceCeiling;

  return (
    <div className="space-y-8">
      {sizeGroups.map((g) => (
        <div key={g.id}>
          <h3 className="text-sm font-semibold">{g.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{g.hint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {g.sizes.map((s) => {
              const on = state.sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ sizes: toggle(state.sizes, s) })}
                  className={cn(
                    "h-10 min-w-11 rounded-md px-3 text-sm font-semibold transition-colors",
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
      ))}

      {sizesNeedCategory && (
        <p className="text-xs text-muted-foreground">
          Choisissez une catégorie (jeans, sneakers, pantalons...) pour filtrer
          par taille ou par pointure.
        </p>
      )}

      <div>
        <h3 className="text-sm font-semibold">Couleurs</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {allColors.map((c) => {
            const on = state.colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                aria-label={c.name}
                title={c.name}
                onClick={() => update({ colors: toggle(state.colors, c.name) })}
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
            {formatNumber(maxPrice)} MAD
          </span>
        </div>
        <input
          id="prix-max"
          type="range"
          min={100}
          max={priceCeiling}
          step={10}
          value={maxPrice}
          onChange={(e) => update({ maxPrice: Number(e.target.value) })}
          className="mt-4 w-full accent-[var(--gold)]"
        />
      </div>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={state.newOnly}
            onChange={(e) => update({ newOnly: e.target.checked })}
            className="size-5 accent-[var(--gold)]"
          />
          Nouveautés
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={state.saleOnly}
            onChange={(e) => update({ saleOnly: e.target.checked })}
            className="size-5 accent-[var(--gold)]"
          />
          En promotion
        </label>
      </div>

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

export function Shop({
  products,
  categories,
  brands = [],
  loadError = false,
  initial,
}: {
  products: Product[];
  categories: StoreCategory[];
  brands?: StoreBrand[];
  loadError?: boolean;
  /** Validated state read from the URL on the server */
  initial: ShopState;
}) {
  const priceCeiling =
    Math.ceil(Math.max(100, ...products.map((p) => p.price)) / 100) * 100;

  const allColors = useMemo(() => {
    const list: ProductColor[] = [];
    for (const p of products) {
      for (const c of p.colors) {
        if (!list.some((x) => x.name === c.name)) list.push(c);
      }
    }
    return list;
  }, [products]);

  const [state, setState] = useState<ShopState>(() => ({
    ...initial,
    maxPrice:
      initial.maxPrice === null
        ? null
        : Math.min(Math.max(initial.maxPrice, 100), priceCeiling),
  }));
  const [drawer, setDrawer] = useState(false);
  const [restored, setRestored] = useState(false);
  /** How many products each brand section shows (default: SECTION_SIZE) */
  const [shown, setShown] = useState<Record<string, number>>({});
  const skipSave = useRef(false);

  // Come back with the filters of the last visit (only on a clean /boutique link)
  useEffect(() => {
    if (window.location.search) return;
    try {
      const qs = window.localStorage.getItem(STORE_KEY);
      if (!qs) return;
      const saved = parseShopParams(
        Object.fromEntries(new URLSearchParams(qs)),
        categories.map((c) => c.id),
        brands.map((b) => b.id),
      );
      const hasFilters =
        saved.type !== "tous" ||
        saved.sizes.length > 0 ||
        saved.colors.length > 0 ||
        saved.maxPrice !== null ||
        saved.saleOnly ||
        saved.newOnly ||
        saved.sort !== "pertinence";
      if (!hasFilters) return;
      skipSave.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({
        ...saved,
        query: "",
        page: 1,
        maxPrice:
          saved.maxPrice === null
            ? null
            : Math.min(Math.max(saved.maxPrice, 100), priceCeiling),
      });
      setRestored(true);
    } catch {
      /* storage unavailable: start clean */
    }
    // Runs once, on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remember the filters (not the search text) for the next visit
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      const qs = toQueryString({ ...state, query: "", page: 1 }, priceCeiling);
      if (qs) window.localStorage.setItem(STORE_KEY, qs);
      else window.localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  }, [state, priceCeiling]);

  // Size buttons come from the size scale of the products. Numbers (40, 42...)
  // mean different things for jeans, trousers and shoes, so they only show
  // inside a category.
  const sizeGroups = useMemo(() => {
    const pool =
      state.type === "tous"
        ? products
        : products.filter((p) => p.type === state.type);
    const groups: SizeGroup[] = [];
    for (const id of scaleOrder) {
      if (state.type === "tous" && id !== "letters") continue;
      const scale = sizeScales[id];
      const used = scale.sizes.filter((s) =>
        pool.some((p) => p.sizeScale === id && p.sizes.includes(s)),
      );
      if (used.length)
        groups.push({ id, title: scale.title, hint: scale.hint, sizes: used });
    }
    return groups;
  }, [products, state.type]);

  const sizesNeedCategory =
    state.type === "tous" && products.some((p) => p.sizeScale !== "letters");

  const update = (patch: Partial<ShopState>) => {
    setRestored(false);
    setShown({});
    setState((s) => ({ ...s, ...patch, page: 1 }));
  };

  const reset = () => {
    setRestored(false);
    setShown({});
    setState((s) => ({
      ...s,
      sizes: [],
      colors: [],
      maxPrice: null,
      saleOnly: false,
      newOnly: false,
      page: 1,
    }));
  };

  const resetAll = () => {
    setRestored(false);
    setShown({});
    setState((s) => ({
      ...s,
      query: "",
      type: "tous",
      sizes: [],
      colors: [],
      maxPrice: null,
      saleOnly: false,
      newOnly: false,
      sort: "pertinence",
      page: 1,
    }));
  };

  // Keep the URL in sync, so a link or the back button restores this exact view
  useEffect(() => {
    const t = window.setTimeout(() => {
      const qs = toQueryString({ ...state, page: 1 }, priceCeiling);
      const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(window.history.state, "", url);
    }, 250);
    return () => window.clearTimeout(t);
  }, [state, priceCeiling]);

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
    state.sizes.length +
    state.colors.length +
    (state.maxPrice !== null && state.maxPrice < priceCeiling ? 1 : 0) +
    (state.saleOnly ? 1 : 0) +
    (state.newOnly ? 1 : 0);

  const filtered = useMemo(() => {
    const tokens = normalize(state.query.trim()).split(/\s+/).filter(Boolean);
    const limit = state.maxPrice ?? priceCeiling;

    const list = products.filter((p) => {
      if (state.type !== "tous" && p.type !== state.type) return false;
      if (tokens.length) {
        const hay = normalize(
          `${p.name} ${p.category} ${p.brand ?? ""} ${p.colors.map((c) => c.name).join(" ")}`,
        );
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      if (p.price > limit) return false;
      if (state.saleOnly && !p.oldPrice) return false;
      if (state.newOnly && p.tag !== "Nouveau") return false;
      if (state.sizes.length && !p.sizes.some((s) => state.sizes.includes(s)))
        return false;
      if (
        state.colors.length &&
        !p.colors.some((c) => state.colors.includes(c.name))
      )
        return false;
      return true;
    });

    if (state.sort === "prix-asc") list.sort((a, b) => a.price - b.price);
    if (state.sort === "prix-desc") list.sort((a, b) => b.price - a.price);
    if (state.sort === "nouveautes") list.sort((a, b) => b.addedAt - a.addedAt);
    return list;
  }, [products, state, priceCeiling]);

  // One sub-section per brand (the sort order is kept inside each section)
  const sections = useMemo<Section[]>(() => {
    const byBrand = new Map<string, Product[]>();
    const noBrand: Product[] = [];
    for (const p of filtered) {
      if (!p.brandId) {
        noBrand.push(p);
        continue;
      }
      const list = byBrand.get(p.brandId);
      if (list) list.push(p);
      else byBrand.set(p.brandId, [p]);
    }

    const out: Section[] = [];
    for (const b of brands) {
      const items = byBrand.get(b.id);
      if (!items) continue;
      out.push({ id: b.id, label: b.label, logo: b.logo, items });
      byBrand.delete(b.id);
    }
    for (const [id, items] of byBrand) {
      out.push({ id, label: items[0].brand ?? id, items });
    }
    if (noBrand.length) {
      out.push({ id: "autres", label: "Autres pièces", items: noBrand });
    }
    return out;
  }, [filtered, brands]);

  const showHeadings = sections.length > 1 || sections[0]?.id !== "autres";

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (state.query.trim())
    chips.push({
      key: "q",
      label: `« ${state.query.trim()} »`,
      onRemove: () => update({ query: "" }),
    });
  for (const s of state.sizes)
    chips.push({
      key: `s-${s}`,
      label: `Taille ${s}`,
      onRemove: () => update({ sizes: state.sizes.filter((x) => x !== s) }),
    });
  for (const c of state.colors)
    chips.push({
      key: `c-${c}`,
      label: c,
      onRemove: () => update({ colors: state.colors.filter((x) => x !== c) }),
    });
  if (state.maxPrice !== null && state.maxPrice < priceCeiling)
    chips.push({
      key: "p",
      label: `Max ${formatNumber(state.maxPrice)} MAD`,
      onRemove: () => update({ maxPrice: null }),
    });
  if (state.saleOnly)
    chips.push({
      key: "sale",
      label: "En promotion",
      onRemove: () => update({ saleOnly: false }),
    });
  if (state.newOnly)
    chips.push({
      key: "new",
      label: "Nouveautés",
      onRemove: () => update({ newOnly: false }),
    });

  const typeCount = (id: string) =>
    id === "tous" ? products.length : products.filter((p) => p.type === id).length;

  // Tabs come from the categories. Empty ones stay hidden (except the open one).
  const tabs: { id: string; label: string }[] = [
    { id: "tous", label: "Tout" },
    ...categories.map((c) => ({ id: c.id, label: c.label })),
  ].filter(
    (t) => t.id === "tous" || t.id === state.type || typeCount(t.id) > 0,
  );

  const filtersPanel = (
    <FiltersPanel
      state={state}
      update={update}
      onReset={reset}
      activeCount={activeCount}
      sizeGroups={sizeGroups}
      sizesNeedCategory={sizesNeedCategory}
      allColors={allColors}
      priceCeiling={priceCeiling}
    />
  );

  return (
    <>
      <section className="pb-10 pt-28 md:pb-14 md:pt-40">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <h1 className="font-display text-[length:clamp(4rem,14vw,11rem)] font-bold uppercase leading-[0.9]">
            Boutique
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Toutes nos pièces, marque par marque. Gardez vos coups de cœur
            dans « Ma sélection » et vérifiez leur disponibilité sur WhatsApp.
          </p>
        </div>
      </section>

      <section aria-label="Catalogue" className="pb-20 md:pb-28">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          {loadError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              Le catalogue n&apos;a pas pu être chargé. Réessayez dans un instant.
            </div>
          )}

          <nav
            aria-label="Catégories"
            className="-mx-5 flex overflow-x-auto border-b border-border px-5 md:mx-0 md:px-0 [scrollbar-width:none]"
          >
            {tabs.map((t) => {
              const on = state.type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ type: t.id, sizes: [] })}
                  className={cn(
                    "relative shrink-0 whitespace-nowrap px-3 py-3 text-[13px] font-semibold tracking-tight transition-opacity first:md:-ml-3",
                    on ? "opacity-100" : "opacity-60 hover:opacity-100",
                  )}
                >
                  {t.label}
                  <span className="ml-1.5 text-[11px] font-medium tabular-nums opacity-60">
                    {typeCount(t.id)}
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
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:justify-end">
            <label className="relative block w-full sm:w-64">
              <span className="sr-only">Rechercher dans toute la boutique</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={state.query}
                maxLength={80}
                onChange={(e) => update({ query: e.target.value })}
                placeholder="Rechercher un article ou une marque..."
                className="h-10 w-full rounded-md bg-muted pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-[13px] font-semibold tracking-tight outline-none transition-colors hover:bg-muted data-[popup-open]:bg-muted">
                <span className="text-muted-foreground">Trier :</span>
                {sortOptions.find((o) => o.id === state.sort)?.label}
                <ChevronDown className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuRadioGroup
                  value={state.sort}
                  onValueChange={(v) => update({ sort: v as Sort })}
                >
                  {sortOptions.map((o) => (
                    <DropdownMenuRadioItem key={o.id} value={o.id}>
                      {o.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-[13px] font-semibold tracking-tight text-background lg:hidden"
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

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <p aria-live="polite" className="mr-2 text-sm text-muted-foreground">
              {filtered.length === 0
                ? "Aucun article"
                : `${filtered.length} article${filtered.length > 1 ? "s" : ""}${
                    showHeadings
                      ? ` · ${sections.length} marque${sections.length > 1 ? "s" : ""}`
                      : ""
                  }`}
            </p>
            {restored && (
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-gold px-3 text-sm font-semibold transition-colors hover:bg-gold/10"
              >
                Filtres de votre dernière visite · Effacer
                <X className="size-3.5" aria-hidden />
              </button>
            )}
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.onRemove}
                aria-label={`Retirer le filtre ${c.label}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-muted px-3 text-sm font-semibold transition-colors hover:bg-foreground/10"
              >
                {c.label}
                <X className="size-3.5" aria-hidden />
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
            <aside className="hidden lg:block">
              <div className="sticky top-28">{filtersPanel}</div>
            </aside>

            <div>
              {sections.length > 0 ? (
                <div className="space-y-16">
                  {sections.map((sec) => {
                    const limit = shown[sec.id] ?? SECTION_SIZE;
                    const list = sec.items.slice(0, limit);
                    const rest = sec.items.length - list.length;
                    return (
                      <section
                        key={sec.id}
                        aria-labelledby={`marque-${sec.id}`}
                        className="scroll-mt-28"
                      >
                        {showHeadings && (
                          <header className="mb-6 flex items-center gap-4">
                            {sec.id !== "autres" && (
                              <span className="relative size-18 shrink-0 overflow-hidden rounded-full grayscale dark:invert md:size-32">
                                <BrandLogo
                                  name={sec.label}
                                  logo={sec.logo}
                                  sizes="56px"
                                />
                              </span>
                            )}
                            <h2
                              id={`marque-${sec.id}`}
                              className="font-display text-4xl font-bold uppercase leading-none md:text-5xl"
                            >
                              {sec.label}
                            </h2>
                            <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                              {sec.items.length} article
                              {sec.items.length > 1 ? "s" : ""}
                            </span>
                          </header>
                        )}

                        <div className="grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-3 md:gap-x-4">
                          {list.map((p) => (
                            <motion.div
                              key={p.id}
                              layout
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, ease }}
                            >
                              <ShopProductCard product={p} />
                            </motion.div>
                          ))}
                        </div>

                        {rest > 0 && (
                          <div className="mt-8 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setShown((x) => ({
                                  ...x,
                                  [sec.id]: sec.items.length,
                                }))
                              }
                              className="inline-flex h-11 items-center rounded-md bg-muted px-6 text-sm font-semibold transition-colors hover:bg-foreground/10"
                            >
                              Afficher les {rest} autre{rest > 1 ? "s" : ""}
                            </button>
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-muted px-6 py-16 text-center">
                  <p className="font-display text-4xl font-bold uppercase leading-none md:text-5xl">
                    Aucun article trouvé
                  </p>
                  <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
                    Essayez un autre mot, ou enlevez un filtre.
                  </p>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="mt-6 inline-flex h-12 items-center rounded-md bg-foreground px-6 text-sm font-semibold text-background"
                  >
                    Tout réinitialiser
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <BrandPlayground products={products} brands={brands} />
      <OutfitBuilder products={products} />

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
              className="fixed inset-x-0 bottom-0 z-60 flex max-h-[85dvh] flex-col rounded-t-xl bg-background lg:hidden"
            >
              <div className="flex items-center justify-between px-6 pb-2 pt-5">
                <p className="font-display text-3xl font-bold uppercase leading-none">
                  Filtres
                </p>
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  aria-label="Fermer les filtres"
                  className="flex size-11 items-center justify-center rounded-md hover:bg-muted"
                >
                  <X className="size-6" aria-hidden />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-4">{filtersPanel}</div>
              <div className="px-6 pb-6 pt-3">
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  className="flex h-12 w-full items-center justify-center rounded-md bg-gold text-base font-semibold text-gold-foreground"
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