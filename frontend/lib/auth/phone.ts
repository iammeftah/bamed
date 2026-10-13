// frontend/lib/auth/phone.ts
/**
 * Turns a Moroccan phone number typed in any common way into +212XXXXXXXXX.
 * Accepts: 06 12 34 56 78, 0612345678, +212 6 12 34 56 78, 00212612345678, 612345678.
 * Returns null when the number is not valid (mobile 06/07 or landline 05).
 */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/[\s.\-()]/g, "");
  if (d.startsWith("+212")) d = d.slice(4);
  else if (d.startsWith("00212")) d = d.slice(5);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^[5-7]\d{8}$/.test(d) ? `+212${d}` : null;
}