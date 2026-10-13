export type SizeScaleId = "letters" | "pants" | "jeans" | "shoes" | "unique";

export type SizeScale = {
  id: SizeScaleId;
  /** Name shown in the category form */
  label: string;
  /** Heading above the size buttons */
  title: string;
  /** Small caption on the product page */
  short: string;
  /** Explanation for the customer */
  hint: string;
  sizes: string[];
};

export const sizeScales: Record<SizeScaleId, SizeScale> = {
  letters: {
    id: "letters",
    label: "Lettres (S à XXXL)",
    title: "Taille",
    short: "S à XXXL",
    hint: "T-shirts, hoodies, vestes, tops.",
    sizes: ["S", "M", "L", "XL", "XXL", "XXXL"],
  },
  pants: {
    id: "pants",
    label: "Pantalons (taille EU, 38 à 50)",
    title: "Taille du pantalon",
    short: "Taille EU / FR",
    hint: "Taille européenne (française).",
    sizes: ["38", "40", "42", "44", "46", "48", "50"],
  },
  jeans: {
    id: "jeans",
    label: "Jeans (tour de taille W28 à W40)",
    title: "Tour de taille (W)",
    short: "W, en pouces",
    hint: "Tour de taille en pouces. Repère : taille FR moins 10 (38 = W28).",
    sizes: ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"],
  },
  shoes: {
    id: "shoes",
    label: "Chaussures (pointure EU, 38 à 46)",
    title: "Pointure",
    short: "Pointure EU",
    hint: "Pointure européenne.",
    sizes: ["38", "39", "40", "41", "42", "43", "44", "45", "46"],
  },
  unique: {
    id: "unique",
    label: "Taille unique",
    title: "Taille",
    short: "Taille unique",
    hint: "Casquettes, sacs et accessoires.",
    sizes: ["TU"],
  },
};

export const scaleOrder: SizeScaleId[] = [
  "letters",
  "pants",
  "jeans",
  "shoes",
  "unique",
];

export const defaultScale: SizeScaleId = "letters";

/** Every size value of every scale, without duplicates. */
export const allSizeValues: string[] = [
  ...new Set(scaleOrder.flatMap((id) => sizeScales[id].sizes)),
];

export function isScaleId(v: unknown): v is SizeScaleId {
  return typeof v === "string" && v in sizeScales;
}

/** The scale of a category (letters when the category has none). */
export function scaleOfCategory(
  c?: { sizeScale?: SizeScaleId } | null,
): SizeScale {
  return sizeScales[c?.sizeScale ?? defaultScale];
}

const letterRank = new Map(sizeScales.letters.sizes.map((s, i) => [s, i]));

/** Letters first (S, M, L...), then numbers in numeric order. */
export function sortSizes(list: string[]): string[] {
  return [...list].sort((a, b) => {
    const la = letterRank.get(a);
    const lb = letterRank.get(b);
    if (la !== undefined && lb !== undefined) return la - lb;
    if (la !== undefined) return -1;
    if (lb !== undefined) return 1;
    return a.localeCompare(b, "fr", { numeric: true });
  });
}