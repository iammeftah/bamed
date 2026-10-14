"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
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
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const inAdmin = pathname.startsWith("/admin");
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const expire = useCallback(() => {
    setUser(null);
    setStatus("anonymous");
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
  // in the back office. Shop visitors never trigger a session call.
  useEffect(() => {
    if (!inAdmin || status !== "loading") return;
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
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}