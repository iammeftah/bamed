"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductColor } from "@/lib/products";
import { cn } from "@/lib/utils";

type Ctx = {
  colors: ProductColor[];
  color: ProductColor | undefined;
  select: (name: string) => void;
};

const ColorCtx = createContext<Ctx | null>(null);

export function useProductColor() {
  const ctx = useContext(ColorCtx);
  if (!ctx)
    throw new Error("useProductColor doit être utilisé dans <ColorProvider>.");
  return ctx;
}

export function ColorProvider({
  colors,
  initial,
  children,
}: {
  colors: ProductColor[];
  /** Colour name from the URL (?couleur=...), ignored if it does not exist */
  initial?: string;
  children: ReactNode;
}) {
  const [name, setName] = useState(
    () => colors.find((c) => c.name === initial)?.name ?? colors[0]?.name,
  );

  const select = useCallback((next: string) => {
    setName(next);
    const url = new URL(window.location.href);
    url.searchParams.set("couleur", next);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}`,
    );
  }, []);

  const color = colors.find((c) => c.name === name) ?? colors[0];
  const value = useMemo(() => ({ colors, color, select }), [colors, color, select]);

  return <ColorCtx.Provider value={value}>{children}</ColorCtx.Provider>;
}

export function ColorPicker() {
  const { colors, color, select } = useProductColor();

  return (
    <ul aria-label="Couleurs" className="flex flex-wrap gap-2">
      {colors.map((c) => {
        const on = c.name === color?.name;
        return (
          <li key={c.name}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => select(c.name)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
                on
                  ? "bg-foreground text-background"
                  : "bg-muted hover:bg-foreground/10",
              )}
            >
              <span
                aria-hidden
                className="size-5 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.4)]"
                style={{ backgroundColor: c.hex }}
              />
              {c.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}