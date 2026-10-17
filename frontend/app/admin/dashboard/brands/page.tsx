"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shop/brand-logo";
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
import { useDashboard, type ActionResult, type BrandInput } from "@/lib/dashboard/store";
import type { AdminBrand } from "@/types/dashboard";

const MAX_FILE = 10 * 1024 * 1024;

function BrandForm({
  initial,
  onSave,
  onClose,
}: {
  initial: AdminBrand | null;
  onSave: (i: BrandInput) => ActionResult;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [logo, setLogo] = useState<string | null>(initial?.logo ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Frees the preview URL when it changes and when the form closes
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > MAX_FILE) {
      setError("Image invalide (JPG, PNG ou WebP, 10 Mo max).");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function removeLogo() {
    setFile(null);
    setPreview(null);
    setLogo(null);
  }

  const shown = preview ?? logo ?? undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    const err = await onSave({ id: initial?.id, name, logo, file });
    setPending(false);
    if (err) setError(err);
    else onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nom" htmlFor="b-name">
        <input
          id="b-name"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adidas, Lacoste..."
          className={inputCls}
        />
      </Field>

      <div className="space-y-1.5">
        <p className="text-xs font-medium">Logo</p>
        <div className="flex items-center gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-border">
            <BrandLogo name={name.trim() || "Marque"} logo={shown} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-4" aria-hidden />
              {shown ? "Changer" : "Ajouter un logo"}
            </Button>
            {shown && (
              <Button type="button" variant="ghost" size="lg" onClick={removeLogo}>
                Retirer
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Idéal : fond transparent ou blanc, logo centré. Sans logo, le nom est
          affiché.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>

      {error && <Alert>{error}</Alert>}
      <FormActions
        pending={pending}
        submitLabel={initial ? "Enregistrer" : "Créer la marque"}
        onCancel={onClose}
      />
    </form>
  );
}

export default function BrandsPage() {
  const d = useDashboard();
  const [editing, setEditing] = useState<AdminBrand | "new" | null>(null);
  const [removing, setRemoving] = useState<AdminBrand | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  if (!d.ready) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Marques"
        description="Les marques proposées dans la boutique. Chaque produit peut en avoir une."
        actions={
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden />
            Nouvelle marque
          </Button>
        }
      />

      {d.brands.length === 0 ? (
        <EmptyState
          title="Aucune marque"
          text="Ajoutez une marque, puis choisissez-la dans la fiche d'un produit."
        />
      ) : (
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Marque</th>
                <th className={thCls}>Slug</th>
                <th className={thCls}>Produits</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {d.brands.map((b) => (
                <tr key={b.id} className={trCls}>
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-border">
                        <BrandLogo name={b.name} logo={b.logo} sizes="40px" />
                      </div>
                      <span className="font-medium">{b.name}</span>
                    </div>
                  </td>
                  <td className={`${tdCls} font-mono text-xs text-muted-foreground`}>
                    {b.slug}
                  </td>
                  <td className={`${tdCls} tabular-nums`}>{b.productCount}</td>
                  <td className={`${tdCls} text-right`}>
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Modifier ${b.name}`}
                        onClick={() => setEditing(b)}
                      >
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Supprimer ${b.name}`}
                        onClick={() => {
                          setRemoveError(null);
                          setRemoving(b);
                        }}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing === "new" ? "Nouvelle marque" : "Modifier la marque"}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <BrandForm
            initial={editing === "new" ? null : editing}
            onSave={d.saveBrand}
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        title="Supprimer cette marque ?"
        message={
          removing
            ? `« ${removing.name} » sera supprimée. Ses ${removing.productCount} produit(s) restent dans le catalogue, sans marque.`
            : ""
        }
        error={removeError}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          const err = await d.deleteBrand(removing.id);
          if (err) setRemoveError(err);
          else setRemoving(null);
        }}
      />
    </>
  );
}