"use client";

import { BrandLogo } from "@/components/shop/brand-logo";
import type { StoreBrand } from "@/lib/products";
import { cn } from "@/lib/utils";

function Bubble({
  label,
  on,
  onClick,
  children,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className="shrink-0">
      <button
        type="button"
        aria-pressed={on}
        onClick={onClick}
        className="group flex w-[76px] flex-col items-center gap-2 md:w-24"
      >
        {/* White in both themes, so any uploaded logo stays readable */}
        <span
          className={cn(
            "relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-white text-neutral-900 ring-offset-2 ring-offset-background transition-all duration-300 md:size-20",
            on
              ? "scale-105 ring-2 ring-gold"
              : "ring-1 ring-border group-hover:ring-foreground/40",
          )}
        >
          {children}
        </span>
        <span
          className={cn(
            "w-full truncate text-center text-xs font-semibold tracking-tight transition-opacity",
            on ? "opacity-100" : "opacity-60 group-hover:opacity-100",
          )}
        >
          {label}
        </span>
      </button>
    </li>
  );
}

/**
 * Round logo bubbles in a scrolling row. Only brands that have products show up
 * (the selected one always stays, so it can be turned off).
 */
export function BrandStrip({
  brands,
  counts,
  value,
  onChange,
}: {
  brands: StoreBrand[];
  /** brand id -> number of products */
  counts: Record<string, number>;
  /** "toutes" or a brand id */
  value: string;
  onChange: (brand: string) => void;
}) {
  const list = brands.filter((b) => (counts[b.id] ?? 0) > 0 || b.id === value);
  if (list.length === 0) return null;

  return (
    <nav aria-label="Marques" className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Par marque
      </p>
      <ul className="-mx-5 flex gap-3 overflow-x-auto px-5 py-4 md:mx-0 md:gap-4 md:px-0 [scrollbar-width:none]">
        <Bubble label="Toutes" on={value === "toutes"} onClick={() => onChange("toutes")}>
          <span className="text-sm font-bold uppercase tracking-wide">Tout</span>
        </Bubble>
        {list.map((b) => (
          <Bubble
            key={b.id}
            label={b.label}
            on={value === b.id}
            onClick={() => onChange(value === b.id ? "toutes" : b.id)}
          >
            <BrandLogo name={b.label} logo={b.logo} />
          </Bubble>
        ))}
      </ul>
    </nav>
  );
}