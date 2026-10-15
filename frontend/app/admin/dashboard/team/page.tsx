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
import { useDashboard, type ActionResult } from "@/lib/dashboard/store";
import { formatMAD } from "@/lib/products";
import type { AdminUser } from "@/types/dashboard";

function AdminForm({
  initial,
  onSave,
  onClose,
}: {
  initial: AdminUser | null;
  onSave: (v: {
    name: string;
    phone: string;
    active: boolean;
    password: string;
  }) => ActionResult;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    const err = await onSave({ name, phone, active, password });
    setPending(false);
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
      <Field
        label="Téléphone"
        htmlFor="a-phone"
        hint="C'est l'identifiant de connexion."
      >
        <input
          id="a-phone"
          type="tel"
          inputMode="tel"
          required
          maxLength={20}
          placeholder="06 12 34 56 78"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field
        label={initial ? "Nouveau mot de passe" : "Mot de passe"}
        htmlFor="a-password"
        hint={
          initial
            ? "Laissez vide pour ne pas le changer. Le changer déconnecte la personne."
            : "8 caractères minimum."
        }
      >
        <input
          id="a-password"
          type="password"
          autoComplete="new-password"
          required={!initial}
          minLength={8}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
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
      {error && <Alert>{error}</Alert>}
      <FormActions
        pending={pending}
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
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {a.phone}
                    </p>
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
                        onClick={async () => {
                          setToggleError(null);
                          setToggleError(
                            await d.saveAdmin({ ...a, active: !a.active }),
                          );
                        }}
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
        onConfirm={async () => {
          if (!removing) return;
          const err = await d.deleteAdmin(removing.id);
          if (err) setRemoveError(err);
          else setRemoving(null);
        }}
      />
    </>
  );
}