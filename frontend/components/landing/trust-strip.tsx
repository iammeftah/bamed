import { RevealGroup, RevealItem } from "@/components/landing/reveal";

const items = [
  {
    title: "Coupes nettes",
    text: "Des lignes simples, pensées pour tomber juste au quotidien.",
  },
  {
    title: "Matières sincères",
    text: "Coton, lin, laine : des fibres choisies pour leur tenue.",
  },
  {
    title: "Coupe fidèle à la taille",
    text: "Taillé pour tomber comme vous l'attendez.",
  },
  {
    title: "Un vestiaire simple",
    text: "Moins de pièces, mieux choisies, faites pour se combiner.",
  },
];

export function TrustStrip() {
  return (
    <section
      id="confiance"
      aria-label="Pourquoi choisir BAMED"
      className="bg-background"
    >
      <RevealGroup className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-2 md:px-10 lg:grid-cols-4">
        {items.map(({ title, text }) => (
          <RevealItem key={title}>
            <span className="block h-px w-10 bg-gold" aria-hidden />
            <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground md:text-lg">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground md:text-base">
              {text}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}