"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { BrandSphere } from "@/components/landing/brand-sphere";
import { CtaButton } from "@/components/landing/cta-button";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const lines = [
  ["Coupe", "nette."],
  ["Porté", "facile."],
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

const word: Variants = {
  hidden: { y: "115%" },
  show: { y: "0%", transition: { duration: 0.9, ease } },
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  // The hero is taller than the screen and its content stays pinned.
  // progress goes 0 -> 1 while it is pinned and drives the tile spread.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });

  // The headline fades out while the tiles pull apart
  const textOpacity = useTransform(progress, [0.05, 0.3, 0.5], [1, 1, 0]);
  const textY = useTransform(progress, [0, 0.5], [0, -70]);
  const textScale = useTransform(progress, [0, 0.5], [1, 1.06]);
  // The dark patch behind the headline fades with it, so the grid shows fully
  const shade = useTransform(progress, [0.05, 0.5], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-[230svh] bg-black text-white motion-reduce:h-svh"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <BrandSphere progress={progress} />

        {/* Calms the middle of the grid so the headline stays readable */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: shade,
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgb(0 0 0 / 0.7), rgb(0 0 0 / 0.3) 65%, transparent 100%)",
          }}
        />
        {/* Darkens the edges so the dome fades out instead of ending abruptly */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.55) 100%)",
          }}
        />
        {/* Keeps the header and the buttons readable */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/70"
        />

        <motion.div
          style={{ opacity: textOpacity, y: textY, scale: textScale }}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-5 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-gold sm:text-sm"
          >
            Nouvelle saison homme
          </motion.p>

          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="font-display text-[length:clamp(3.75rem,15vw,11rem)] font-bold uppercase leading-[0.9]"
          >
            {lines.map((line, i) => (
              <span key={i} className="block">
                {line.map((w) => (
                  <span
                    key={w}
                    className="mx-[0.1em] inline-block overflow-hidden pb-[0.06em] align-bottom"
                  >
                    <motion.span variants={word} className="inline-block">
                      {w}
                    </motion.span>
                  </span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 1.0 }}
            className="mt-6 max-w-md text-base text-white/85 md:text-lg"
          >
            La mode homme premium du quotidien, des coupes nettes pensées pour
            bouger avec vous.
          </motion.p>
        </motion.div>

        {/* The buttons stay visible for the whole pinned scroll */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 1.2 }}
          className="absolute inset-x-0 bottom-10 z-20 flex flex-col items-center gap-3 px-5 sm:flex-row sm:justify-center md:bottom-14"
        >
          <CtaButton href="#nouveautes" variant="gold" arrow>
            Voir les nouveautés
          </CtaButton>
          <CtaButton href="#collections" variant="outline">
            Découvrir les collections
          </CtaButton>
        </motion.div>
      </div>
    </section>
  );
}