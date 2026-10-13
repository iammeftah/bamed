// frontend/components/site/site-header.tsx
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
import {
  ArrowUpRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { cn } from "@/lib/utils";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Add or remove pages here, the desktop bar and the mobile panel both follow. */
const links = [
  { label: "Accueil", href: "/" },
  { label: "Boutique", href: "/boutique" },
  { label: "Nouveautés", href: "/#nouveautes" },
  { label: "À propos", href: "/a-propos" },
];

const iconBtn =
  "flex size-10 items-center justify-center rounded-md transition-opacity hover:opacity-60 sm:size-9";
const icon = "size-[18px]";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
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

  // The back office has its own layout: no public header there
  if (pathname.startsWith("/admin")) return null;

  // Dark glass with light text only over the home hero
  const clear = pathname === "/" && !scrolled && !open;

  const close = () => setOpen(false);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fermer"
          onClick={close}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}

      <motion.header
        animate={{ y: hidden && !open ? "-150%" : "0%" }}
        transition={{ duration: 0.4, ease }}
        className="fixed inset-x-0 top-3 z-50 px-3 md:top-4 md:px-6"
      >
        <div className="relative mx-auto w-full max-w-6xl">
          <div
            className={cn(
              "flex h-12 items-center justify-between gap-3 rounded-xl pl-4 pr-1.5 backdrop-blur-xl transition-colors duration-300 md:h-14 md:pl-5",
              clear
                ? "bg-black/20 text-white"
                : "bg-background/80 text-foreground shadow-[0_8px_30px_rgb(0_0_0/0.08)]",
            )}
          >
            <Link
              href="/"
              onClick={close}
              aria-label="BAMED, accueil"
              className="font-display text-xl font-bold tracking-[0.3em]"
            >
              BAMED
            </Link>

            <nav
              aria-label="Navigation principale"
              className="absolute left-1/2 hidden -translate-x-1/2 items-center md:flex"
            >
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.label}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative px-3 py-1.5 text-[13px] font-semibold tracking-tight transition-opacity",
                      active ? "opacity-100" : "opacity-60 hover:opacity-100",
                    )}
                  >
                    {l.label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 -bottom-px h-px bg-gold"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center">
              <Link
                href="/boutique"
                aria-label="Rechercher dans la boutique"
                className={cn(iconBtn, "hidden sm:flex")}
              >
                <Search className={icon} aria-hidden />
              </Link>
              <button
                type="button"
                aria-label="Mes favoris"
                className={cn(iconBtn, "hidden lg:flex")}
              >
                <Heart className={icon} aria-hidden />
              </button>
              <ThemeToggle />
              <button type="button" aria-label="Mon panier" className={iconBtn}>
                <ShoppingBag className={icon} aria-hidden />
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
                  <X className="size-5" aria-hidden />
                ) : (
                  <Menu className="size-5" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {open && (
              <motion.nav
                id="menu-mobile"
                aria-label="Navigation mobile"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease }}
                className="absolute inset-x-0 top-full mt-2 rounded-lg bg-background p-2 text-foreground shadow-[0_20px_50px_rgb(0_0_0/0.18)] md:hidden"
              >
                {links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={close}
                    aria-current={pathname === l.href ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2.5 font-display text-3xl font-bold uppercase leading-none transition-opacity",
                      pathname === l.href
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100",
                    )}
                  >
                    {l.label}
                    <ArrowUpRight className="size-5" aria-hidden />
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