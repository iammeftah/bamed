// frontend/components/admin/admin-shell.tsx
"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/**
 * Back office look: always dark, flat surfaces with hairline borders.
 * These override the shadcn tokens for everything inside the shell only.
 */
const tokens = {
  "--background": "#010102",
  "--foreground": "#f7f8f8",
  "--card": "#0f1011",
  "--card-foreground": "#f7f8f8",
  "--muted": "#141516",
  "--muted-foreground": "#8a8f98",
  "--border": "#23252a",
} as CSSProperties;

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Page not built yet: shown greyed out */
  soon?: boolean;
};

/** Add pages here, the desktop sidebar and the mobile drawer both follow. */
const nav: NavItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Produits", href: "/admin/produits", icon: Package, soon: true },
  { label: "Catégories", href: "/admin/categories", icon: Tag, soon: true },
  { label: "Paramètres", href: "/admin/parametres", icon: Settings, soon: true },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          aria-label="BAMED, tableau de bord"
          className="font-display text-xl font-bold tracking-[0.3em]"
        >
          BAMED
        </Link>
      </div>

      <nav aria-label="Navigation admin" className="flex-1 space-y-1 p-3">
        {nav.map(({ label, href, icon: Icon, soon }) => {
          const active = pathname === href;
          if (soon) {
            return (
              <span
                key={href}
                aria-disabled="true"
                className="flex h-9 cursor-not-allowed items-center gap-3 rounded-md px-3 text-sm text-muted-foreground/60"
              >
                <Icon className="size-4" aria-hidden />
                {label}
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  Bientôt
                </span>
              </span>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon
                className={cn("size-4", active && "text-gold")}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <ExternalLink className="size-4" aria-hidden />
          Voir le site
        </Link>
        <div className="flex items-center gap-2 px-3 pt-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.phone}
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Se déconnecter"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      className="dark min-h-svh bg-background text-foreground"
      style={tokens}
    >
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-card lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60"
          />
          <aside
            id="admin-menu"
            className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card"
          >
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            aria-controls="admin-menu"
            className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            {open ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
          <p className="text-sm font-medium">{title}</p>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}