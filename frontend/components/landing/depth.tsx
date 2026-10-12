"use client";

import {
  createContext,
  useContext,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

/** Distance of the "camera" in px. Lower value = stronger 3D. */
const PERSPECTIVE = 1200;

const pointerSpring = { stiffness: 90, damping: 20, mass: 0.6 };
const tiltSpring = { stiffness: 220, damping: 22, mass: 0.5 };

/* ------------------------------------------------------------------ */
/* DepthStage + DepthLayer                                             */
/* A stage is a 3D scene. Every DepthLayer inside it sits at its own   */
/* depth: it moves at its own speed with the mouse and with scroll,    */
/* and is pushed forward or back on the z axis.                        */
/* depth: -1 = far background, 0 = on the page plane, 1 = close to you */
/* ------------------------------------------------------------------ */

type StageContext = {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  progress: MotionValue<number>;
};

const StageCtx = createContext<StageContext | null>(null);

export function DepthStage({
  children,
  className,
  tilt = 3,
}: {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees when the mouse reaches the edge */
  tilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, pointerSpring);
  const my = useSpring(rawY, pointerSpring);

  // 0 when the stage is at the top of the viewport, 1 when it has scrolled out
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const rotateY = useTransform(mx, (v) => v * 2 * tilt);
  const rotateX = useTransform(my, (v) => v * -2 * tilt);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width - 0.5);
    rawY.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onPointerLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <StageCtx.Provider value={{ mx, my, progress: scrollYProgress }}>
      <div
        ref={ref}
        className={className}
        style={{ perspective: PERSPECTIVE }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <motion.div
          className="relative h-full w-full"
          style={
            reduce
              ? undefined
              : { rotateX, rotateY, transformStyle: "preserve-3d" }
          }
        >
          {children}
        </motion.div>
      </div>
    </StageCtx.Provider>
  );
}

export function DepthLayer({
  depth = 0,
  pointer = 40,
  scroll = 160,
  zSpread = 120,
  className,
  style,
  children,
}: {
  depth?: number;
  /** Max sideways travel (px) with the mouse, multiplied by depth */
  pointer?: number;
  /** Vertical travel (px) over the scroll of the stage, multiplied by depth */
  scroll?: number;
  /** Real z distance (px) for depth = 1 */
  zSpread?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const stage = useContext(StageCtx);
  const reduce = useReducedMotion();
  const idle = useMotionValue(0);
  const mx = stage?.mx ?? idle;
  const my = stage?.my ?? idle;
  const progress = stage?.progress ?? idle;

  const z = depth * zSpread;
  // Keeps the layer at its normal size once the perspective is applied
  const scale = (PERSPECTIVE - z) / PERSPECTIVE;

  // Near layers move against the mouse, far layers move with it
  const x = useTransform(mx, (v) => -v * 2 * depth * pointer);
  const y = useTransform([my, progress], (latest: number[]) => {
    const [m, p] = latest;
    return -m * 2 * depth * pointer - p * depth * scroll;
  });

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      style={{ ...style, x, y, z, scale }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Float: slow idle bobbing for floating decorations                   */
/* ------------------------------------------------------------------ */

export function Float({
  children,
  delay = 0,
  amplitude = 10,
  duration = 5,
}: {
  children: ReactNode;
  delay?: number;
  amplitude?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? undefined : { y: [0, -amplitude, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Tilt: a card that rotates toward the pointer. Children can sit at   */
/* different depths with style={{ transform: "translateZ(40px)" }}.   */
/* Do not put overflow-hidden on the element that holds those children */
/* (it flattens 3D). Put it on an inner wrapper instead.               */
/* ------------------------------------------------------------------ */

type TiltContext = { glare: MotionValue<string> };
const TiltCtx = createContext<TiltContext | null>(null);

export function Tilt({
  children,
  className,
  max = 8,
  perspective = 900,
}: {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees */
  max?: number;
  perspective?: number;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, tiltSpring);
  const sy = useSpring(py, tiltSpring);

  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const glare = useTransform(
    [sx, sy],
    (l: number[]) =>
      `radial-gradient(circle at ${l[0] * 100}% ${l[1] * 100}%, rgb(255 255 255 / 0.3), transparent 55%)`,
  );

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }

  function onPointerLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <TiltCtx.Provider value={{ glare }}>
      <div
        className={cn("group/tilt", className)}
        style={{ perspective }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <motion.div
          className="h-full"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        >
          {children}
        </motion.div>
      </div>
    </TiltCtx.Provider>
  );
}

/** Soft light that follows the pointer. Put it inside an overflow-hidden, relative wrapper. */
export function TiltGlare({ className }: { className?: string }) {
  const ctx = useContext(TiltCtx);
  if (!ctx) return null;
  return (
    <motion.div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100",
        className,
      )}
      style={{ background: ctx.glare }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* ScrollShift: moves an element up or down while it crosses the       */
/* viewport, so neighbours scroll at different speeds.                 */
/* ------------------------------------------------------------------ */

export function ScrollShift({
  children,
  speed = 40,
  className,
}: {
  children: ReactNode;
  /** Travel in px: starts at +speed and ends at -speed */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduce ? undefined : { y }}
    >
      {children}
    </motion.div>
  );
}