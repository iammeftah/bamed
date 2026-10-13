export const ADMIN_HOME = "/admin/dashboard";
export const ADMIN_LOGIN = "/admin/auth";

/**
 * Only allow redirects to back office pages on this site.
 * Blocks open redirects ("//evil.com", "/\evil.com", full URLs).
 */
export function safeNext(value?: string | null): string {
  if (!value) return ADMIN_HOME;
  if (value.includes("\\") || value.includes("//")) return ADMIN_HOME;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(value)) return ADMIN_HOME;

  const insideDashboard =
    value === ADMIN_HOME ||
    value.startsWith(`${ADMIN_HOME}/`) ||
    value.startsWith(`${ADMIN_HOME}?`);

  return insideDashboard ? value : ADMIN_HOME;
}