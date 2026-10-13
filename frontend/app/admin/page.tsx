// frontend/app/admin/page.tsx
"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { RequireAuth } from "@/components/auth/require-auth";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { products } from "@/lib/products";

function Dashboard() {
  const { user, logout } = useAuth();

  // RequireAuth sends the visitor back to the login once the session is gone
  const stats = [
    { label: "Produits", value: products.length },
    { label: "En promotion", value: products.filter((p) => p.oldPrice).length },
    {
      label: "Nouveautés",
      value: products.filter((p) => p.tag === "Nouveau").length,
    },
  ];

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 md:px-10">
          <Link
            href="/"
            aria-label="BAMED, voir le site"
            className="font-display text-2xl font-bold tracking-[0.3em]"
          >
            BAMED
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user?.phone}
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-muted px-3 text-sm font-semibold transition-colors hover:bg-foreground/10"
            >
              <LogOut className="size-4" aria-hidden />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-5 py-10 md:px-10 md:py-16">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          Tableau de bord
        </p>
        <h1 className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-7xl">
          Bonjour, {user?.name}
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Bienvenue dans l&apos;espace d&apos;administration de BAMED.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-muted p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-3 font-display text-6xl font-bold leading-none tabular-nums">
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Chiffres basés sur les données d&apos;exemple.
        </p>

        <div className="mt-10 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-display text-3xl font-bold uppercase leading-none">
            Bientôt
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            La gestion des produits et du catalogue arrive ici.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth roles={["admin"]}>
      <Dashboard />
    </RequireAuth>
  );
}