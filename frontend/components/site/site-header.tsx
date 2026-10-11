"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { ArrowUpRight, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { cn } from "@/lib/utils";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Add or remove pages here, the desktop pill and the mobile panel both follow. */
const links = [
  { label: "Accueil", href: "/" },
  { label: "Boutique", href: "/boutique" },
  { label: "Nouveautés", href: "/#nouveautes" },
  { label: "À propos", href: "/a-propos" },
];

const iconBtn =
  "flex size-11 items-center justify-center rounded-full transition-colors hover:bg-current/10";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > previous && y > 200);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Dark glass with white text only over the home hero
  const clear = pathname === "/" && !scrolled;
  const activeLabel = links.find((l) => l.href === pathname)?.label ?? null;
  const highlighted = hovered ?? activeLabel;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default md:hidden"
        />
      )}

      <motion.header
        animate={{ y: hidden && !open ? "-150%" : "0%" }}
        transition={{ duration: 0.4, ease }}
        className="fixed inset-x-0 top-3 z-50 flex justify-center px-3 md:top-5 md:px-6"
      >
        <div className="relative w-full max-w-5xl">
          <div
            className={cn(
              "flex h-14 items-center justify-between rounded-full pl-6 pr-1.5 backdrop-blur-xl transition-colors duration-300 md:h-16",
              clear
                ? "bg-black/25 text-white"
                : "bg-background/80 text-foreground shadow-[0_8px_30px_rgb(0_0_0/0.08)]",
            )}
          >
            <Link
              href="/"
              aria-label="BAMED, accueil"
              className="font-display text-2xl font-bold tracking-[0.28em]"
            >
              BAMED
            </Link>

            <nav
              aria-label="Navigation principale"
              onMouseLeave={() => setHovered(null)}
              className="hidden items-center md:flex"
            >
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  onMouseEnter={() => setHovered(l.label)}
                  onFocus={() => setHovered(l.label)}
                  onBlur={() => setHovered(null)}
                  className="relative rounded-full px-4 py-2 text-sm font-semibold tracking-tight"
                >
                  {highlighted === l.label && (
                    <motion.span
                      layoutId="nav-highlight"
                      aria-hidden
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-current/10"
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <button type="button" aria-label="Rechercher" className={iconBtn}>
                <Search className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Mes favoris"
                className={cn(iconBtn, "hidden sm:flex")}
              >
                <Heart className="size-5" aria-hidden />
              </button>
              <ThemeToggle />
              <button
                type="button"
                aria-label="Mon panier"
                className="ml-1 flex size-11 items-center justify-center rounded-full bg-gold text-gold-foreground transition-transform active:scale-95"
              >
                <ShoppingBag className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={open}
                aria-controls="menu-mobile"
                className={cn(iconBtn, "md:hidden")}
              >
                {open ? (
                  <X className="size-6" aria-hidden />
                ) : (
                  <Menu className="size-6" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {open && (
              <motion.nav
                id="menu-mobile"
                aria-label="Navigation mobile"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease }}
                className="absolute inset-x-0 top-full mt-2 rounded-3xl bg-background p-3 text-foreground shadow-[0_20px_50px_rgb(0_0_0/0.18)] md:hidden"
              >
                {links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === l.href ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-4 font-display text-4xl font-bold uppercase leading-none transition-colors hover:bg-muted",
                      pathname === l.href && "bg-muted",
                    )}
                  >
                    {l.label}
                    <ArrowUpRight className="size-6" aria-hidden />
                  </Link>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </motion.header>
    </>
  );
}