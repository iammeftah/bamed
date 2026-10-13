import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { DashboardProvider } from "@/lib/dashboard/store";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={["admin"]}>
      <DashboardProvider>
        <DashboardShell>{children}</DashboardShell>
      </DashboardProvider>
    </RequireAuth>
  );
}