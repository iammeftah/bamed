"use client";

import { useState } from "react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { useProductColor } from "@/components/shop/product-color";
import { SwitchingImage } from "@/components/shop/product-media";
import { cn } from "@/lib/utils";

/** Shows the photos of the selected colour. Must sit inside <ColorProvider>. */
export function ProductGallery({ name }: { name: string }) {
  const { color } = useProductColor();

  // The picked thumbnail is remembered with its colour: when the colour
  // changes, the gallery goes back to photo 1 without any effect.
  const [pick, setPick] = useState({ color: "", index: 0 });

  const images = color?.images.length ? color.images : [{ src: "", alt: name }];
  const colorName = color?.name ?? "";
  const index =
    pick.color === colorName ? Math.min(pick.index, images.length - 1) : 0;
  const current = images[index];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        <SwitchingImage
          image={current}
          sizes="(min-width:1024px) 50vw, 100vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <li key={`${colorName}-${img.src}-${i}`}>
              <button
                type="button"
                onClick={() => setPick({ color: colorName, index: i })}
                aria-label={`Voir la photo ${i + 1}`}
                aria-pressed={i === index}
                className={cn(
                  "block w-full overflow-hidden rounded-md ring-offset-2 ring-offset-background transition-opacity",
                  i === index
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