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
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Add or remove pages here, the desktop bar and the mobile panel both follow. */
const links = [
  { label: "Accueil", href: "/" },
  { label: "Boutique", href: "/boutique" },
  { label: "Nouveautés", href: "/#nouveautes" },
  { label: "À propos", href: "/a-propos" },
];

const roleLabel = {
  admin: "Administrateur",
  manager: "Gestionnaire",
  customer: "Client",
} as const;

const iconBtn =
  "flex size-10 items-center justify-center rounded-md transition-opacity hover:opacity-60 sm:size-9";
const icon = "size-[18px]";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > previous && y > 200);
  });

  const overlay = open || account;

  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setAccount(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  // The auth pages are full-screen and carry their own logo and back link
  if (pathname === "/connexion" || pathname === "/inscription") return null;

  // Dark glass with light text only over the home hero
  const clear = pathname === "/" && !scrolled && !open;

  const closeAll = () => {
    setOpen(false);
    setAccount(false);
  };

  async function onLogout() {
    closeAll();
    await logout();
  }

  return (
    <>
      {overlay && (
        <button
          type="button"
          aria-label="Fermer"
          onClick={closeAll}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}

      <motion.header
        animate={{ y: hidden && !overlay ? "-150%" : "0%" }}
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
              onClick={closeAll}
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

              {/* Account (tablet and desktop) */}
              <div className="relative hidden sm:block">
                {status === "loading" && <span className="block size-9" />}
                {status === "anonymous" && (
                  <Link
                    href="/connexion"
                    aria-label="Se connecter"
                    className={iconBtn}
                  >
                    <UserIcon className={icon} aria-hidden />
                  </Link>
                )}
                {status === "authenticated" && user && (
                  <>
                    <button
                      type="button"
                      onClick={() => setAccount((v) => !v)}
                      aria-label="Mon compte"
                      aria-expanded={account}
                      className="flex size-9 items-center justify-center rounded-md bg-current/10 text-xs font-bold uppercase transition-opacity hover:opacity-70"
                    >
                      {user.name.charAt(0)}
                    </button>
                    <AnimatePresence>
                      {account && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease }}
                          className="absolute right-0 top-full mt-2 w-60 rounded-lg bg-background p-2 text-foreground shadow-[0_20px_50px_rgb(0_0_0/0.18)]"
                        >
                          <div className="px-3 py-2">
                            <p className="truncate text-sm font-semibold">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                              {roleLabel[user.role]}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={onLogout}
                            className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm font-semibold transition-opacity hover:opacity-60"
                          >
                            <LogOut className="size-4" aria-hidden />
                            Se déconnecter
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

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
                    onClick={closeAll}
                    aria-current={pathname === l.href ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2.5 font-display text-3xl font-bold uppercase leading-none transition-opacity",
                      pathname === l.href ? "opacity-100" : "opacity-60 hover:opacity-100",
                    )}
                  >
                    {l.label}
                    <ArrowUpRight className="size-5" aria-hidden />
                  </Link>
                ))}

                <div className="mt-2 flex gap-2 p-1">
                  {status === "authenticated" && user ? (
                    <>
                      <div className="min-w-0 flex-1 px-2">
                        <p className="truncate text-sm font-semibold">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {roleLabel[user.role]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onLogout}
                        className="flex h-10 items-center gap-2 rounded-md bg-muted px-3 text-sm font-semibold"
                      >
                        <LogOut className="size-4" aria-hidden />
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/connexion"
                        onClick={closeAll}
                        className="flex h-10 flex-1 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-background"
                      >
                        Se connecter
                      </Link>
                      <Link
                        href="/inscription"
                        onClick={closeAll}
                        className="flex h-10 flex-1 items-center justify-center rounded-md bg-muted text-sm font-semibold"
                      >
                        Créer un compte
                      </Link>
                    </>
                  )}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </motion.header>
    </>
  );
}