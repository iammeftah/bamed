import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Administration | BAMED",
    template: "%s | BAMED Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="backoffice min-h-svh bg-background text-foreground">
      {children}
    </div>
  );
}