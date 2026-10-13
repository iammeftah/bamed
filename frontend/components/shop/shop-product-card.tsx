import Link from "next/link";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { formatNumber, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

export function ShopProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className="product-card relative flex flex-col">
      <div className="relative isolate overflow-hidden rounded-xl bg-muted">
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
            href={`/boutique/${encodeURIComponent(product.id)}`}
            className="underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {product.name}
          </Link>
        </h3>

        {product.colors.length > 0 && (
          <ul aria-label="Couleurs disponibles" className="mt-1 flex items-center gap-1.5">
            {product.colors.map((c) => (
              <li key={c.name}>
                <span
                  title={c.name}
                  className="block size-4 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.4)]"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="sr-only">{c.name}</span>
              </li>
            ))}
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

        {product.sizes.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Tailles : {product.sizes.join(" · ")}
          </p>
        )}
      </div>
    </article>
  );
}