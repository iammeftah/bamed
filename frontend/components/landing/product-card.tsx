"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Heart, ShoppingBag } from "lucide-react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { formatNumber, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className="product-card flex flex-col">
      <div className="relative isolate overflow-hidden rounded-xl bg-muted">
        <a href="#" tabIndex={-1} aria-hidden="true" className="block">
          <div className="zoom-img">
            <ImagePlaceholder
              src={product.image}
              alt={product.alt}
              ratio="4 / 5"
              label="Photo produit 4:5"
              kind="product"
              sizes="(min-width:1024px) 25vw, 50vw"
            />
          </div>
        </a>

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

        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          aria-label={
            liked
              ? `Retirer ${product.name} des favoris`
              : `Ajouter ${product.name} aux favoris`
          }
          className="card-fade absolute right-2 top-2 flex size-10 items-center justify-center rounded-full bg-white text-neutral-950 sm:right-3 sm:top-3"
        >
          <Heart
            className={liked ? "size-5 fill-neutral-950" : "size-5"}
            aria-hidden
          />
        </motion.button>

        <div className="card-reveal absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            aria-label={`Ajout rapide : ${product.name}`}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-sm font-semibold text-white"
          >
            <ShoppingBag className="size-4" aria-hidden />
            Ajout rapide
          </motion.button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {product.category}
        </p>
        <a
          href="#"
          className="text-base font-semibold leading-snug tracking-tight text-foreground underline-offset-4 hover:underline md:text-lg"
        >
          {product.name}
        </a>

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