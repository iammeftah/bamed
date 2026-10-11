"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  gold: "bg-gold text-gold-foreground sheen",
  dark: "bg-foreground text-background",
  light: "bg-white text-neutral-950",
  outline: "border border-white/70 text-white hover:bg-white/10",
};

export function CtaButton({
  href = "#",
  children,
  variant = "gold",
  arrow = false,
  className,
}: {
  href?: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full px-6 text-base font-semibold whitespace-nowrap sm:px-8",
        variants[variant],
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
        {arrow && (
          <ArrowRight
            className="size-5 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden
          />
        )}
      </span>
    </motion.a>
  );
}