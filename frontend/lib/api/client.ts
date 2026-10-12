import { config } from "@/lib/config";
import { clearSession, getTokens, setTokens } from "@/lib/auth/storage";

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

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Query;
  /** Send the access token, and refresh it once on a 401 */
  auth?: boolean;
  /** Next.js server cache hint, ignored in the browser */
  next?: { revalidate?: number | false; tags?: string[] };
};

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v !== undefined && v !== null && v !== "") params.append(key, String(v));
    }
  }
  const qs = params.toString();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${config.apiUrl}${p}${qs ? `?${qs}` : ""}`;
}

let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;
  try {
    const res = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      accessToken?: string;
      token?: string;
      refreshToken?: string;
    };
    const accessToken = data.accessToken ?? data.token;
    if (!accessToken) return false;
    setTokens({ accessToken, refreshToken: data.refreshToken ?? refreshToken });
    return true;
  } catch {
    return false;
  }
}

/** Single flight: parallel 401s share one refresh call. */
function refreshSession(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
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
  const { body, query, auth = false, headers, ...init } = options;

  const send = () => {
    const h = new Headers(headers);
    h.set("Accept", "application/json");
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isForm) h.set("Content-Type", "application/json");
    if (auth) {
      const { accessToken } = getTokens();
      if (accessToken) h.set("Authorization", `Bearer ${accessToken}`);
    }
    return fetch(buildUrl(path, query), {
      ...init,
      headers: h,
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as FormData)
            : JSON.stringify(body),
    });
  };

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur.");
  }

  if (res.status === 401 && auth) {
    if (await refreshSession()) {
      try {
        res = await send();
      } catch {
        throw new ApiError(0, "Impossible de joindre le serveur.");
      }
    } else {
      clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bamed:auth-expired"));
      }
    }
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}