import { Diamond } from "lucide-react";

const phrases = [
  "Mode homme du quotidien",
  "Coupé pour la vraie vie",
  "Fait pour être porté",
  "Lignes épurées",
  "Coupes faciles",
];

function Group({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-6 pr-6 md:gap-8 md:pr-8"
    >
      {phrases.map((p) => (
        <li key={p} className="flex items-center gap-6 md:gap-8">
          <span className="whitespace-nowrap font-display text-3xl font-bold uppercase leading-none sm:text-4xl md:text-6xl">
            {p}
          </span>
          <Diamond className="size-4 shrink-0 fill-gold text-gold" aria-hidden />
        </li>
      ))}
    </ul>
  );
}

export function Marquee() {
  return (
    <section
      aria-label="Phrases de la marque BAMED"
      className="marquee overflow-hidden bg-background py-8 text-foreground md:py-12"
    >
      <div className="marquee-track flex w-max">
        <Group />
        <Group hidden />
      </div>
    </section>
  );
}