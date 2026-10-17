"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveImageSrc } from "@/lib/images";

/** Fills its (relative) parent. The parent should have a light background. */
export function BrandLogo({
  name,
  logo,
  sizes = "80px",
}: {
  name: string;
  logo?: string;
  sizes?: string;
}) {
  const src = resolveImageSrc(logo);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-neutral-900">
        {name}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      className="object-contain p-3"
      onError={() => setFailedSrc(src)}
    />
  );
}