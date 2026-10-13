// frontend/components/auth/auth-provider.tsx
"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/auth.service";
import { getTokens } from "@/lib/auth/storage";
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
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    const expire = () => {
      setUser(null);
      setStatus("anonymous");
    };

    async function restore() {
      // Customers have no token: nothing to check, no network call
      if (!getTokens().accessToken) return expire();
      try {
        const me = await authService.me();
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) expire();
      }
    }

    restore();
    // Fired by the API client when a refresh fails
    window.addEventListener("bamed:auth-expired", expire);
    return () => {
      cancelled = true;
      window.removeEventListener("bamed:auth-expired", expire);
    };
  }, []);

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