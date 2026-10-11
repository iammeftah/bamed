import { RotateCcw, Ruler, ShieldCheck, Truck } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/landing/reveal";

const items = [
  {
    icon: Truck,
    title: "Livraison partout au Maroc",
    text: "Directement chez vous, où que vous soyez.",
  },
  {
    icon: RotateCcw,
    title: "Retours faciles",
    text: "Pas la bonne taille ? Le retour est simple.",
  },
  {
    icon: ShieldCheck,
    title: "Paiement sécurisé",
    text: "Un paiement pensé pour protéger vos données.",
  },
  {
    icon: Ruler,
    title: "Coupe fidèle à la taille",
    text: "Taillé pour tomber comme vous l'attendez.",
  },
];

export function TrustStrip() {
  return (
    <section
      id="confiance"
      aria-label="Pourquoi acheter chez BAMED"
      className="bg-background"
    >
      <RevealGroup className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-6 px-5 py-12 sm:grid-cols-2 md:px-10 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <RevealItem key={title} className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
              <Icon className="size-6" strokeWidth={1.5} aria-hidden />
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                {title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground md:text-base">
                {text}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}