"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types/auth";

/**
 * The dashboard layout already checked the session on the server.
 * This hands that user to the client, so it does not call /api/auth/me again.
 */
export function AuthHydrator({ user }: { user: User }) {
  const { hydrate } = useAuth();

  useEffect(() => {
    hydrate(user);
  }, [hydrate, user]);

  return null;
}