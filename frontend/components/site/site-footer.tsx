import Link from "next/link";
import { ArrowUp } from "lucide-react";

/** Add or remove links here, the columns follow. */
const columns = [
  {
    title: "Boutique",
    links: [
      { label: "Tout voir", href: "/boutique" },
      { label: "Nouveautés", href: "/#nouveautes" },
      { label: "Chemises", href: "/boutique?categorie=chemises" },
      { label: "Pantalons", href: "/boutique?categorie=pantalons" },
      { label: "Vestes", href: "/boutique?categorie=vestes" },
      { label: "Maille", href: "/boutique?categorie=maille" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "À propos", href: "/a-propos" },
      { label: "Livraison", href: "#" },
      { label: "Retours et échanges", href: "#" },
      { label: "Guide des tailles", href: "#" },
    ],
  },
  {
    title: "Aide",
    links: [
      { label: "Contact", href: "#" },
      { label: "Suivre ma commande", href: "#" },
      { label: "Questions fréquentes", href: "#" },
      { label: "Paiement sécurisé", href: "#" },
    ],
  },
];

const linkClass =
  "text-base text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

export function SiteFooter() {
  return (
    <footer className="overflow-hidden bg-muted text-foreground">
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-16 md:px-10 md:pt-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Link
              href="/"
              aria-label="BAMED, accueil"
              className="font-display text-3xl font-bold tracking-[0.28em]"
            >
              BAMED
            </Link>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground md:text-lg">
              La mode homme premium du quotidien. Des coupes nettes, des
              matières honnêtes, livrées partout au Maroc.
            </p>
          </div>

          <nav
            aria-label="Pied de page"
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7"
          >
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
                  {col.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:mt-20">
          <p>© {new Date().getFullYear()} BAMED. Tous droits réservés.</p>
          <a
            href="#"
            className="group inline-flex items-center gap-2 font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Retour en haut
            <ArrowUp
              className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </a>
        </div>
      </div>

      {/* <div
        aria-hidden
        className="pointer-events-none -mb-[0.14em] select-none text-center font-display text-[length:clamp(6rem,30vw,26rem)] font-bold leading-[0.8] text-foreground"
      >
        BAMED
      </div> */}
    </footer>
  );
}
