// frontend/components/admin/dashboard-view.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CircleAlert, Plus, Store } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatMAD } from "@/lib/products";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types/dashboard";

const card = "rounded-xl border border-border bg-card";

export function DashboardView() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    setStats(null);
    try {
      setStats(await dashboardService.getStats());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = stats
    ? [
        { label: "Produits", value: stats.totalProducts },
        { label: "En promotion", value: stats.onSale },
        { label: "Nouveautés", value: stats.newArrivals },
        { label: "Catégories", value: stats.categories },
      ]
    : null;

  const maxCount = stats
    ? Math.max(1, ...stats.byType.map((t) => t.count))
    : 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Tableau de bord
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Bonjour, {user?.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Un aperçu de votre boutique.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/boutique"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Store className="size-4" aria-hidden />
            Voir la boutique
          </Link>
          <button
            type="button"
            disabled
            title="Bientôt disponible"
            className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md bg-gold px-3.5 text-sm font-medium text-gold-foreground opacity-50"
          >
            <Plus className="size-4" aria-hidden />
            Ajouter un produit
          </button>
        </div>
      </div>

      {failed && (
        <div
          role="alert"
          className={`${card} flex flex-wrap items-center gap-3 p-5 text-sm`}
        >
          <CircleAlert className="size-5 text-destructive" aria-hidden />
          <p className="flex-1">Impossible de charger les statistiques.</p>
          <button
            type="button"
            onClick={load}
            className="h-9 rounded-md bg-muted px-3.5 font-medium transition-colors hover:bg-foreground/10"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Stat cards */}
      <section
        aria-label="Chiffres clés"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {(cards ?? [0, 1, 2, 3]).map((c, i) => (
          <div key={typeof c === "number" ? i : c.label} className={`${card} p-5`}>
            {typeof c === "number" ? (
              <>
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-8 w-12 animate-pulse rounded bg-muted" />
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
                  {c.value}
                </p>
              </>
            )}
          </div>
        ))}
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Recent products */}
        <section
          aria-label="Derniers produits"
          className={`${card} lg:col-span-2`}
        >
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Derniers produits</h2>
          </div>
          <ul className="divide-y divide-border">
            {stats
              ? stats.recent.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.category}
                      </p>
                    </div>
                    {p.tag && (
                      <span
                        className={
                          p.tag === "Nouveau"
                            ? "rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold"
                            : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                        }
                      >
                        {p.tag}
                      </span>
                    )}
                    <p className="w-28 text-right text-sm font-medium tabular-nums">
                      {formatMAD(p.price)}
                    </p>
                  </li>
                ))
              : [0, 1, 2, 3, 4].map((i) => (
                  <li key={i} className="px-5 py-3.5">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </li>
                ))}
          </ul>
        </section>

        {/* Breakdown by category */}
        <section aria-label="Répartition par catégorie" className={card}>
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Par catégorie</h2>
          </div>
          <ul className="space-y-4 p-5">
            {stats
              ? stats.byType.map((t) => (
                  <li key={t.type}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{t.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {t.count}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${(t.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </li>
                ))
              : [0, 1, 2, 3].map((i) => (
                  <li key={i}>
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </li>
                ))}
          </ul>
        </section>
      </div>
    </div>
  );
}