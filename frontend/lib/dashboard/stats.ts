import { fmtDay } from "@/lib/dashboard/format";
import type { Category, Sale } from "@/types/dashboard";

export const DAY = 86_400_000;

export function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Calendar-based (safe across daylight saving changes). */
export function addDays(t: number, n: number) {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

export function weekStart(t: number) {
  const d = new Date(startOfDay(t));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d.getTime();
}

export function summarize(sales: Sale[]) {
  let revenue = 0;
  let profit = 0;
  let units = 0;
  for (const s of sales) {
    revenue += s.total;
    profit += s.total - s.unitCost * s.qty;
    units += s.qty;
  }
  const orders = sales.length;
  return { revenue, profit, units, orders, avg: orders ? revenue / orders : 0 };
}

/** Percent change, or null when there is nothing to compare with. */
export function change(current: number, previous: number) {
  return previous === 0 ? null : ((current - previous) / previous) * 100;
}

export function dailySeries(sales: Sale[], days: number, now: number) {
  const start = addDays(startOfDay(now), -(days - 1));
  const buckets = Array.from({ length: days }, (_, i) => ({
    t: addDays(start, i),
    value: 0,
  }));
  for (const s of sales) {
    const i = Math.round((startOfDay(s.at) - start) / DAY);
    if (i >= 0 && i < days) buckets[i].value += s.total;
  }
  return buckets.map((b) => ({ label: fmtDay(b.t), value: b.value }));
}

export function revenueByCategory(sales: Sale[], categories: Category[]) {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const totals = new Map<string, number>();
  for (const s of sales) {
    const label = names.get(s.categoryId) ?? "Autre";
    totals.set(label, (totals.get(label) ?? 0) + s.total);
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function bySeller(sales: Sale[]) {
  const map = new Map<string, { label: string; value: number; count: number }>();
  for (const s of sales) {
    const row = map.get(s.soldById) ?? {
      label: s.soldByName,
      value: 0,
      count: 0,
    };
    row.value += s.total;
    row.count += 1;
    map.set(s.soldById, row);
  }
  return [...map.values()]
    .sort((a, b) => b.value - a.value)
    .map((r) => ({
      label: r.label,
      value: r.value,
      sub: `${r.count} vente${r.count > 1 ? "s" : ""}`,
    }));
}

export function topProducts(sales: Sale[], n = 5) {
  const map = new Map<string, { label: string; value: number; units: number }>();
  for (const s of sales) {
    const row = map.get(s.productId) ?? {
      label: s.productName,
      value: 0,
      units: 0,
    };
    row.value += s.total;
    row.units += s.qty;
    map.set(s.productId, row);
  }
  return [...map.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
    .map((r) => ({
      label: r.label,
      value: r.value,
      sub: `${r.units} pièce${r.units > 1 ? "s" : ""}`,
    }));
}

export type Candle = {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  count: number;
};

/**
 * One candle per week, built from order totals:
 * open = first order of the week, close = last, high/low = biggest/smallest.
 */
export function weeklyCandles(sales: Sale[], weeks: number): Candle[] {
  const sorted = [...sales].sort((a, b) => a.at - b.at);
  const groups = new Map<number, Sale[]>();
  for (const s of sorted) {
    const k = weekStart(s.at);
    const g = groups.get(k);
    if (g) g.push(s);
    else groups.set(k, [s]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-weeks)
    .map(([start, list]) => {
      const totals = list.map((s) => s.total);
      return {
        label: fmtDay(start),
        open: totals[0],
        close: totals[totals.length - 1],
        high: Math.max(...totals),
        low: Math.min(...totals),
        count: list.length,
      };
    });
}