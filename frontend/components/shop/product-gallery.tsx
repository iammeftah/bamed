"use client";

import { useState } from "react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import type { ProductImage } from "@/lib/products";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [{ src: "", alt: name }];
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className="space-y-3">
      <ImagePlaceholder
        key={current.src}
        src={current.src}
        alt={current.alt}
        ratio="4 / 5"
        label="Photo produit 4:5"
        kind="product"
        sizes="(min-width:1024px) 50vw, 100vw"
        priority
      />

      {list.length > 1 && (
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {list.map((img, i) => (
            <li key={`${img.src}-${i}`}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Voir la photo ${i + 1}`}
                aria-pressed={i === active}
                className={cn(
                  "block w-full overflow-hidden rounded-md ring-offset-2 ring-offset-background transition-opacity",
                  i === active
                    ? "opacity-100 ring-2 ring-foreground"
                    : "opacity-60 hover:opacity-100",
                )}
              >
                <ImagePlaceholder
                  src={img.src}
                  alt={img.alt}
                  ratio="4 / 5"
                  label=""
                  kind="product"
                  sizes="96px"
                  rounded={false}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}