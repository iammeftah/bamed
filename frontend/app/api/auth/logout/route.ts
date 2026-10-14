import type { NextRequest } from "next/server";
import {
  backendFetch,
  noContent,
  rejectCrossSite,
} from "@/lib/server/backend";
import { clearSessionToken, getSessionToken } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const token = await getSessionToken();
  // Revoke the token on the backend, so a copied cookie is dead too
  if (token) await backendFetch("/auth/logout", { method: "POST", token });

  await clearSessionToken();
  return noContent();
}