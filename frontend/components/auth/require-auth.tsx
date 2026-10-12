"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/types/auth";

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
      router.replace(`/connexion?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-5 text-center">
        <p className="font-display text-5xl font-bold uppercase leading-none">
          Accès refusé
        </p>
        <p className="max-w-sm text-muted-foreground">
          Votre compte n&apos;a pas les droits pour voir cette page.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md bg-foreground px-5 text-sm font-semibold text-background"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}