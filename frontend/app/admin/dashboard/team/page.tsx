"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Badge,
  ConfirmDialog,
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
import { fmtDate } from "@/lib/dashboard/format";
import { useDashboard } from "@/lib/dashboard/store";
import { formatMAD } from "@/lib/products";
import type { AdminRole, AdminUser } from "@/types/dashboard";

const roleLabel: Record<AdminRole, string> = {
  admin: "Administrateur",
  manager: "Gestionnaire",
};

function AdminForm({
  initial,
  onSave,
  onClose,
}: {
  initial: AdminUser | null;
  onSave: (v: {
    name: string;
    email: string;
    role: AdminRole;
    active: boolean;
  }) => string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<AdminRole>(initial?.role ?? "manager");
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = onSave({ name, email, role, active });
    if (err) setError(err);
    else onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nom complet" htmlFor="a-name">
        <input
          id="a-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="E-mail" htmlFor="a-email">
        <input
          id="a-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field
        label="Rôle"
        htmlFor="a-role"
        hint="Un gestionnaire peut gérer produits, catégories et ventes, mais pas supprimer ni gérer l'équipe."
      >
        <select
          id="a-role"
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          className={inputCls}
        >
          <option value="manager">Gestionnaire</option>
          <option value="admin">Administrateur</option>
        </select>
      </Field>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        Compte actif
      </label>
      {!initial && (
        <p className="text-xs text-muted-foreground">
          Le mot de passe sera géré par le backend (invitation par e-mail). En
          mode démo, seule la fiche est créée.
        </p>
      )}
      {error && <Alert>{error}</Alert>}
      <FormActions
        submitLabel={initial ? "Enregistrer" : "Ajouter"}
        onCancel={onClose}
      />
    </form>
  );
}

export default function AdminsPage() {
  const d = useDashboard();
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [removing, setRemoving] = useState<AdminUser | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const perf = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const s of d.sales) {
      const row = map.get(s.soldById) ?? { count: 0, revenue: 0 };
      row.count += 1;
      row.revenue += s.total;
      map.set(s.soldById, row);
    }
    return map;
  }, [d.sales]);

  if (!d.ready) return <PageSkeleton />;

  if (!d.canManageAdmins)
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Accès refusé</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Seuls les administrateurs peuvent gérer l&apos;équipe.
        </p>
      </div>
    );

  return (
    <>
      <PageHeader
        title="Administrateurs"
        description="Gérez les personnes qui ont accès au tableau de bord."
        actions={
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden />
            Ajouter
          </Button>
        }
      />

      {toggleError && (
        <div className="mb-4">
          <Alert>{toggleError}</Alert>
        </div>
      )}

      <div className={tableWrapCls}>
        <table className={tableCls}>
          <thead>
            <tr>
              <th className={thCls}>Nom</th>
              <th className={thCls}>Rôle</th>
              <th className={thCls}>Statut</th>
              <th className={thCls}>Ventes</th>
              <th className={thCls}>Depuis</th>
              <th className={`${thCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {d.admins.map((a) => {
              const p = perf.get(a.id);
              const self = a.id === d.actorId;
              return (
                <tr key={a.id} className={trCls}>
                  <td className={tdCls}>
                    <p className="font-medium">
                      {a.name}
                      {self && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (vous)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={a.role === "admin" ? "primary" : "neutral"}>
                      {roleLabel[a.role]}
                    </Badge>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={a.active ? "success" : "neutral"}>
                      {a.active ? "Actif" : "Désactivé"}
                    </Badge>
                  </td>
                  <td className={`${tdCls} tabular-nums`}>
                    {p ? (
                      <>
                        {p.count}{" "}
                        <span className="text-muted-foreground">
                          · {formatMAD(p.revenue)}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className={`${tdCls} whitespace-nowrap text-muted-foreground`}>
                    {fmtDate(a.createdAt)}
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={self}
                        onClick={() =>
                          setToggleError(
                            d.saveAdmin({ ...a, active: !a.active }),
                          )
                        }
                      >
                        {a.active ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Modifier ${a.name}`}
                        onClick={() => {
                          setToggleError(null);
                          setEditing(a);
                        }}
                      >
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Supprimer ${a.name}`}
                        disabled={self}
                        onClick={() => {
                          setRemoveError(null);
                          setRemoving(a);
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

      <Modal
        open={editing !== null}
        title={editing === "new" ? "Ajouter un administrateur" : "Modifier"}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <AdminForm
            initial={editing === "new" ? null : editing}
            onSave={(v) =>
              d.saveAdmin({ ...v, id: editing === "new" ? undefined : editing.id })
            }
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        title="Supprimer cet administrateur ?"
        message={
          removing
            ? `« ${removing.name} » perdra l'accès. Ses ventes restent dans l'historique, avec son nom.`
            : ""
        }
        error={removeError}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          const err = d.deleteAdmin(removing.id);
          if (err) setRemoveError(err);
          else setRemoving(null);
        }}
      />
    </>
  );
}