"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Tags,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ADMIN_HOME } from "@/lib/auth/redirect";
import { useDashboard } from "@/lib/dashboard/store";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/auth";

const groups = [
  {
    title: "Pilotage",
    items: [
      {
        label: "Vue d'ensemble",
        href: ADMIN_HOME,
        icon: LayoutDashboard,
        exact: true,
      },
      { label: "Ventes", href: `${ADMIN_HOME}/sales`, icon: ShoppingCart },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Produits", href: `${ADMIN_HOME}/products`, icon: Package },
      { label: "Catégories", href: `${ADMIN_HOME}/categories`, icon: Tags },
    ],
  },
  {
    title: "Équipe",
    items: [
      {
        label: "Administrateurs",
        href: `${ADMIN_HOME}/team`,
        icon: ShieldCheck,
        adminOnly: true,
      },
      {
        label: "Journal d'activité",
        href: `${ADMIN_HOME}/logs`,
        icon: ScrollText,
        adminOnly: true,
      },
    ],
  },
];

const roleLabel: Record<Role, string> = {
  admin: "Administrateur",
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // RequireAuth sends the visitor to /admin/auth once the session is gone
  async function onLogout() {
    await logout();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-5">
        <Link
          href={ADMIN_HOME}
          onClick={onNavigate}
          className="font-display text-xl font-bold tracking-[0.3em]"
        >
          BAMED
        </Link>
        <span className="ml-3 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
          Admin
        </span>
      </div>

      <nav
        aria-label="Navigation du tableau de bord"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        {groups.map((g) => {
          const items = g.items.filter(
            (i) => !("adminOnly" in i && i.adminOnly) || user?.role === "admin",
          );
          if (items.length === 0) return null;
          return (
            <div key={g.title} className="mb-6">
              <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {g.title}
              </p>
              <ul className="space-y-0.5">
                {items.map(({ label, href, icon: Icon, ...rest }) => {
                  const exact = "exact" in rest && rest.exact;
                  const active = exact
                    ? pathname === href
                    : pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au site
        </Link>
        {user && (
          <div className="mt-2 flex items-center gap-2.5 rounded-md px-2.5 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold uppercase">
              {user.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {roleLabel[user.role]}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Se déconnecter"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const d = useDashboard();
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
    <div className="min-h-svh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-background lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar and drawer */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <span className="font-display text-xl font-bold tracking-[0.3em]">
          BAMED
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-md hover:bg-accent"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/70"
          />
          <aside className="relative h-full w-72 max-w-[85vw] border-r border-border bg-background">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md hover:bg-accent"
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-8 md:px-8">
          {d.loadError && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between gap-3 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {d.loadError}
              <button
                type="button"
                onClick={d.reload}
                className="font-semibold underline underline-offset-4"
              >
                Réessayer
              </button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}