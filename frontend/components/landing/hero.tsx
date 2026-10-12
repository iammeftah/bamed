"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "motion/react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { CtaButton } from "@/components/landing/cta-button";
import { images } from "@/lib/products";

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
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1.25]);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-black text-white"
    >
      <motion.div
        style={{ y, scale }}
        className="absolute inset-0 -z-10 will-change-transform"
      >
        <ImagePlaceholder
          src={images.hero.src}
          alt={images.hero.alt}
          ratio="fill"
          label="Photo hero 16:10"
          kind="hero"
          tone="dark"
          sizes="100vw"
          priority
          rounded={false}
        />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/25 to-black/50" />

      <div className="mx-auto flex min-h-svh w-full max-w-[1440px] flex-col justify-end px-5 pb-10 pt-24 md:px-10 md:pb-14">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-gold sm:text-sm"
        >
          Nouvelle saison homme
        </motion.p>

        <motion.h1
          variants={container}
          initial="hidden"
          animate="show"
          className="font-display text-[length:clamp(3.75rem,16vw,12rem)] font-bold uppercase leading-[0.9]"
        >
          {lines.map((line, i) => (
            <span key={i} className="block">
              {line.map((w) => (
                <span
                  key={w}
                  className="mr-[0.2em] inline-block overflow-hidden pb-[0.06em] align-bottom"
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 1.2 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
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