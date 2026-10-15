/**
 * Developer dashboard API (super admin only). Browser only:
 * calls go through /api/admin/system/*, Laravel refuses everybody else with 403.
 */
import { apiFetch } from "@/lib/api/client";
import type { SystemOverview } from "@/types/system";

const call = { auth: true } as const;

export const systemService = {
  overview(hours: number): Promise<SystemOverview> {
    return apiFetch<SystemOverview>("/system/overview", {
      ...call,
      query: { hours },
    });
  },

  pruneImages(): Promise<{ deleted: number }> {
    return apiFetch<{ deleted: number }>("/system/prune-images", {
      ...call,
      method: "POST",
      body: {},
    });
  },

  async clearErrors(): Promise<void> {
    await apiFetch("/system/errors", { ...call, method: "DELETE" });
  },
};