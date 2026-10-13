"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import type { ProductImage } from "@/lib/products";
import { cn } from "@/lib/utils";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Time between two photos while the card is hovered. */
const INTERVAL = 1100;

/**
 * Crossfades whenever `image` changes. Fills its (relative) parent.
 * The old photo stays under the new one until the fade is done, so there is no flash.
 */
export function SwitchingImage({
  image,
  label = "Photo produit 4:5",
  sizes = "100vw",
  priority = false,
}: {
  image: ProductImage;
  label?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={image.src || image.alt}
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 1, transition: { duration: 0.55 } }}
        transition={{ duration: 0.55, ease }}
      >
        <ImagePlaceholder
          src={image.src}
          alt={image.alt}
          ratio="fill"
          label={label}
          kind="product"
          sizes={sizes}
          priority={priority}
          rounded={false}
        />
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Product photo that plays through the photos of the current colour while `active`
 * (mouse hover). Goes back to the first photo when the pointer leaves.
 * Dots only show on devices that can hover.
 */
export function ProductMedia({
  images,
  name,
  active = false,
  ratio = "4 / 5",
  sizes,
}: {
  images: ProductImage[];
  name: string;
  active?: boolean;
  ratio?: string;
  sizes?: string;
}) {
  const list = images.length ? images : [{ src: "", alt: name }];
  const count = list.length;
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active || count < 2) return;
    let timer: number | undefined;
    // Short pause first, so a quick pass of the mouse does not flicker
    const start = window.setTimeout(() => {
      setStep(1);
      timer = window.setInterval(() => setStep((s) => s + 1), INTERVAL);
    }, 350);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
      setStep(0);
    };
  }, [active, count]);

  const index = active ? step % count : 0;

  return (
    <div
      className="relative w-full overflow-hidden bg-muted"
      style={{ aspectRatio: ratio }}
    >
      <SwitchingImage image={list[index]} sizes={sizes} />

      {count > 1 && (
        <div
          aria-hidden
          className="card-fade pointer-events-none absolute inset-x-0 bottom-2 hidden justify-center gap-1.5 [@media(hover:hover)]:flex"
        >
          {list.map((img, i) => (
            <span
              key={`${img.src}-${i}`}
              className={cn(
                "h-1 rounded-full bg-white shadow-sm transition-all duration-300",
                i === index ? "w-5" : "w-1.5 opacity-60",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}