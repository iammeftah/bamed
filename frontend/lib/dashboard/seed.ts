import { products as storefront, sampleCategories } from "@/lib/products";
import { DAY, addDays, startOfDay } from "@/lib/dashboard/stats";
import type {
  AdminUser,
  Category,
  DashboardData,
  LogEntry,
  Sale,
  StockProduct,
} from "@/types/dashboard";

/** Small deterministic random generator, so the demo data is stable. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const descriptions: Record<string, string> = {
  hoodies: "Hoodies et sweats à capuche, coupes oversize et classiques.",
  "t-shirts": "Basiques et graphiques en coton, du quotidien.",
  jeans: "Coupes droites, baggy et ajustées, tailles W28 à W40.",
  pantalons: "Cargos, joggings et pantalons fluides.",
  vestes: "Vestes, coupe-vents et surchemises de saison.",
  sneakers: "Sneakers et baskets, pointures 38 à 46.",
  chemises: "Oxford, lin, coupes classiques et décontractées.",
  polos: "Piqué et maille légère.",
  maille: "Pulls et mailles fines.",
  accessoires: "Casquettes, sacs et accessoires en taille unique.",
};

const stockByIndex = [34, 8, 64, 27, 3, 15, 0, 21];

export function seedData(now: number): DashboardData {
  const r = rng(20260929);

  const categories: Category[] = sampleCategories.map((c, i) => ({
    id: c.id,
    name: c.label,
    slug: c.id,
    description: descriptions[c.id] ?? "",
    sizeScale: c.sizeScale,
    createdAt: now - (150 - i) * DAY,
  }));

  const products: StockProduct[] = storefront.map((p, i) => ({
    id: p.id,
    sku: `BAM-${1001 + i}`,
    name: p.name,
    categoryId: p.type,
    colors: p.colors,
    price: p.price,
    oldPrice: p.oldPrice,
    cost: Math.round(p.price * 0.52),
    stock: stockByIndex[i % stockByIndex.length],
    lowStockAt: 10,
    sizes: p.sizes,
    active: true,
    createdAt: now - (100 - i * 6) * DAY,
  }));

  // dev-admin matches the demo login (0600000000 / admin123)
  const admins: AdminUser[] = [
    {
      id: "dev-admin",
      name: "Admin BAMED",
      phone: "+212600000000",
      active: true,
      createdAt: now - 160 * DAY,
    },
    {
      id: "adm-2",
      name: "Yassine El Amrani",
      phone: "+212611223344",
      active: true,
      createdAt: now - 120 * DAY,
    },
    {
      id: "adm-3",
      name: "Salma Bennani",
      phone: "+212655667788",
      active: true,
      createdAt: now - 90 * DAY,
    },
    {
      id: "adm-4",
      name: "Omar Tazi",
      phone: "+212677889900",
      active: false,
      createdAt: now - 70 * DAY,
    },
  ];

  const sellers = admins.filter((a) => a.active);
  const sales: Sale[] = [];
  for (let d = 89; d >= 0; d--) {
    const day = addDays(startOfDay(now), -d);
    const dow = new Date(day).getDay();
    const base = dow === 5 || dow === 6 ? 4 : 2;
    const n = base + Math.floor(r() * 4) + (d < 30 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const p = products[Math.floor(r() * r() * products.length)];
      const qty = 1 + Math.floor(r() * r() * 3);
      const at = day + (9 * 60 + Math.floor(r() * 11 * 60)) * 60_000;
      if (at > now) continue;
      const seller = sellers[Math.floor(r() * sellers.length)];
      sales.push({
        id: `s-${d}-${i}`,
        at,
        productId: p.id,
        productName: p.name,
        categoryId: p.categoryId,
        qty,
        unitPrice: p.price,
        unitCost: p.cost,
        total: p.price * qty,
        soldById: seller.id,
        soldByName: seller.name,
      });
    }
  }
  sales.sort((a, b) => b.at - a.at);

  const logs: LogEntry[] = [
    {
      id: "l-1",
      at: now - 20 * DAY,
      actorId: "dev-admin",
      actorName: "Admin BAMED",
      action: "create",
      entity: "admin",
      entityId: "adm-3",
      summary: "Administrateur « Salma Bennani » créé",
    },
    {
      id: "l-2",
      at: now - 12 * DAY,
      actorId: "adm-2",
      actorName: "Yassine El Amrani",
      action: "stock",
      entity: "product",
      entityId: products[0].id,
      summary: `Stock « ${products[0].name} » : +20 (réassort)`,
    },
    {
      id: "l-3",
      at: now - 6 * DAY,
      actorId: "dev-admin",
      actorName: "Admin BAMED",
      action: "update",
      entity: "product",
      entityId: products[4].id,
      summary: `Produit « ${products[4].name} » modifié`,
    },
  ];

  return { categories, products, admins, sales, logs };
}