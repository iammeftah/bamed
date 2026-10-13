import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardProvider } from "@/lib/dashboard/store";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = {
  title: "Tableau de bord | BAMED",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="backoffice min-h-svh bg-background text-foreground">
      <RequireAuth roles={["admin"]}>
        <DashboardProvider>
          <DashboardShell>{children}</DashboardShell>
        </DashboardProvider>
      </RequireAuth>
    </div>
  );
}