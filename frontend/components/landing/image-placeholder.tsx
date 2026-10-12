"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, Shirt, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  product: Shirt,
  category: Tag,
  hero: ImageIcon,
  editorial: Camera,
};

type ImagePlaceholderProps = {
  src?: string;
  alt: string;
  /** CSS aspect ratio like "4 / 5", or "fill" to fill the parent */
  ratio?: string;
  /** Small text shown in the placeholder, e.g. "Photo produit 4:5" */
  label: string;
  kind?: keyof typeof icons;
  tone?: "light" | "dark";
  sizes?: string;
  priority?: boolean;
  /** Rounded corners (rounded-xl). Turn off for full-bleed images like the home hero. */
  rounded?: boolean;
  className?: string;
};

export function ImagePlaceholder({
  src,
  alt,
  ratio = "4 / 5",
  label,
  kind = "product",
  tone = "light",
  sizes = "100vw",
  priority = false,
  rounded = true,
  className,
}: ImagePlaceholderProps) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Catches a 404 that happened before React hydrated
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  const fill = ratio === "fill";
  const showImage = Boolean(src) && !failed;
  const Icon = icons[kind];
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        rounded && "rounded-xl",
        fill && "h-full",
        dark ? "bg-neutral-900" : "bg-neutral-200 dark:bg-neutral-800",
        className,
      )}
      style={fill ? undefined : { aspectRatio: ratio }}
    >
      {showImage ? (
        <Image
          ref={imgRef}
          src={src as string}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-linear-to-br",
            dark
              ? "from-neutral-700 to-neutral-950"
              : "from-neutral-100 to-neutral-300 dark:from-neutral-700 dark:to-neutral-900",
          )}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,rgba(128,128,128,0.12) 0 1px,transparent 1px 9px)",
            }}
          />
          <span
            className={cn(
              "relative flex size-12 items-center justify-center rounded-full border",
              dark
                ? "border-white/25 text-neutral-300"
                : "border-neutral-500/40 text-neutral-600 dark:border-white/25 dark:text-neutral-300",
            )}
          >
            <Icon className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
          <span
            className={cn(
              "relative px-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em]",
              dark
                ? "text-neutral-400"
                : "text-neutral-600 dark:text-neutral-400",
            )}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
}