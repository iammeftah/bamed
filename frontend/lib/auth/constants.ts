/** Shared by proxy.ts and the server helpers. No secrets here. */
const prod = process.env.NODE_ENV === "production";

/** "__Host-" forces Secure, Path=/ and no Domain: the browser refuses anything looser. */
export const SESSION_COOKIE = prod ? "__Host-bamed-session" : "bamed-session";

/** Keep in sync with Sanctum's "expiration" (minutes) on the backend. */
export const SESSION_MAX_AGE = 60 * 60 * 12;

export const IS_PROD = prod;