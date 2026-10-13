"use client";

import { useEffect, useRef, useState } from "react";
import { compact } from "@/lib/dashboard/format";
import type { Candle } from "@/lib/dashboard/stats";
import { cn } from "@/lib/utils";

/** Measures the width of an element, so charts are drawn at real pixel size. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Point = { label: string; value: number };

/* ---------------------------------------------------------------- */
/* Area chart (revenue over time)                                    */
/* ---------------------------------------------------------------- */

export function AreaChart({
  data,
  format,
  height = 240,
}: {
  data: Point[];
  format: (n: number) => string;
  height?: number;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const pad = { t: 12, r: 12, b: 28, l: 44 };
  const iw = Math.max(0, w - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const n = data.length;
  const x = (i: number) =>
    pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const area = n
    ? `${line} L${x(n - 1)},${pad.t + ih} L${x(0)},${pad.t + ih} Z`
    : "";
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 72))));
  const active = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-2 flex h-8 items-baseline gap-2">
        {active ? (
          <>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {format(active.value)}
            </span>
            <span className="text-sm text-muted-foreground">{active.label}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            Survolez le graphique pour le détail
          </span>
        )}
      </div>
      <div ref={ref} className="w-full">
        {w > 0 && n > 0 && (
          <svg
            width={w}
            height={height}
            role="img"
            aria-label="Courbe du chiffre d'affaires"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const px = e.clientX - r.left - pad.l;
              setHover(
                clamp(Math.round((px / Math.max(1, iw)) * (n - 1)), 0, n - 1),
              );
            }}
            onPointerLeave={() => setHover(null)}
            className="touch-pan-y"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line
                  x1={pad.l}
                  x2={w - pad.r}
                  y1={y(max * t)}
                  y2={y(max * t)}
                  className="stroke-border"
                />
                <text
                  x={pad.l - 8}
                  y={y(max * t) + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px]"
                >
                  {compact(max * t)}
                </text>
              </g>
            ))}
            <path d={area} className="fill-primary/10" />
            <path
              d={line}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              className="stroke-primary"
            />
            {data.map((d, i) =>
              i % every === 0 ? (
                <text
                  key={i}
                  x={x(i)}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {d.label}
                </text>
              ) : null,
            )}
            {hover !== null && (
              <g>
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={pad.t}
                  y2={pad.t + ih}
                  className="stroke-input"
                />
                <circle
                  cx={x(hover)}
                  cy={y(data[hover].value)}
                  r={4}
                  className="fill-primary stroke-background"
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Candlestick chart (order totals per week)                         */
/* ---------------------------------------------------------------- */

export function CandleChart({
  data,
  format,
  height = 260,
}: {
  data: Candle[];
  format: (n: number) => string;
  height?: number;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const pad = { t: 12, r: 12, b: 28, l: 44 };
  const iw = Math.max(0, w - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const n = data.length;

  const rawLo = n ? Math.min(...data.map((c) => c.low)) : 0;
  const rawHi = n ? Math.max(...data.map((c) => c.high)) : 1;
  const span = Math.max(1, rawHi - rawLo);
  const lo = Math.max(0, rawLo - span * 0.08);
  const hi = rawHi + span * 0.08;
  const y = (v: number) => pad.t + ih - ((v - lo) / (hi - lo)) * ih;
  const slot = n ? iw / n : 0;
  const cx = (i: number) => pad.l + slot * (i + 0.5);
  const bodyW = clamp(slot * 0.55, 4, 26);
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 56))));
  const active = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-2 flex h-8 flex-wrap items-baseline gap-x-4 text-sm tabular-nums">
        {active ? (
          <>
            <span className="text-muted-foreground">
              Semaine du {active.label}
            </span>
            <span>
              <span className="text-muted-foreground">Ouv. </span>
              {format(active.open)}
            </span>
            <span>
              <span className="text-muted-foreground">Haut </span>
              {format(active.high)}
            </span>
            <span>
              <span className="text-muted-foreground">Bas </span>
              {format(active.low)}
            </span>
            <span>
              <span className="text-muted-foreground">Clôt. </span>
              {format(active.close)}
            </span>
            <span className="text-muted-foreground">
              {active.count} commande{active.count > 1 ? "s" : ""}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">
            Ouverture, plus haut, plus bas et clôture du montant des commandes
          </span>
        )}
      </div>
      <div ref={ref} className="w-full">
        {w > 0 && n > 0 && (
          <svg
            width={w}
            height={height}
            role="img"
            aria-label="Graphique en chandeliers du montant des commandes par semaine"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const px = e.clientX - r.left - pad.l;
              setHover(clamp(Math.floor(px / Math.max(1, slot)), 0, n - 1));
            }}
            onPointerLeave={() => setHover(null)}
            className="touch-pan-y"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const v = lo + (hi - lo) * t;
              return (
                <g key={t}>
                  <line
                    x1={pad.l}
                    x2={w - pad.r}
                    y1={y(v)}
                    y2={y(v)}
                    className="stroke-border"
                  />
                  <text
                    x={pad.l - 8}
                    y={y(v) + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {compact(v)}
                  </text>
                </g>
              );
            })}
            {data.map((c, i) => {
              const up = c.close >= c.open;
              const top = y(Math.max(c.open, c.close));
              const bottom = y(Math.min(c.open, c.close));
              const tone = up ? "success" : "destructive";
              return (
                <g
                  key={c.label + i}
                  opacity={hover === null || hover === i ? 1 : 0.5}
                >
                  <line
                    x1={cx(i)}
                    x2={cx(i)}
                    y1={y(c.high)}
                    y2={y(c.low)}
                    strokeWidth={1.5}
                    className={up ? "stroke-success" : "stroke-destructive"}
                  />
                  <rect
                    x={cx(i) - bodyW / 2}
                    y={top}
                    width={bodyW}
                    height={Math.max(2, bottom - top)}
                    rx={2}
                    className={cn(
                      tone === "success" ? "fill-success" : "fill-destructive",
                    )}
                  />
                  {i % every === 0 && (
                    <text
                      x={cx(i)}
                      y={height - 8}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[11px]"
                    >
                      {c.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Donut chart (share by category)                                   */
/* ---------------------------------------------------------------- */

// One hue (gold) in several steps, matching the BAMED accent
const PALETTE = ["#c9a24b", "#e0c070", "#a8832f", "#ecd596", "#7d6222", "#f3e6c2"];

export function DonutChart({
  data,
  format,
}: {
  data: Point[];
  format: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const top = data.slice(0, PALETTE.length - 1);
  const rest = data.slice(PALETTE.length - 1);
  const items = rest.length
    ? [...top, { label: "Autres", value: rest.reduce((s, r) => s + r.value, 0) }]
    : top;
  const total = items.reduce((s, d) => s + d.value, 0);

  const r = 70;
  const C = 2 * Math.PI * r;
  let offset = 0;

  if (total === 0)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucune vente sur la période.
      </p>
    );

  const active = hover !== null ? items[hover] : null;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative size-44 shrink-0">
        <svg
          viewBox="0 0 180 180"
          className="size-full"
          role="img"
          aria-label="Répartition du chiffre d'affaires par catégorie"
        >
          <circle
            cx={90}
            cy={90}
            r={r}
            fill="none"
            strokeWidth={22}
            className="stroke-accent"
          />
          {items.map((d, i) => {
            const len = Math.max(0, (d.value / total) * C - 2);
            const el = (
              <circle
                key={d.label}
                cx={90}
                cy={90}
                r={r}
                fill="none"
                strokeWidth={22}
                stroke={PALETTE[i % PALETTE.length]}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 90 90)"
                opacity={hover === null || hover === i ? 1 : 0.35}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              />
            );
            offset += (d.value / total) * C;
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">
            {active ? active.label : "Total"}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {compact(active ? active.value : total)}
          </span>
          {active && (
            <span className="text-xs text-muted-foreground">
              {Math.round((active.value / total) * 100)}%
            </span>
          )}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {items.map((d, i) => (
          <li
            key={d.label}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            className="flex items-center gap-3 text-sm"
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            />
            <span className="min-w-0 flex-1 truncate">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {format(d.value)}
            </span>
            <span className="w-10 text-right tabular-nums text-muted-foreground">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Horizontal bar list (sellers, top products)                       */
/* ---------------------------------------------------------------- */

export function BarList({
  items,
  format,
}: {
  items: { label: string; value: number; sub?: string }[];
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0)
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aucune donnée.
      </p>
    );
  return (
    <ul className="space-y-4">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{it.label}</span>
            <span className="shrink-0 tabular-nums">{format(it.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
          {it.sub && (
            <p className="mt-1 text-xs text-muted-foreground">{it.sub}</p>
          )}
        </li>
      ))}
    </ul>
  );
}