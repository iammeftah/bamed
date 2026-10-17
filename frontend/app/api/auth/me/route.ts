import { backendFetch, fail, ok, parseUser } from "@/lib/server/backend";
import { clearSessionToken, getSessionToken } from "@/lib/server/session";

export async function GET() {
  const token = await getSessionToken();
  if (!token) return fail(401, "Non connecté.");

  const res = await backendFetch("/auth/me", { token });

  if (res.status === 401 || res.status === 403) {
    await clearSessionToken();
    return fail(401, "Session expirée.");
  }
  if (!res.ok) return fail(502, "Service indisponible.");

  const user = parseUser(await res.json().catch(() => null));
  if (!user) {
    await clearSessionToken();
    return fail(401, "Non connecté.");
  }
  return ok(user);
}