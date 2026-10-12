/** Only allow redirects to paths on this site (blocks open redirects). */
export function safeNext(value?: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}