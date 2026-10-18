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
 * Where Laravel lives. Photos uploaded through the back office are served by
 * Laravel at /storage/products/<file>.
 * BACKEND_API_URL (server only) wins over NEXT_PUBLIC_API_URL.
 */
const apiOrigin = (() => {
  try {
    return new URL(
      process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ""
    )
  } catch {
    return null
  }
})()

/**
 * "localhost" can resolve to ::1 first, while `php artisan serve` only listens
 * on IPv4. It is pinned to 127.0.0.1 (same trick as lib/server/backend.ts).
 */
const backendOrigin = apiOrigin
  ? `${apiOrigin.protocol}//${
      apiOrigin.hostname === "localhost" ? "127.0.0.1" : apiOrigin.hostname
    }${apiOrigin.port ? `:${apiOrigin.port}` : ""}`
  : null

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Uploaded photos have random file names and never change: cache them for 30 days
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Next blocks images served from localhost by default: allowed in dev only
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  /**
   * lib/images.ts turns every uploaded photo URL into the same-origin path
   * /storage/products/<file>. This rewrite sends that path to Laravel, so
   * next/image sees a local image (no remotePatterns, no host matching).
   */
  async rewrites() {
    if (!backendOrigin) return []
    return [
      {
        source: "/storage/products/:file",
        destination: `${backendOrigin}/storage/products/:file`,
      },
    ]
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig