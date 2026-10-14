// frontend/components/site/site-footer.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type FooterCategory = { id: string; label: string };

/** Add or remove links here, the columns follow. The shop links come from the categories. */
function buildColumns(categories: FooterCategory[]) {
  return [
    {
      title: "Boutique",
      links: [
        { label: "Tout voir", href: "/boutique" },
        { label: "Nouveautés", href: "/boutique?nouveau=1" },
        ...categories.slice(0, 6).map((c) => ({
          label: c.label,
          href: `/boutique?categorie=${encodeURIComponent(c.id)}`,
        })),
      ],
    },
    {
      title: "Informations",
      links: [
        { label: "À propos", href: "/a-propos" },
        { label: "Guide des tailles", href: "/guide-des-tailles" },
        { label: "Questions fréquentes", href: "/faq" },
      ],
    },
  ];
}

const linkClass =
  "text-base text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

export function SiteFooter({
  categories = [],
}: {
  categories?: FooterCategory[];
}) {
  const pathname = usePathname();
  const { status } = useAuth();

  // The back office has its own layout: no public footer there
  if (pathname.startsWith("/admin")) return null;

  const columns = buildColumns(categories);

  return (
    <footer className="overflow-hidden bg-muted text-foreground">
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-16 md:px-10 md:pt-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <Link
              href="/"
              aria-label="BAMED, accueil"
              className="font-display text-3xl font-bold tracking-[0.28em]"
            >
              BAMED
            </Link>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground md:text-lg">
              La mode homme premium du quotidien. Des coupes nettes, des
              matières honnêtes, à découvrir dans notre vitrine.
            </p>
          </div>

          <nav
            aria-label="Pied de page"
            className="grid grid-cols-2 gap-x-6 gap-y-10 lg:col-span-6"
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p>© {new Date().getFullYear()} BAMED. Tous droits réservés.</p>
            <Link
              href={status === "authenticated" ? "/admin/dashboard" : "/admin/auth"}
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {status === "authenticated" ? "Tableau de bord" : "Espace équipe"}
            </Link>
          </div>
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
    </footer>
  );
}