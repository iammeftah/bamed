"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  BarList,
  CandleChart,
  DonutChart,
} from "@/components/dashboard/charts";
import {
  Badge,
  Card,
  CardHeader,
  PageHeader,
  PageSkeleton,
  Segmented,
  StatCard,
} from "@/components/dashboard/ui";
import { fmtDateTime } from "@/lib/dashboard/format";
import {
  addDays,
  bySeller,
  change,
  dailySeries,
  revenueByCategory,
  startOfDay,
  summarize,
  topProducts,
  weeklyCandles,
} from "@/lib/dashboard/stats";
import { mocksEnabled } from "@/lib/config";
import { useDashboard } from "@/lib/dashboard/store";
import { formatMAD } from "@/lib/products";

type Range = 7 | 30 | 90;
const ranges: { id: Range; label: string }[] = [
  { id: 7, label: "7 jours" },
  { id: 30, label: "30 jours" },
  { id: 90, label: "90 jours" },
];

export default function OverviewPage() {
  const d = useDashboard();
  const [days, setDays] = useState<Range>(30);

  const { current, previous, series, byCategory, sellers, top, candles } =
    useMemo(() => {
      const from = addDays(startOfDay(d.now), -(days - 1));
      const prevFrom = addDays(from, -days);
      const cur = d.sales.filter((s) => s.at >= from);
      const prev = d.sales.filter((s) => s.at >= prevFrom && s.at < from);
      return {
        current: summarize(cur),
        previous: summarize(prev),
        series: dailySeries(cur, days, d.now),
        byCategory: revenueByCategory(cur, d.categories),
        sellers: bySeller(cur),
        top: topProducts(cur, 5),
        candles: weeklyCandles(d.sales, 14),
      };
    }, [d.sales, d.categories, d.now, days]);

  if (!d.ready) return <PageSkeleton />;

  const lowStock = d.products
    .filter((p) => p.active && p.stock <= p.lowStockAt)
    .sort((a, b) => a.stock - b.stock);

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="L'activité de la boutique en un coup d'œil."
        actions={
          <>
            <Segmented
              label="Période"
              value={days}
              options={ranges}
              onChange={setDays}
            />
            {mocksEnabled && (
              <Button variant="ghost" size="lg" onClick={d.resetDemo}>
                Réinitialiser la démo
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          value={formatMAD(current.revenue)}
          delta={change(current.revenue, previous.revenue)}
          hint="vs période précédente"
        />
        <StatCard
          label="Bénéfice estimé"
          value={formatMAD(current.profit)}
          delta={change(current.profit, previous.profit)}
          hint="vs période précédente"
        />
        <StatCard
          label="Commandes"
          value={String(current.orders)}
          delta={change(current.orders, previous.orders)}
          hint={`${current.units} pièces`}
        />
        <StatCard
          label="Panier moyen"
          value={formatMAD(current.avg)}
          delta={change(current.avg, previous.avg)}
          hint="vs période précédente"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Chiffre d'affaires"
            description={`Par jour, sur les ${days} derniers jours`}
          />
          <AreaChart data={series} format={formatMAD} />
        </Card>
        <Card>
          <CardHeader
            title="Par catégorie"
            description="Part du chiffre d'affaires"
          />
          <DonutChart data={byCategory} format={formatMAD} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Montant des commandes, par semaine"
            description="Graphique en chandeliers : vert si la dernière commande de la semaine dépasse la première"
          />
          <CandleChart data={candles} format={formatMAD} />
        </Card>
        <Card>
          <CardHeader
            title="Ventes par vendeur"
            description="Sur la période sélectionnée"
            action={
              <Link
                href="/admin/dashboard/sales"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Détail
              </Link>
            }
          />
          <BarList items={sellers} format={formatMAD} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Meilleurs produits" />
          <BarList items={top} format={formatMAD} />
        </Card>

        <Card>
          <CardHeader
            title="Alertes de stock"
            action={
              <Link
                href="/admin/dashboard/products"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Gérer
              </Link>
            }
          />
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Tout est bien approvisionné.
            </p>
          ) : (
            <ul className="space-y-3">
              {lowStock.slice(0, 6).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate">{p.name}</span>
                  {p.stock === 0 ? (
                    <Badge tone="danger">Rupture</Badge>
                  ) : (
                    <Badge tone="warning">{p.stock} restant</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Activité récente"
            action={
              <Link
                href="/admin/dashboard/logs"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Tout voir
              </Link>
            }
          />
          <ul className="space-y-3">
            {d.logs.slice(0, 5).map((l) => (
              <li key={l.id} className="text-sm">
                <p className="leading-snug">{l.summary}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {l.actorName} · {fmtDateTime(l.at)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}