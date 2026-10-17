"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { brands, type Brand } from "@/lib/products";

/**
 * A wall of brand tiles bent into the inside of a dome, seen from its centre.
 *
 * Every tile sits on a sphere: it is pushed out by the radius (--R), then
 * turned up/down by its row and left/right by its column. The distance
 * between neighbours is the step angle (--step) multiplied by --spread, so
 * raising --spread slides the tiles apart without changing their size.
 */

const COLS = 5; // columns run from -COLS to +COLS
const ROWS = 4; // rows run from -ROWS to +ROWS

/** On phones only the centre of the dome is visible: outer tiles are not rendered. */
const MOBILE_COLS = 3;
const MOBILE_ROWS = 3;

/** How far apart the tiles end up at the end of the scroll (1 = touching). */
const MAX_SPREAD = 1.6;

const pointerSpring = { stiffness: 70, damping: 18, mass: 0.7 };

/**
 * How each logo file is shown on a dark tile:
 * - mark: dark glyph on transparent, turned white.
 * - box: the logo has its own coloured box, kept as it is.
 * - text: file is unusable, the brand name is written instead.
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

const TILE_TRANSFORM =
  "rotateY(calc(var(--col) * var(--step) * var(--spread) * 1deg)) " +
  "rotateX(calc(var(--row) * var(--step) * var(--spread) * 1deg)) " +
  "translateZ(calc(var(--R) * -1))";

const tileBase: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "var(--tile)",
  height: "var(--tile)",
  marginLeft: "calc(var(--tile) / -2)",
  marginTop: "calc(var(--tile) / -2)",
  transform: TILE_TRANSFORM,
};

type Cell = {
  key: string;
  col: number;
  row: number;
  variant: "logo" | "ghost" | "gold";
  brand: Brand;
  /** Outside the part of the dome a phone can see */
  farOnMobile: boolean;
};

/** Fixed layout so server and browser always draw the same tiles. */
const cells: Cell[] = [];
for (let row = -ROWS; row <= ROWS; row++) {
  for (let col = -COLS; col <= COLS; col++) {
    const k = Math.abs(col * 7 + row * 13);
    const variant: Cell["variant"] =
      k % 4 === 0 ? "ghost" : k % 11 === 0 ? "gold" : "logo";
    // Offsetting each row keeps the same brand from lining up in a column
    const brand = brands[(col + COLS + (row + ROWS) * 3) % brands.length];
    cells.push({
      key: `${col}:${row}`,
      col,
      row,
      variant,
      brand,
      farOnMobile: Math.abs(col) > MOBILE_COLS || Math.abs(row) > MOBILE_ROWS,
    });
  }
}

function BrandMark({ brand }: { brand: Brand }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { kind, scale } = config[brand.name] ?? { kind: "mark" as Kind };

  // Catches a 404 that happened before React hydrated
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed || kind === "text") {
    return (
      <span
        className="px-2 text-center font-display font-bold uppercase leading-none tracking-[0.12em] text-white"
        style={{ fontSize: "calc(var(--tile) * 0.17)" }}
      >
        {brand.name}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={brand.src}
      alt=""
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      style={scale ? { transform: `scale(${scale})` } : undefined}
      className={
        kind === "mark"
          ? "max-h-[42%] max-w-[62%] object-contain brightness-0 invert"
          : "max-h-[42%] max-w-[62%] rounded-lg object-contain opacity-95 grayscale"
      }
    />
  );
}

export function BrandSphere({
  progress,
}: {
  /** 0 at the top of the hero, 1 when the pinned scroll ends */
  progress: MotionValue<number>;
}) {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);

  // Scrolling pushes the tiles apart. Written straight to a CSS variable so
  // React never re-renders while you scroll.
  const spread = useTransform(progress, [0, 0.85, 1], [1, MAX_SPREAD, MAX_SPREAD]);
  useMotionValueEvent(spread, "change", (v) => {
    if (reduce) return;
    stageRef.current?.style.setProperty("--spread", v.toFixed(3));
  });

  // Moving the mouse turns your head inside the dome
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, pointerSpring);
  const my = useSpring(rawY, pointerSpring);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      rawX.set(e.clientX / window.innerWidth - 0.5);
      rawY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, rawX, rawY]);

  const rotateY = useTransform(mx, (v) => v * 10);
  // The camera also tips up a little as you scroll
  const rotateX = useTransform([my, progress], (l: number[]) => -l[0] * 8 + l[1] * 10);

  return (
    <div
      ref={stageRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 [--R:640px] [--k:0.128] [--step:8] md:[--R:1000px] md:[--k:0.17] md:[--step:10.5]"
      style={
        {
          perspective: "var(--R)",
          "--tile": "calc(var(--R) * var(--k))",
          "--spread": 1,
        } as CSSProperties
      }
    >
      {/* Moves the dome's centre to the camera, so the tiles wrap around you */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: "translateZ(var(--R))",
        }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            rotateX: reduce ? 0 : rotateX,
            rotateY: reduce ? 0 : rotateY,
          }}
        >
          {cells.map((c) => (
            <div
              key={c.key}
              className={c.farOnMobile ? "max-md:hidden" : undefined}
              style={
                { ...tileBase, "--col": c.col, "--row": c.row } as CSSProperties
              }
            >
              <div className="flex h-full w-full items-center justify-center rounded-xl">
                {c.variant !== "ghost" && <BrandMark brand={c.brand} />}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}