import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pageList(page: number, total: number): (number | "gap")[] {
  const set = new Set(
    [1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total),
  );
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) out.push("gap");
    out.push(n);
    prev = n;
  }
  return out;
}

const base =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-14 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={cn(base, "gap-1 bg-muted hover:bg-foreground/10 disabled:opacity-40")}
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span className="hidden sm:inline">Précédent</span>
        <span className="sr-only sm:hidden">Page précédente</span>
      </button>

      {pageList(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              base,
              item === page
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-foreground/10",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(base, "gap-1 bg-muted hover:bg-foreground/10 disabled:opacity-40")}
      >
        <span className="hidden sm:inline">Suivant</span>
        <span className="sr-only sm:hidden">Page suivante</span>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}