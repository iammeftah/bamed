// frontend/services/dashboard.service.ts
/**
 * Dashboard endpoint expected from the backend:
 *   GET /admin/dashboard  (admin only)
 *     -> {
 *          totalProducts, onSale, newArrivals, categories,
 *          byType: [{ type, label, count }],
 *          recent: Product[]
 *        }
 * Product fields match the Product type in lib/products.ts.
 * If your backend differs, adapt getStats below, nothing else.
 */
import { apiFetch } from "@/lib/api/client";
import { mocksEnabled } from "@/lib/config";
import { productTypes, products as sample } from "@/lib/products";
import type { DashboardStats } from "@/types/dashboard";

async function getStats(): Promise<DashboardStats> {
  if (mocksEnabled) return sampleStats();
  return apiFetch<DashboardStats>("/admin/dashboard", { auth: true });
}

export const dashboardService = { getStats };

/* ---------- Sample data mode (no backend configured) ---------- */

async function sampleStats(): Promise<DashboardStats> {
  // Small delay so the loading state is visible while developing
  await new Promise((resolve) => setTimeout(resolve, 300));

  const byType = productTypes
    .map((t) => ({
      type: t.id,
      label: t.label,
      count: sample.filter((p) => p.type === t.id).length,
    }))
    .filter((t) => t.count > 0);

  return {
    totalProducts: sample.length,
    onSale: sample.filter((p) => p.oldPrice).length,
    newArrivals: sample.filter((p) => p.tag === "Nouveau").length,
    categories: byType.length,
    byType,
    recent: [...sample].sort((a, b) => b.addedAt - a.addedAt).slice(0, 5),
  };
}