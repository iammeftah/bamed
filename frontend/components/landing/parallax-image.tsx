"use client";

import { useRef, type ComponentProps } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";

type Props = Omit<ComponentProps<typeof ImagePlaceholder>, "ratio" | "className"> & {
  /** Frame aspect ratio, e.g. "3 / 4" */
  ratio: string;
};

/** Photo that slides inside a fixed frame while the frame crosses the screen. */
export function ParallaxImage({ ratio, ...image }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["-8%", "8%"],
  );

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: ratio }}
    >
      <motion.div
        style={{ y, top: "-10%", bottom: "-10%" }}
        className="absolute inset-x-0 will-change-transform"
      >
        <ImagePlaceholder {...image} ratio="fill" />
      </motion.div>
    </div>
  );
}