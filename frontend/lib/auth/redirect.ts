// frontend/lib/auth/redirect.ts
/** Only allow redirects to admin pages on this site (blocks open redirects). */
export function safeNext(value?: string | null): string {
  if (
    value &&
    value.startsWith("/admin") &&
    !value.startsWith("//") &&
    !value.startsWith("/admin/connexion")
  ) {
    return value;
  }
  return "/admin";
}