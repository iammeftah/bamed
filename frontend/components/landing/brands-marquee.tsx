"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { brands, type Brand } from "@/lib/products";

/**
 * How each logo file is handled:
 * - mark: dark glyph on transparent. Gray in light mode, white in dark mode.
 * - box: logo has its own colored box. Kept as-is (gray until hover).
 * - text: file is unusable, show the brand name instead.
 * scale zooms logos whose file has a lot of empty canvas around them.
 */
type Kind = "mark" | "box" | "text";

const config: Record<string, { kind: Kind; scale?: number }> = {
  Lacoste: { kind: "mark" },
  Adidas: { kind: "mark" },
  Zara: { kind: "mark" },
  "The North Face": { kind: "mark", scale: 1.4 },
  Puma: { kind: "box", scale: 1.4 },
  Reebok: { kind: "box", scale: 1.3 },
  "Tommy Hilfiger": { kind: "box", scale: 1.3 },
  "Polo Ralph Lauren": { kind: "text" },
};

const markClass =
  "opacity-70 grayscale hover:opacity-100 dark:opacity-80 dark:grayscale-0 dark:brightness-0 dark:invert dark:hover:opacity-100";
const boxClass =
  "rounded-[3px] opacity-80 grayscale hover:opacity-100";

function Logo({ brand }: { brand: Brand }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { kind, scale } = config[brand.name] ?? { kind: "mark" as Kind };

  // Catches a 404 that happened before React hydrated
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <div className="flex h-20 w-40 items-center justify-center md:h-24 md:w-52">
      {failed || kind === "text" ? (
        <span className="px-2 text-center font-display text-lg font-bold uppercase leading-none tracking-[0.14em] text-foreground/70 md:text-2xl">
          {brand.name}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={brand.src}
          alt={brand.name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={scale ? { transform: `scale(${scale})` } : undefined}
          className={`max-h-14 max-w-32 object-contain transition duration-300 md:max-h-16 md:max-w-40 ${
            kind === "mark" ? markClass : boxClass
          }`}
        />
      )}
    </div>
  );
}

function Group({ hidden = false }: { hidden?: boolean }) {
  // Repeated twice so one group always fills wide screens
  const list = [...brands, ...brands];
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-4 pr-4 md:gap-8 md:pr-8"
    >
      {list.map((b, i) => (
        <li key={`${b.name}-${i}`} className="flex items-center">
          <Logo brand={b} />
        </li>
      ))}
    </ul>
  );
}

export function BrandsMarquee() {
  return (
    <section aria-label="Nos marques" className="bg-background py-10 md:py-14">
      <p className="mb-6 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        <BadgeCheck className="size-4 text-gold" aria-hidden />
        Nos marques
      </p>
      <div className="marquee marquee-reverse overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="marquee-track flex w-max">
          <Group />
          <Group hidden />
        </div>
      </div>
    </section>
  );
}