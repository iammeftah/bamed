import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { ADMIN_LOGIN } from "@/lib/auth/redirect";
import { mocksEnabled } from "@/lib/config";
import { DashboardProvider } from "@/lib/dashboard/store";
import { getCurrentUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Server-side check against the backend, before any dashboard code is sent.
  // Demo mode has no server session, so it is skipped there.
  if (!mocksEnabled) {
    const user = await getCurrentUser();
    if (!user) redirect(ADMIN_LOGIN);
  }

  return (
    <RequireAuth roles={["admin"]}>
      <DashboardProvider>
        <DashboardShell>{children}</DashboardShell>
      </DashboardProvider>
    </RequireAuth>
  );
}