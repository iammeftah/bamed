/**
 * Server-side helpers: only import this from route handlers, layouts and proxy code.
 * The browser never talks to Laravel for anything private.
 */
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@/types/auth";

/**
 * "localhost" can resolve to ::1 first, while `php artisan serve` only listens on
 * IPv4. That costs a failed attempt on every call, so it is pinned to 127.0.0.1.
 */
const BASE = (
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
)
  .replace(/\/+$/, "")
  .replace(/^(https?:\/\/)localhost(?=[:/]|$)/i, "$1127.0.0.1");

export const backendConfigured = BASE !== "";

const NO_STORE = { "Cache-Control": "no-store" };

/** Sanctum plain-text tokens look like "12|AbC...". Anything else is rejected. */
export const isToken = (v: unknown): v is string =>
  typeof v === "string" && /^\d+\|[A-Za-z0-9]{20,100}$/.test(v);

export function fail(
  status: number,
  message: string,
  extra?: Record<string, string>,
) {
  return NextResponse.json(
    { message },
    { status, headers: { ...NO_STORE, ...extra } },
  );
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function noContent() {
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}

/**
 * CSRF guard for POST/PUT/DELETE. Browsers always send Origin on those, so a
 * missing or foreign Origin is refused. Works together with SameSite=Strict.
 */
export function rejectCrossSite(request: NextRequest): NextResponse | null {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return fail(403, "Requête refusée.");

  const origin = request.headers.get("origin");
  if (!origin) return fail(403, "Requête refusée.");
  try {
    if (new URL(origin).host !== request.headers.get("host"))
      return fail(403, "Requête refusée.");
  } catch {
    return fail(403, "Requête refusée.");
  }
  return null;
}

/** Client IP as seen by the platform, so Laravel's login throttle is per visitor. */
export function clientIp(request: NextRequest): string | undefined {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip && /^[0-9a-fA-F:.]{3,45}$/.test(ip) ? ip : undefined;
}

type Opts = {
  method?: string;
  token?: string | null;
  json?: unknown;
  body?: ArrayBuffer;
  contentType?: string;
  forwardedFor?: string;
};

/** Calls Laravel. Never throws: an unreachable backend becomes a 502. */
export async function backendFetch(
  path: string,
  o: Opts = {},
): Promise<Response> {
  if (!BASE) return new Response(null, { status: 503 });

  const headers = new Headers({ Accept: "application/json" });
  if (o.token) headers.set("Authorization", `Bearer ${o.token}`);
  if (o.forwardedFor) headers.set("X-Forwarded-For", o.forwardedFor);

  let body: BodyInit | undefined;
  if (o.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(o.json);
  } else if (o.body) {
    body = o.body;
    if (o.contentType) headers.set("Content-Type", o.contentType);
  }

  try {
    return await fetch(`${BASE}${path}`, {
      method: o.method ?? "GET",
      headers,
      body,
      cache: "no-store",
      // Never follow redirects: they could carry the Authorization header elsewhere
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

/** Accepts only a real staff user (admin or super admin), and returns only the fields the UI needs. */
export function parseUser(raw: unknown): User | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const role = r.role;
  if (role !== "admin" && role !== "super_admin") return null;
  if (typeof r.name !== "string" || typeof r.phone !== "string") return null;
  if (typeof r.id !== "string" && typeof r.id !== "number") return null;
  return { id: String(r.id), name: r.name, phone: r.phone, role };
}