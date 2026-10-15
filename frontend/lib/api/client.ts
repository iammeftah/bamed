import { config } from "@/lib/config";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type QueryValue = string | number | boolean | null | undefined;
type Query = Record<string, QueryValue | QueryValue[]>;

export type RequestOptions = Omit<RequestInit, "body" | "credentials"> & {
  body?: unknown;
  query?: Query;
  /**
   * Private admin calls. They go to our own /api/admin/* proxy, which adds the
   * token from the httpOnly cookie. Browser only.
   */
  auth?: boolean;
  /** Session calls (login, me, logout) to our own /api/auth/*. Browser only. */
  session?: boolean;
  /** Next.js server cache hint, only for public calls */
  next?: { revalidate?: number | false; tags?: string[] };
};

/**
 * Base URL of the Laravel API for public calls.
 * On the server it can use BACKEND_API_URL, and "localhost" is pinned to 127.0.0.1
 * because it may resolve to ::1 first while `php artisan serve` listens on IPv4 only.
 */
function publicBase(): string {
  if (typeof window !== "undefined") return config.apiUrl;
  const raw = process.env.BACKEND_API_URL ?? config.apiUrl;
  return raw
    .replace(/\/+$/, "")
    .replace(/^(https?:\/\/)localhost(?=[:/]|$)/i, "$1127.0.0.1");
}

function buildUrl(
  path: string,
  query: Query | undefined,
  scope: "public" | "admin" | "session",
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v !== undefined && v !== null && v !== "") params.append(key, String(v));
    }
  }
  const qs = params.toString();
  const p = path.startsWith("/") ? path : `/${path}`;

  let prefix: string;
  if (scope === "admin") prefix = "/api/admin";
  else if (scope === "session") prefix = "/api/auth";
  else {
    prefix = publicBase();
    if (!prefix) {
      throw new ApiError(
        503,
        "API non configurée : définissez NEXT_PUBLIC_API_URL.",
      );
    }
  }
  return `${prefix}${p}${qs ? `?${qs}` : ""}`;
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = `Erreur ${res.status}`;
  let fieldErrors: Record<string, string> | undefined;
  try {
    const data = (await res.json()) as {
      message?: string;
      error?: string;
      errors?: Record<string, unknown>;
    };
    message = data.message ?? data.error ?? message;
    if (data.errors && typeof data.errors === "object") {
      fieldErrors = {};
      for (const [key, value] of Object.entries(data.errors)) {
        fieldErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
      }
    }
  } catch {
    /* body was not JSON */
  }
  return new ApiError(res.status, message, fieldErrors);
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, query, auth = false, session = false, headers, ...init } = options;
  const scope = auth ? "admin" : session ? "session" : "public";

  if (scope !== "public" && typeof window === "undefined") {
    throw new Error("Les appels privés se font depuis le navigateur.");
  }

  const url = buildUrl(path, query, scope);

  const h = new Headers(headers);
  h.set("Accept", "application/json");
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) h.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: h,
      // Private calls are same-origin: the browser attaches the cookie itself
      ...(scope !== "public" && {
        credentials: "same-origin" as const,
        cache: "no-store" as const,
      }),
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as FormData)
            : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur.");
  }

  // A 401 on an admin call means the session is gone (a 401 at login is just a wrong password)
  if (res.status === 401 && auth && typeof window !== "undefined") {
    window.dispatchEvent(new Event("bamed:auth-expired"));
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}