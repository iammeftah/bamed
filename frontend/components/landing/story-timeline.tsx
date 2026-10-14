"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { Reveal } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Le constat",
    text: "Trouver une pièce bien coupée, de bonne qualité, ne devrait pas être un parcours du combattant.",
  },
  {
    title: "La sélection",
    text: "Nos articles viennent surtout de Chine et de Turquie, choisis en qualité master.",
  },
  {
    title: "Trois univers",
    text: "Classe, streetwear et sport : une seule boutique pour tous les styles.",
  },
  {
    title: "La boutique",
    text: "À Sidi Bernoussi, Casablanca. On essaie, on choisit, on repart habillé.",
  },
  {
    title: "La vitrine",
    text: "Ce site : voir les pièces, leurs couleurs et leurs tailles avant de passer en boutique.",
  },
];

function Step({
  index,
  title,
  text,
}: {
  index: number;
  title: string;
  text: string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const reduce = useReducedMotion();
  const right = index % 2 === 0;
  const number = String(index + 1).padStart(2, "0");

  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Back layer: the big number drifts slowly the other way
  const numY = useTransform(p, [0, 1], [120, -120]);
  const numScale = useTransform(p, [0, 0.5, 1], [0.85, 1, 1.1]);
  // Middle layer: the card tilts in
  const cardRotate = useTransform(p, [0.1, 0.4], [16, 0]);
  const cardY = useTransform(p, [0.1, 0.4], [50, 0]);
  const cardOpacity = useTransform(p, [0.1, 0.35], [0, 1]);
  // Front layer: the ring floats faster than everything else
  const ringY = useTransform(p, [0, 1], [-70, 90]);
  // The node on the line lights up
  const dotOn = useTransform(p, [0.3, 0.45], [0, 1]);
  const dotScale = useTransform(p, [0.3, 0.45], [0.7, 1.15]);

  return (
    <li
      ref={ref}
      className="relative py-14 pl-14 md:grid md:grid-cols-2 md:gap-24 md:py-24 md:pl-0"
    >
      {/* Back layer */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 flex items-center select-none md:w-1/2 md:justify-center",
          right ? "md:left-0 md:right-auto" : "md:left-auto md:right-0",
        )}
      >
        <motion.span
          style={reduce ? undefined : { y: numY, scale: numScale }}
          className="font-display text-[8rem] font-bold leading-none text-transparent opacity-10 [-webkit-text-stroke:2px_var(--foreground)] md:text-[16rem]"
        >
          {number}
        </motion.span>
      </div>

      {/* Node on the line */}
      <span className="absolute left-5 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 md:left-1/2">
        <motion.span
          style={reduce ? undefined : { scale: dotScale }}
          className="relative block size-5 rounded-full border-2 border-gold bg-background"
        >
          <motion.span
            style={reduce ? undefined : { opacity: dotOn }}
            className="absolute inset-1 rounded-full bg-gold"
          />
        </motion.span>
      </span>

      {/* Middle layer: the card */}
      <div
        className={cn("relative", right ? "md:col-start-2" : "md:col-start-1")}
        style={reduce ? undefined : { perspective: 900 }}
      >
        <motion.div
          style={
            reduce
              ? undefined
              : {
                  rotateX: cardRotate,
                  y: cardY,
                  opacity: cardOpacity,
                  transformOrigin: "top center",
                }
          }
          className="relative rounded-xl border border-border bg-background/80 p-6 backdrop-blur md:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Étape {number}
          </p>
          <h3 className="mt-3 font-display text-4xl font-bold uppercase leading-none md:text-5xl">
            {title}
          </h3>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            {text}
          </p>
        </motion.div>

        {/* Front layer */}
        <motion.span
          aria-hidden
          style={reduce ? undefined : { y: ringY }}
          className="pointer-events-none absolute -right-3 -top-8 z-10 size-14 rounded-full border-2 border-gold md:-right-8 md:size-20"
        />
      </div>
    </li>
  );
}

export function StoryTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "end 55%"],
  });
  const fill = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });

  return (
    <section
      aria-labelledby="parcours"
      className="overflow-hidden bg-background pb-16 md:pb-24"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <Reveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Notre parcours
          </p>
          <h2
            id="parcours"
            className="max-w-3xl font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl"
          >
            De l&apos;idée à la boutique
          </h2>
        </Reveal>

        <div ref={ref} className="relative mt-10 md:mt-16">
          {/* The line: grey track, gold fill that follows the scroll */}
          <div
            aria-hidden
            className="absolute bottom-0 left-5 top-0 w-px -translate-x-1/2 bg-border md:left-1/2"
          />
          <motion.div
            aria-hidden
            style={{ scaleY: reduce ? 1 : fill }}
            className="absolute bottom-0 left-5 top-0 w-px origin-top -translate-x-1/2 bg-gold md:left-1/2"
          />

          <ol>
            {steps.map((s, i) => (
              <Step key={s.title} index={i} title={s.title} text={s.text} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}