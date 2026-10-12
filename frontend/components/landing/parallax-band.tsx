"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";

export function ParallaxBand() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Photo and text travel in opposite directions, at different speeds
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["-10%", "10%"],
  );
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [90, -90]);

  return (
    <section
      ref={ref}
      aria-label="Notre approche"
      className="relative isolate flex h-[75svh] min-h-[420px] items-center overflow-hidden bg-black text-white md:h-[85svh]"
    >
      <motion.div
        style={{ y: imageY, top: "-15%", bottom: "-15%" }}
        className="absolute inset-x-0 -z-10 will-change-transform"
      >
        <ImagePlaceholder
          src="/images/categories/outerwear.jpg"
          alt="Veste en laine pour homme"
          ratio="fill"
          label="Photo bannière"
          kind="hero"
          tone="dark"
          sizes="100vw"
        />
      </motion.div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/45" />

      <motion.div
        style={{ y: textY }}
        className="mx-auto w-full max-w-[1440px] px-5 md:px-10"
      >
        <h2 className="max-w-3xl font-display text-[length:clamp(2.5rem,8vw,6.5rem)] font-bold uppercase leading-[0.9]">
          Un vestiaire simple, pensé pour durer.
        </h2>
        <p className="mt-4 max-w-md text-sm text-white/85 md:text-base">
          Moins de pièces, mieux choisies. Des basiques qui se combinent entre
          eux.
        </p>
      </motion.div>
    </section>
  );
}