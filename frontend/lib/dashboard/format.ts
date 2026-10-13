const compactFmt = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const dayFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});
const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

export const compact = (n: number) => compactFmt.format(n);
export const fmtDay = (t: number) => dayFmt.format(t);
export const fmtDate = (t: number) => dateFmt.format(t);
export const fmtDateTime = (t: number) =>
  `${dateFmt.format(t)}, ${timeFmt.format(t)}`;

export function fmtPct(n: number) {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}