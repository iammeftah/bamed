"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { cn } from "@/lib/utils";

const rows = [
  {
    phrases: ["Coupe nette", "Porté facile", "Pensé pour bouger"],
    speed: -3,
    outline: false,
  },
  {
    phrases: ["Le style sans effort", "Basiques premium", "BAMED"],
    speed: 3,
    outline: true,
  },
];

/** Loops a value inside [min, max) */
function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

function Group({
  phrases,
  outline,
  hidden = false,
}: {
  phrases: string[];
  outline: boolean;
  hidden?: boolean;
}) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-8 pr-8 md:gap-14 md:pr-14"
    >
      {phrases.map((p) => (
        <li key={p} className="flex items-center gap-8 md:gap-14">
          <span
            className={cn(
              "whitespace-nowrap font-display text-[length:clamp(4.5rem,13vw,12rem)] font-bold uppercase leading-[0.95]",
              outline
                ? "text-transparent [-webkit-text-stroke:2px_var(--foreground)]"
                : "text-foreground",
            )}
          >
            {p}
          </span>
          <span
            aria-hidden
            className="size-4 shrink-0 rounded-full bg-gold md:size-6"
          />
        </li>
      ))}
    </ul>
  );
}

function ParallaxRow({
  phrases,
  speed,
  outline,
}: {
  phrases: string[];
  speed: number;
  outline: boolean;
}) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  // Faster scrolling speeds the row up. Scrolling up reverses it.
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let moveBy = direction.current * speed * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    moveBy += direction.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden py-2 md:py-3">
      <motion.div style={{ x }} className="flex w-max will-change-transform">
        <Group phrases={phrases} outline={outline} />
        <Group phrases={phrases} outline={outline} hidden />
      </motion.div>
    </div>
  );
}

export function ParallaxMarquee() {
  return (
    <section
      aria-label="Slogans BAMED"
      className="overflow-hidden bg-background py-12 md:py-20"
    >
      {rows.map((row) => (
        <ParallaxRow key={row.phrases[0]} {...row} />
      ))}
    </section>
  );
}
