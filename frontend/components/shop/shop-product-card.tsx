"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductMedia } from "@/components/shop/product-media";
import { formatNumber, type Product } from "@/lib/products";
import { sortSizes } from "@/lib/sizes";
import { cn } from "@/lib/utils";
import { CardSelectButton } from "./select-button";

/** The one product card of the site (shop, product page, home page). */
export function ShopProductCard({
  product,
  showSizes = true,
}: {
  product: Product;
  /** Turn off on the home page to keep the card light */
  showSizes?: boolean;
}) {
  const [colorIndex, setColorIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  const color = product.colors[colorIndex] ?? product.colors[0];
  const href = `/boutique/${encodeURIComponent(product.id)}${
    color ? `?couleur=${encodeURIComponent(color.name)}` : ""
  }`;
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article
      className="product-card relative flex flex-col"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovering(true);
      }}
      onPointerLeave={() => setHovering(false)}
    >
      <CardSelectButton product={product} color={color} />
      <div className="relative isolate overflow-hidden rounded-xl bg-muted">
        <div className="zoom-img">
          <ProductMedia
            images={color?.images ?? []}
            name={product.name}
            active={hovering}
            sizes="(min-width:1024px) 25vw, 50vw"
          />
        </div>

        {product.tag && (
          <span
            className={cn(
              "absolute left-2 top-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider sm:left-3 sm:top-3",
              product.tag === "Nouveau"
                ? "bg-gold text-gold-foreground"
                : "bg-neutral-950 text-white",
            )}
          >
            {product.tag}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {product.category}
        </p>

        <h3 className="text-base font-semibold leading-snug tracking-tight md:text-lg">
          <Link
            href={href}
            className="underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {product.name}
          </Link>
        </h3>

        {product.colors.length > 0 && (
          // z-10 puts the swatches above the link overlay so they stay clickable
          <ul
            aria-label="Couleurs disponibles"
            className="relative z-10 mt-1 flex w-fit items-center gap-2"
          >
            {product.colors.map((c, i) => {
              const on = i === colorIndex;
              return (
                <li key={c.name}>
                  <button
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={on}
                    onClick={() => setColorIndex(i)}
                    onPointerEnter={(e) => {
                      if (e.pointerType === "mouse") setColorIndex(i);
                    }}
                    style={{ backgroundColor: c.hex }}
                    className={cn(
                      "relative block size-4 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.4)] ring-offset-2 ring-offset-background transition-shadow after:absolute after:-inset-1.5 after:content-['']",
                      on && "ring-1 ring-foreground",
                    )}
                  />
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span
            className={cn(
              "font-display text-3xl font-bold leading-none tabular-nums md:text-4xl",
              product.oldPrice ? "text-sale" : "text-foreground",
            )}
          >
            {formatNumber(product.price)}
            <span className="ml-1 font-sans text-xs font-bold tracking-wide md:text-sm">
              MAD
            </span>
          </span>
          {product.oldPrice && (
            <>
              <span className="sr-only">, ancien prix</span>
              <span className="text-base font-medium tabular-nums text-muted-foreground line-through md:text-lg">
                {formatNumber(product.oldPrice)}
              </span>
              <span className="rounded-full bg-sale/10 px-2 py-0.5 text-xs font-bold text-sale">
                -{discount}%
              </span>
            </>
          )}
        </p>

        {showSizes && product.sizes.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Tailles : {sortSizes(product.sizes).join(" · ")}
          </p>
        )}
      </div>
    </article>
  );
}