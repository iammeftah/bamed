"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  ConfirmDialog,
  EmptyState,
  Field,
  FormActions,
  Modal,
  PageHeader,
  PageSkeleton,
  inputCls,
  tableCls,
  tableWrapCls,
  tdCls,
  thCls,
  trCls,
} from "@/components/dashboard/ui";
import { useDashboard } from "@/lib/dashboard/store";
import { formatMAD } from "@/lib/products";
import type { Category } from "@/types/dashboard";

function CategoryForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Category | null;
  onSave: (name: string, description: string) => string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = onSave(name, description);
    if (err) setError(err);
    else onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nom" htmlFor="c-name">
        <input
          id="c-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Description" htmlFor="c-desc">
        <textarea
          id="c-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
        />
      </Field>
      {error && <Alert>{error}</Alert>}
      <FormActions
        submitLabel={initial ? "Enregistrer" : "Créer la catégorie"}
        onCancel={onClose}
      />
    </form>
  );
}

export default function CategoriesPage() {
  const d = useDashboard();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [removing, setRemoving] = useState<Category | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { products: number; revenue: number }>();
    for (const c of d.categories) map.set(c.id, { products: 0, revenue: 0 });
    for (const p of d.products) {
      const row = map.get(p.categoryId);
      if (row) row.products += 1;
    }
    for (const s of d.sales) {
      const row = map.get(s.categoryId);
      if (row) row.revenue += s.total;
    }
    return map;
  }, [d.categories, d.products, d.sales]);

  if (!d.ready) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Catégories"
        description="Organisez le catalogue."
        actions={
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden />
            Nouvelle catégorie
          </Button>
        }
      />

      {d.categories.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          text="Créez une catégorie avant d'ajouter des produits."
        />
      ) : (
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Nom</th>
                <th className={thCls}>Slug</th>
                <th className={thCls}>Produits</th>
                <th className={thCls}>Chiffre d&apos;affaires</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {d.categories.map((c) => {
                const s = stats.get(c.id);
                return (
                  <tr key={c.id} className={trCls}>
                    <td className={tdCls}>
                      <p className="font-medium">{c.name}</p>
                      {c.description && (
                        <p className="max-w-xs truncate text-xs text-muted-foreground">
                          {c.description}
                        </p>
                      )}
                    </td>
                    <td className={`${tdCls} font-mono text-xs text-muted-foreground`}>
                      {c.slug}
                    </td>
                    <td className={`${tdCls} tabular-nums`}>{s?.products ?? 0}</td>
                    <td className={`${tdCls} tabular-nums`}>
                      {formatMAD(s?.revenue ?? 0)}
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Modifier ${c.name}`}
                          onClick={() => setEditing(c)}
                        >
                          <Pencil aria-hidden />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Supprimer ${c.name}`}
                            onClick={() => {
                              setRemoveError(null);
                              setRemoving(c);
                            }}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing === "new" ? "Nouvelle catégorie" : "Modifier la catégorie"}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <CategoryForm
            initial={editing === "new" ? null : editing}
            onSave={(name, description) =>
              d.saveCategory({
                id: editing === "new" ? undefined : editing.id,
                name,
                description,
              })
            }
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        title="Supprimer cette catégorie ?"
        message={
          removing
            ? `« ${removing.name} » sera supprimée. Une catégorie qui contient encore des produits ne peut pas être supprimée.`
            : ""
        }
        error={removeError}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          const err = d.deleteCategory(removing.id);
          if (err) setRemoveError(err);
          else setRemoving(null);
        }}
      />
    </>
  );
}