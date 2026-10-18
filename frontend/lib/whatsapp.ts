import { formatMAD } from "@/lib/products";
import type { SelectedItem } from "@/lib/selection";

/** Numbers of the shop team, digits only (212612345678). Comma separated in the env. */
export function whatsappNumbers(): string[] {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBERS ?? "")
    .split(",")
    .map((n) => n.replace(/\D/g, ""))
    .filter((n) => n.length >= 8);
}

export function buildMessage(items: SelectedItem[], origin: string): string {
  const lines = items.map((i, n) => {
    const details = [i.brand, i.color, i.size ? `taille ${i.size}` : null]
      .filter(Boolean)
      .join(", ");
    const link = `${origin}/boutique/${encodeURIComponent(i.id)}?couleur=${encodeURIComponent(i.color)}`;
    return `${n + 1}. ${i.name} (${details}) : ${formatMAD(i.price)}\n${link}`;
  });
  const total = items.reduce((s, i) => s + i.price, 0);

  return [
    "Bonjour BAMED 👋",
    "",
    "Je souhaiterais vérifier la disponibilité de ces articles vus sur votre site :",
    "",
    ...lines,
    "",
    `Total indicatif : ${formatMAD(total)}`,
    "",
    "Pouvez-vous me confirmer la disponibilité (tailles et couleurs) ? Je passerai les essayer en boutique. Merci !",
  ].join("\n");
}

/** Picks one team member at random, so the messages are spread out. */
export function whatsappUrl(items: SelectedItem[]): string | null {
  const numbers = whatsappNumbers();
  if (numbers.length === 0 || items.length === 0) return null;
  const to = numbers[Math.floor(Math.random() * numbers.length)];
  const text = buildMessage(items, window.location.origin);
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}