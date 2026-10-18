"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useProductColor } from "@/components/shop/product-color";
import type { Product, ProductColor } from "@/lib/products";
import { sortSizes } from "@/lib/sizes";
import {
  itemKey,
  openSelection,
  toggleItem,
  useSelection,
} from "@/lib/selection";
import { cn } from "@/lib/utils";

function useToggle(product: Product, color: ProductColor | undefined) {
  const items = useSelection();
  const key = itemKey(product.id, color?.name ?? "");
  const on = items.some((i) => i.key === key);

  const toggle = () => {
    const result = toggleItem({
      key,
      id: product.id,
      name: product.name,
      brand: product.brand,
      color: color?.name ?? "",
      hex: color?.hex ?? "#8a8a8a",
      price: product.price,
      sizes: sortSizes(product.sizes),
    });

    const detail = color?.name || undefined;

    if (result === "added") {
      toast(`${product.name} ajouté à votre sélection`, {
        description: detail,
        action: { label: "Voir", onClick: openSelection },
      });
    } else if (result === "removed") {
      toast(`${product.name} retiré de votre sélection`, {
        description: detail,
      });
    } else {
      toast.error("Votre sélection est pleine (30 articles maximum).");
    }
  };

  return { on, toggle };
}

/** Bare heart on a product card: no background, no circle. A soft shadow keeps it readable on photos. */
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
      className="absolute right-1 top-1 z-10 flex size-10 items-center justify-center text-white transition-transform active:scale-90 sm:right-2 sm:top-2"
    >
      <Heart
        strokeWidth={1.75}
        className={cn(
          "size-5 drop-shadow-[0_1px_3px_rgb(0_0_0/0.55)] transition-colors",
          on && "fill-sale stroke-sale",
        )}
        aria-hidden
      />
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