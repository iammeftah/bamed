import type { Product, ProductColor } from "@/lib/products";

/**
 * Smart outfit suggestor. No backend needed: everything is computed from the
 * products the shop already loads (category, colours and their hex values).
 */

export type Slot = "top" | "outer" | "bottom" | "shoes" | "accessory";

export const slotOrder: Slot[] = ["top", "outer", "bottom", "shoes", "accessory"];

export const slotLabels: Record<Slot, string> = {
  top: "Haut",
  outer: "Veste",
  bottom: "Bas",
  shoes: "Chaussures",
  accessory: "Accessoire",
};

export type Pick = {
  product: Product;
  color: ProductColor;
  /** 100 = exactly the chosen colour, otherwise colour compatibility (0 to 85) */
  score: number;
  exact: boolean;
};

export type Outfit = {
  id: string;
  /** Index of the chosen Pick inside pools[slot], for every slot of the outfit */
  selection: Partial<Record<Slot, number>>;
};

export type OutfitResult = {
  pools: Partial<Record<Slot, Pick[]>>;
  outfits: Outfit[];
};

/* ---------- Category -> slot ---------- */

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

// Order matters: the first rule that matches wins.
const rules: [Slot, RegExp][] = [
  ["shoes", /sneaker|basket|chaussure|botte|sandale|mocassin/],
  ["bottom", /jean|pantalon|chino|jogging|short|cargo/],
  ["outer", /veste|manteau|blouson|parka|doudoune/],
  ["accessory", /accessoire|\b(casquette|sac|ceinture|bonnet|echarpe)/],
  ["top", /hoodie|sweat|t-?shirt|tee|chemise|polo|maille|pull|haut/],
];

export function slotOf(product: Product): Slot | null {
  const key = normalize(`${product.type} ${product.category}`);
  for (const [slot, re] of rules) if (re.test(key)) return slot;
  return null;
}

/* ---------- Colour maths ---------- */

type HSL = { h: number; s: number; l: number };

function toHsl(hex: string): HSL {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { h: 0, s: 0, l: 0.5 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

/** Black, white, grey and the warm beiges/sands behave like neutrals. */
function isNeutral({ h, s, l }: HSL) {
  if (s < 0.18 || l < 0.1 || l > 0.92) return true;
  return h >= 20 && h <= 55 && s < 0.45 && l > 0.5;
}

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** How well two colours go together, from 0 to 85. */
export function compatibility(hexA: string, hexB: string): number {
  const a = toHsl(hexA);
  const b = toHsl(hexB);
  const na = isNeutral(a);
  const nb = isNeutral(b);
  if (na && nb) return 85;
  if (na || nb) return 80;
  const gap = hueGap(a.h, b.h);
  if (gap <= 30) return 75; // same family
  if (gap >= 150) return 55; // complementary
  return 25; // clash
}

const MIN_SCORE = 50;

/* ---------- Outfit generation ---------- */

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The best colour of a product for the chosen colour (the exact one if it exists). */
function bestPick(product: Product, chosen: ProductColor): Pick | null {
  if (product.colors.length === 0) return null;

  const exact = product.colors.find((c) => sameName(c.name, chosen.name));
  if (exact) return { product, color: exact, score: 100, exact: true };

  let best: Pick | null = null;
  for (const c of product.colors) {
    const score = compatibility(chosen.hex, c.hex);
    if (!best || score > best.score) best = { product, color: c, score, exact: false };
  }
  return best && best.score >= MIN_SCORE ? best : null;
}

/**
 * Builds up to `max` outfits that contain the chosen colour.
 * pools = candidate pieces per slot (best first), used for the swap buttons.
 */
export function buildOutfits(
  products: Product[],
  chosen: ProductColor,
  max = 3,
): OutfitResult {
  const pools: Partial<Record<Slot, Pick[]>> = {};

  for (const slot of slotOrder) {
    const list: Pick[] = [];
    for (const p of products) {
      if (slotOf(p) !== slot) continue;
      const pick = bestPick(p, chosen);
      if (pick) list.push(pick);
    }
    list.sort((x, y) => y.score - x.score || y.product.addedAt - x.product.addedAt);
    if (list.length) pools[slot] = list;
  }

  // The "anchor" is the slot that has the most pieces in the chosen colour
  let anchor: Slot | null = null;
  let anchorCount = 0;
  for (const slot of slotOrder) {
    const count = pools[slot]?.filter((p) => p.exact).length ?? 0;
    if (count > anchorCount) {
      anchor = slot;
      anchorCount = count;
    }
  }
  if (!anchor) return { pools, outfits: [] };

  const longest = Math.max(...slotOrder.map((s) => pools[s]?.length ?? 0));
  const count = Math.max(1, Math.min(max, longest));
  const outfits: Outfit[] = [];

  for (let n = 0; n < count; n++) {
    const selection: Partial<Record<Slot, number>> = {};
    for (const slot of slotOrder) {
      const pool = pools[slot];
      if (!pool) continue;

      if (slot === anchor) {
        selection[slot] = n % anchorCount; // exact pieces come first in the pool
        continue;
      }
      // A jacket joins the 2nd look, an accessory the 3rd: it keeps looks different
      if (slot === "outer" && n !== 1) continue;
      if (slot === "accessory" && n !== 2) continue;
      selection[slot] = n % pool.length;
    }
    if (Object.keys(selection).length >= 2) {
      outfits.push({ id: `look-${n}`, selection });
    }
  }

  return { pools, outfits };
}