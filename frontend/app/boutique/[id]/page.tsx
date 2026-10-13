import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { ColorPicker, ColorProvider } from "@/components/shop/product-color";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ShopProductCard } from "@/components/shop/shop-product-card";
import { formatNumber, type Product } from "@/lib/products";
import { sizeScales, sortSizes } from "@/lib/sizes";
import { cn } from "@/lib/utils";
import { productsService } from "@/services/products.service";

const ID = /^[\w-]{1,64}$/;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ couleur?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!ID.test(id)) return { title: "Article introuvable | BAMED" };
  const product = await productsService.getProduct(id).catch(() => null);
  if (!product) return { title: "Article introuvable | BAMED" };
  return {
    title: `${product.name} | BAMED`,
    description: `${product.name}, ${product.category}. ${formatNumber(product.price)} MAD.`,
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!ID.test(id)) notFound();

  const product = await productsService.getProduct(id);
  if (!product) notFound();

  // ?couleur=Marine opens the page in that colour (ignored if it does not exist)
  const { couleur } = await searchParams;
  const wanted = Array.isArray(couleur) ? couleur[0] : couleur;

  // Same category first, then the rest, 4 suggestions at most
  const all: Product[] = await productsService
    .getProducts({ size: 100 })
    .catch(() => []);
  const related = all
    .filter((p) => p.id !== product.id)
    .sort(
      (a, b) =>
        Number(b.type === product.type) - Number(a.type === product.type),
    )
    .slice(0, 4);

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const scale = sizeScales[product.sizeScale];

  return (
    <main className="overflow-x-clip bg-background">
      <section className="pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <nav aria-label="Fil d'Ariane" className="mb-6 md:mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/boutique"
                  className="hover:text-foreground hover:underline"
                >
                  Boutique
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-4" />
              </li>
              <li>
                <Link
                  href={`/boutique?categorie=${encodeURIComponent(product.type)}`}
                  className="hover:text-foreground hover:underline"
                >
                  {product.category}
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-4" />
              </li>
              <li aria-current="page" className="font-semibold text-foreground">
                {product.name}
              </li>
            </ol>
          </nav>

          <ColorProvider colors={product.colors} initial={wanted}>
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <ProductGallery name={product.name} />

              <div className="lg:pt-4">
                {product.tag && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                      product.tag === "Nouveau"
                        ? "bg-gold text-gold-foreground"
                        : "bg-neutral-950 text-white",
                    )}
                  >
                    {product.tag}
                  </span>
                )}

                <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl">
                  {product.name}
                </h1>
                <p className="mt-3 text-base text-muted-foreground">
                  {product.category}
                </p>

                <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className={cn(
                      "font-display text-5xl font-bold leading-none tabular-nums md:text-6xl",
                      product.oldPrice ? "text-sale" : "text-foreground",
                    )}
                  >
                    {formatNumber(product.price)}
                    <span className="ml-1.5 font-sans text-sm font-bold tracking-wide md:text-base">
                      MAD
                    </span>
                  </span>
                  {product.oldPrice && (
                    <>
                      <span className="sr-only">, ancien prix</span>
                      <span className="text-lg font-medium tabular-nums text-muted-foreground line-through">
                        {formatNumber(product.oldPrice)}
                      </span>
                      <span className="rounded-full bg-sale/10 px-2 py-0.5 text-sm font-bold text-sale">
                        -{discount}%
                      </span>
                    </>
                  )}
                </p>

                <dl className="mt-10 divide-y divide-border border-y border-border">
                  {product.colors.length > 0 && (
                    <div className="grid grid-cols-[7rem_1fr] gap-4 py-5">
                      <dt className="text-sm font-semibold">Couleurs</dt>
                      <dd>
                        <ColorPicker />
                      </dd>
                    </div>
                  )}

                  {product.sizes.length > 0 && (
                    <div className="grid grid-cols-[7rem_1fr] gap-4 py-5">
                      <dt className="text-sm font-semibold">
                        {scale.title}
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {scale.short}
                        </span>
                      </dt>
                      <dd>
                        <ul className="flex flex-wrap gap-2">
                          {sortSizes(product.sizes).map((s) => (
                            <li
                              key={s}
                              className="inline-flex h-10 min-w-11 items-center justify-center rounded-md bg-muted px-3 text-sm font-semibold"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {scale.hint}
                        </p>
                      </dd>
                    </div>
                  )}

                  <div className="grid grid-cols-[7rem_1fr] gap-4 py-5">
                    <dt className="text-sm font-semibold">Catégorie</dt>
                    <dd className="text-sm">{product.category}</dd>
                  </div>
                </dl>

                <div className="mt-8 flex flex-wrap gap-2">
                  <Link
                    href="/boutique"
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                    Retour à la boutique
                  </Link>
                  <Link
                    href={`/boutique?categorie=${encodeURIComponent(product.type)}`}
                    className="inline-flex h-11 items-center rounded-md bg-muted px-5 text-sm font-semibold transition-colors hover:bg-foreground/10"
                  >
                    Voir tous les articles de cette catégorie
                  </Link>
                </div>
              </div>
            </div>
          </ColorProvider>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="similaires" className="bg-muted py-16 md:py-24">
          <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
            <h2
              id="similaires"
              className="mb-8 font-display text-4xl font-bold uppercase leading-[0.9] md:mb-10 md:text-6xl"
            >
              Vous aimerez aussi
            </h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-12 md:gap-x-4 lg:grid-cols-4">
              {related.map((p) => (
                <ShopProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}