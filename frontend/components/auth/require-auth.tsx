"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ADMIN_LOGIN } from "@/lib/auth/redirect";
import type { Role } from "@/types/auth";

/**
 * Client-side gate for the back office. It only improves the experience:
 * real protection must be enforced by the backend on every request.
 */
export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[];
  children: ReactNode;
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`${ADMIN_LOGIN}?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div
        role="status"
        className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground"
      >
        Chargement...
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-5 text-center">
        <p className="text-2xl font-semibold tracking-[-0.6px]">
          Accès refusé
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Votre compte n&apos;a pas les droits pour voir cette page.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#828fff]"
        >
          Retour au site
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}