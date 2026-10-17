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

/** Photos uploaded through the back office are served by Laravel (/storage/...). */
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
    // Uploaded photos have random file names and never change: cache them for 30 days
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Next blocks images served from localhost by default: allowed in dev only
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig