"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function HideOnDashboard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <>{children}</>;
}