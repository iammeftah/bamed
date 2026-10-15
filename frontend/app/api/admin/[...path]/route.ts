/**
 * Authenticated proxy: the browser calls /api/admin/products, this adds the
 * Bearer token from the httpOnly cookie and forwards to Laravel /admin/products.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  backendFetch,
  fail,
  noContent,
  rejectCrossSite,
} from "@/lib/server/backend";
import { clearSessionToken, getSessionToken } from "@/lib/server/session";

const ROOTS = new Set([
  "overview",
  "categories",
  "products",
  "admins",
  "sales",
  "logs",
  "uploads",
]);
const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_BODY = 12 * 1024 * 1024; // photos are 10 MB max

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  if (
    path.length === 0 ||
    path.length > 4 ||
    !path.every((s) => SEGMENT.test(s)) ||
    !ROOTS.has(path[0])
  ) {
    return fail(404, "Introuvable.");
  }

  const mutating = request.method !== "GET";
  if (mutating) {
    const blocked = rejectCrossSite(request);
    if (blocked) return blocked;
  }

  const token = await getSessionToken();
  if (!token) return fail(401, "Non connecté.");

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return fail(413, "Fichier trop volumineux.");
  }
  let body: ArrayBuffer | undefined;
  if (mutating) {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > MAX_BODY) return fail(413, "Fichier trop volumineux.");
    if (buf.byteLength > 0) body = buf;
  }

  const res = await backendFetch(
    `/admin/${path.join("/")}${request.nextUrl.search}`,
    {
      method: request.method,
      token,
      body,
      contentType: request.headers.get("content-type") ?? undefined,
    },
  );

  if (res.status === 401) {
    await clearSessionToken();
    return fail(401, "Session expirée.");
  }
  // Never pass Laravel 5xx pages (stack traces) or redirects to the browser
  if (res.status >= 500 || (res.status >= 300 && res.status < 400)) {
    return fail(502, "Service indisponible.");
  }
  if (res.status === 204) return noContent();

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;