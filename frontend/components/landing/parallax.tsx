"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

/**
 * Drifts its children vertically while the block crosses the screen.
 * distance = pixels of travel each way (negative reverses the direction).
 * decorative = hides the block from screen readers.
 */
export function Parallax({
  children,
  distance = 60,
  className,
  decorative = false,
}: {
  children?: ReactNode;
  distance?: number;
  className?: string;
  decorative?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [distance, -distance],
  );

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      aria-hidden={decorative || undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}