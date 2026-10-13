"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Badge,
  EmptyState,
  PageHeader,
  PageSkeleton,
  inputCls,
  tableCls,
  tableWrapCls,
  tdCls,
  thCls,
  trCls,
} from "@/components/dashboard/ui";
import { fmtDateTime } from "@/lib/dashboard/format";
import { useDashboard } from "@/lib/dashboard/store";
import type { LogAction, LogEntity } from "@/types/dashboard";

const actionLabel: Record<LogAction, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  sale: "Vente",
  stock: "Stock",
};

const actionTone: Record<LogAction, "success" | "primary" | "danger" | "neutral" | "warning"> = {
  create: "success",
  update: "primary",
  delete: "danger",
  sale: "neutral",
  stock: "warning",
};

const entityLabel: Record<LogEntity, string> = {
  product: "Produit",
  category: "Catégorie",
  admin: "Administrateur",
  sale: "Vente",
};

export default function JournalPage() {
  const d = useDashboard();
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState("all");
  const [entity, setEntity] = useState<"all" | LogEntity>("all");
  const [visible, setVisible] = useState(50);

  const actors = useMemo(
    () => [...new Map(d.logs.map((l) => [l.actorId, l.actorName])).entries()],
    [d.logs],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return d.logs.filter(
      (l) =>
        (actor === "all" || l.actorId === actor) &&
        (entity === "all" || l.entity === entity) &&
        (!q || l.summary.toLowerCase().includes(q)),
    );
  }, [d.logs, query, actor, entity]);

  if (!d.ready) return <PageSkeleton />;

  if (d.role !== "admin")
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Accès refusé</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Le journal est réservé aux administrateurs.
        </p>
      </div>
    );

  return (
    <>
      <PageHeader
        title="Journal d'activité"
        description="Qui a fait quoi, et quand. Les 500 dernières actions."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative block min-w-0 flex-1 basis-56">
          <span className="sr-only">Rechercher dans le journal</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(50);
            }}
            placeholder="Rechercher"
            className={`${inputCls} pl-9`}
          />
        </label>
        <select
          aria-label="Personne"
          value={actor}
          onChange={(e) => {
            setActor(e.target.value);
            setVisible(50);
          }}
          className={`${inputCls} w-auto`}
        >
          <option value="all">Toutes les personnes</option>
          {actors.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Type"
          value={entity}
          onChange={(e) => {
            setEntity(e.target.value as "all" | LogEntity);
            setVisible(50);
          }}
          className={`${inputCls} w-auto`}
        >
          <option value="all">Tous les types</option>
          {(Object.keys(entityLabel) as LogEntity[]).map((k) => (
            <option key={k} value={k}>
              {entityLabel[k]}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Aucune entrée" text="Aucune action ne correspond." />
      ) : (
        <>
          <div className={tableWrapCls}>
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Personne</th>
                  <th className={thCls}>Action</th>
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Détail</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, visible).map((l) => (
                  <tr key={l.id} className={trCls}>
                    <td className={`${tdCls} whitespace-nowrap text-muted-foreground`}>
                      {fmtDateTime(l.at)}
                    </td>
                    <td className={`${tdCls} font-medium`}>{l.actorName}</td>
                    <td className={tdCls}>
                      <Badge tone={actionTone[l.action]}>
                        {actionLabel[l.action]}
                      </Badge>
                    </td>
                    <td className={`${tdCls} text-muted-foreground`}>
                      {entityLabel[l.entity]}
                    </td>
                    <td className={tdCls}>{l.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible < list.length && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + 50)}>
                Afficher plus ({list.length - visible})
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}