"use client";

import { Heart } from "lucide-react";
import { useProductColor } from "@/components/shop/product-color";
import type { Product, ProductColor } from "@/lib/products";
import { sortSizes } from "@/lib/sizes";
import { itemKey, toggleItem, useSelection } from "@/lib/selection";
import { cn } from "@/lib/utils";

function useToggle(product: Product, color: ProductColor | undefined) {
  const items = useSelection();
  const key = itemKey(product.id, color?.name ?? "");
  const on = items.some((i) => i.key === key);
  const toggle = () =>
    toggleItem({
      key,
      id: product.id,
      name: product.name,
      brand: product.brand,
      color: color?.name ?? "",
      hex: color?.hex ?? "#8a8a8a",
      price: product.price,
      sizes: sortSizes(product.sizes),
    });
  return { on, toggle };
}

/** Round heart on a product card (card has its own colour state). */
export function CardSelectButton({
  product,
  color,
}: {
  product: Product;
  color: ProductColor | undefined;
}) {
  const { on, toggle } = useToggle(product, color);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Retirer de ma sélection" : "Ajouter à ma sélection"}
      className={cn(
        "absolute right-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur transition-transform active:scale-90 sm:right-3 sm:top-3",
        on && "text-sale",
      )}
    >
      <Heart className={cn("size-[18px]", on && "fill-current")} aria-hidden />
    </button>
  );
}

/** Wide button for the product page (uses the colour picked there). */
export function ProductSelectButton({ product }: { product: Product }) {
  const { color } = useProductColor();
  const { on, toggle } = useToggle(product, color);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors",
        on
          ? "bg-gold text-gold-foreground"
          : "border border-border hover:bg-muted",
      )}
    >
      <Heart className={cn("size-4", on && "fill-current")} aria-hidden />
      {on ? "Dans ma sélection" : "Ajouter à ma sélection"}
    </button>
  );
}