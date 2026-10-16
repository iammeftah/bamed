/**
 * Photos uploaded through the back office are served by Laravel at
 * /storage/products/<file>. The database may hold them as absolute URLs
 * (http://localhost:8000/storage/products/x.webp), and the host can change
 * between environments.
 *
 * Every such URL is turned into the same-origin path /storage/products/<file>.
 * next.config.ts rewrites that path to the Laravel server, so next/image treats
 * it as a local image: no remotePatterns, no host matching.
 */
const STORAGE_PATH = /^\/storage\/products\/[A-Za-z0-9_-]+\.(?:webp|jpe?g|png)$/i;

export function resolveImageSrc(src: string | undefined): string | undefined {
  if (!src) return src;

  // Previews of photos not saved yet
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;

  // Already a path on this site (/images/..., /storage/...)
  if (src.startsWith("/")) return src;

  try {
    const url = new URL(src);
    if (STORAGE_PATH.test(url.pathname)) return url.pathname;
  } catch {
    /* not a valid URL: leave it as it is */
  }
  return src;
}