"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductMedia } from "@/components/shop/product-media";
import { colorImages, formatNumber, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const [hovering, setHovering] = useState(false);
  const images = colorImages(product);
  const href = `/boutique/${encodeURIComponent(product.id)}`;
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
      <div className="relative isolate overflow-hidden rounded-xl bg-muted">
        <div className="zoom-img">
          <ProductMedia
            images={images}
            name={product.name}
            active={hovering}
            sizes="(min-width:1024px) 25vw, 50vw"
          />
        </div>

        {product.tag && (
          <span
            className={
              product.tag === "Nouveau"
                ? "absolute left-2 top-2 inline-flex items-center rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-foreground sm:left-3 sm:top-3"
                : "absolute left-2 top-2 inline-flex items-center rounded-full bg-neutral-950 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white sm:left-3 sm:top-3"
            }
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

        <p className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span
            className={
              product.oldPrice
                ? "font-display text-3xl font-bold leading-none tabular-nums text-sale md:text-4xl"
                : "font-display text-3xl font-bold leading-none tabular-nums text-foreground md:text-4xl"
            }
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
      </div>
    </article>
  );
}