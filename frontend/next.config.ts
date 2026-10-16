import type { NextConfig } from "next"

/**
 * Headers sent on every response.
 * The CSP only locks down framing, forms, base URL and plugins for now.
 * A full script-src policy needs a per-request nonce (done later with proxy.ts),
 * otherwise it would break Next's inline scripts.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value:
      "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  },
]

/**
 * Origin of the Laravel server (no /api path), e.g. http://127.0.0.1:8000.
 * "localhost" is pinned to 127.0.0.1 because it can resolve to ::1 first while
 * `php artisan serve` only listens on IPv4.
 */
const backendOrigin = (() => {
  try {
    const raw = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ""
    const url = new URL(raw.replace(/^(https?:\/\/)localhost(?=[:/]|$)/i, "$1127.0.0.1"))
    return url.origin
  } catch {
    return null
  }
})()

/** Fallback for photos still stored as absolute URLs on a host we know. */
const apiOrigin = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_API_URL ?? ""
    )
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Local images: the static photos and the uploaded ones (rewritten to Laravel below)
    localPatterns: [{ pathname: "/images/**" }, { pathname: "/storage/**" }],
    remotePatterns: apiOrigin
      ? [
          {
            protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
            hostname: apiOrigin.hostname,
            port: apiOrigin.port,
            pathname: "/storage/**",
          },
        ]
      : [],
    // Next blocks images served from localhost by default: allowed in dev only
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  /**
   * Uploaded photos live on Laravel (public/storage). The browser and next/image
   * ask for /storage/products/x.webp on this site, and Next fetches it from Laravel.
   */
  async rewrites() {
    return backendOrigin
      ? [
          {
            source: "/storage/:path*",
            destination: `${backendOrigin}/storage/:path*`,
          },
        ]
      : []
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig