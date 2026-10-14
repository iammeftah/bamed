import type { NextRequest } from "next/server";
import { normalizePhone } from "@/lib/auth/phone";
import {
  backendConfigured,
  backendFetch,
  clientIp,
  fail,
  isToken,
  ok,
  parseUser,
  rejectCrossSite,
} from "@/lib/server/backend";
import { setSessionToken } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  if (!backendConfigured) return fail(503, "Backend non configuré.");

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return fail(400, "Requête invalide.");
  }
  const { phone, password } = (input ?? {}) as Record<string, unknown>;
  if (
    typeof phone !== "string" ||
    typeof password !== "string" ||
    phone.length > 20 ||
    password.length === 0 ||
    password.length > 128
  ) {
    return fail(400, "Identifiants invalides.");
  }
  const normalized = normalizePhone(phone);
  if (!normalized) return fail(400, "Numéro de téléphone invalide.");

  const res = await backendFetch("/auth/login", {
    method: "POST",
    json: { phone: normalized, password },
    forwardedFor: clientIp(request),
  });

  if (res.status === 401) return fail(401, "Identifiants incorrects.");
  if (res.status === 403) return fail(403, "Compte désactivé.");
  if (res.status === 422) return fail(400, "Identifiants invalides.");
  if (res.status === 429) {
    return fail(429, "Trop de tentatives. Réessayez dans une minute.", {
      "Retry-After": res.headers.get("retry-after") ?? "60",
    });
  }
  if (!res.ok) return fail(502, "Service indisponible.");

  const data = (await res.json().catch(() => null)) as {
    accessToken?: unknown;
    user?: unknown;
  } | null;
  const user = parseUser(data?.user);
  if (!user || !isToken(data?.accessToken)) {
    return fail(502, "Réponse du serveur invalide.");
  }

  // The token goes into the httpOnly cookie and is never sent to the page
  await setSessionToken(data.accessToken);
  return ok({ user });
}