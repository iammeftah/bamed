"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { authService } from "@/services/auth.service";
import type { LoginInput, User } from "@/types/auth";

type Status = "loading" | "authenticated" | "anonymous";

export type AuthContextValue = {
  user: User | null;
  status: Status;
  login: (input: LoginInput) => Promise<User>;
  logout: () => Promise<void>;
  /** Called by the dashboard with the user the server already verified */
  hydrate: (user: User) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const inAdmin = pathname.startsWith("/admin");
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  // True once the server handed us a verified user: no need to ask again
  const hydrated = useRef(false);

  const expire = useCallback(() => {
    hydrated.current = false;
    setUser(null);
    setStatus("anonymous");
  }, []);

  const hydrate = useCallback((u: User) => {
    hydrated.current = true;
    setUser(u);
    setStatus("authenticated");
  }, []);

  // Old versions kept the token in localStorage: wipe it
  useEffect(() => {
    try {
      window.localStorage.removeItem("bamed.auth");
    } catch {
      /* ignore */
    }
  }, []);

  // Fired by the API client when an admin call comes back 401
  useEffect(() => {
    window.addEventListener("bamed:auth-expired", expire);
    return () => window.removeEventListener("bamed:auth-expired", expire);
  }, [expire]);

  // The cookie is httpOnly, so the page can't peek at it: ask the server, but only
  // in the back office (and only when the dashboard did not already hand us the user).
  // Shop visitors never trigger a session call.
  useEffect(() => {
    if (!inAdmin || status !== "loading" || hydrated.current) return;
    let cancelled = false;
    authService
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) expire();
      });
    return () => {
      cancelled = true;
    };
  }, [inAdmin, status, expire]);

  const login = useCallback(async (input: LoginInput) => {
    const u = await authService.login(input);
    setUser(u);
    setStatus("authenticated");
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    hydrated.current = false;
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, hydrate }),
    [user, status, login, logout, hydrate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}