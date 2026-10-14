import { cache } from "react";
import { cookies } from "next/headers";
import { IS_PROD, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/constants";
import { backendFetch, isToken, parseUser } from "@/lib/server/backend";
import type { User } from "@/types/auth";

const base = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "strict" as const,
  path: "/",
};

export async function getSessionToken(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return isToken(value) ? value : null;
}

export async function setSessionToken(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    ...base,
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionToken() {
  // Re-set with the same attributes: a "__Host-" cookie can't be removed otherwise
  (await cookies()).set(SESSION_COOKIE, "", { ...base, maxAge: 0 });
}

/** The admin behind the cookie, checked against the backend. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  const res = await backendFetch("/auth/me", { token });
  if (!res.ok) return null;
  return parseUser(await res.json().catch(() => null));
});