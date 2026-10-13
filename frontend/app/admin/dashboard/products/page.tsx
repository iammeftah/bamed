"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Badge,
  ConfirmDialog,
  EmptyState,
  Field,
  FormActions,
  Modal,
  PageHeader,
  PageSkeleton,
  StatCard,
  inputCls,
  tableCls,
  tableWrapCls,
  tdCls,
  thCls,
  trCls,
} from "@/components/dashboard/ui";
import { useDashboard } from "@/lib/dashboard/store";
import { formatMAD } from "@/lib/products";
import type { Category, StockProduct } from "@/types/dashboard";

type StatusFilter = "all" | "low" | "out" | "inactive";

const num = (s: string) => Number(s.trim().replace(",", "."));

/* ---------- Product form ---------- */

function ProductForm({
  initial,
  categories,
  onSave,
  onClose,
}: {
  initial: StockProduct | null;
  categories: Category[];
  onSave: (input: Omit<StockProduct, "id" | "createdAt">) => string | null;
  onClose: () => void;
}) {
  const [v, setV] = useState({
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    price: initial ? String(initial.price) : "",
    oldPrice: initial?.oldPrice != null ? String(initial.oldPrice) : "",
    cost: initial ? String(initial.cost) : "",
    stock: String(initial?.stock ?? 0),
    lowStockAt: String(initial?.lowStockAt ?? 10),
    sizes: (initial?.sizes ?? []).join(", "),
    active: initial?.active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = onSave({
      name: v.name,
      sku: v.sku,
      categoryId: v.categoryId,
      price: num(v.price),
      oldPrice: v.oldPrice.trim() ? num(v.oldPrice) : undefined,
      cost: v.cost.trim() ? num(v.cost) : 0,
      stock: initial ? initial.stock : num(v.stock),
      lowStockAt: num(v.lowStockAt),
      sizes: v.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      active: v.active,
    });
    if (err) setError(err);
    else onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nom" htmlFor="p-name">
        <input
          id="p-name"
          required
          value={v.name}
          onChange={(e) => set({ name: e.target.value })}
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Catégorie" htmlFor="p-cat">
          <select
            id="p-cat"
            value={v.categoryId}
            onChange={(e) => set({ categoryId: e.target.value })}
            className={inputCls}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="SKU" htmlFor="p-sku" hint="Laissez vide pour générer">
          <input
            id="p-sku"
            value={v.sku}
            onChange={(e) => set({ sku: e.target.value })}
            placeholder="BAM-1009"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Prix (MAD)" htmlFor="p-price">
          <input
            id="p-price"
            required
            inputMode="decimal"
            value={v.price}
            onChange={(e) => set({ price: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Ancien prix" htmlFor="p-old" hint="Pour une promo">
          <input
            id="p-old"
            inputMode="decimal"
            value={v.oldPrice}
            onChange={(e) => set({ oldPrice: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Coût d'achat" htmlFor="p-cost">
          <input
            id="p-cost"
            inputMode="decimal"
            value={v.cost}
            onChange={(e) => set({ cost: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Stock initial"
          htmlFor="p-stock"
          hint={initial ? "Modifiable via « Stock » dans la liste" : undefined}
        >
          <input
            id="p-stock"
            inputMode="numeric"
            disabled={Boolean(initial)}
            value={v.stock}
            onChange={(e) => set({ stock: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Seuil d'alerte" htmlFor="p-low">
          <input
            id="p-low"
            inputMode="numeric"
            value={v.lowStockAt}
            onChange={(e) => set({ lowStockAt: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Tailles" htmlFor="p-sizes" hint="Séparées par des virgules">
        <input
          id="p-sizes"
          value={v.sizes}
          onChange={(e) => set({ sizes: e.target.value })}
          placeholder="S, M, L, XL"
          className={inputCls}
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={v.active}
          onChange={(e) => set({ active: e.target.checked })}
          className="size-4 accent-[var(--primary)]"
        />
        Produit actif (vendable)
      </label>

      {error && <Alert>{error}</Alert>}
      <FormActions
        submitLabel={initial ? "Enregistrer" : "Créer le produit"}
        onCancel={onClose}
      />
    </form>
  );
}

/* ---------- Stock adjustment ---------- */

function StockForm({
  product,
  onSave,
  onClose,
}: {
  product: StockProduct;
  onSave: (delta: number, reason: string) => string | null;
  onClose: () => void;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsed = Number(delta);
  const valid = Number.isInteger(parsed) && parsed !== 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = onSave(parsed, reason);
    if (err) setError(err);
    else onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {product.name} : stock actuel{" "}
        <span className="font-semibold text-foreground">{product.stock}</span>
        {valid && product.stock + parsed >= 0 && (
          <>
            {" "}
            → nouveau stock{" "}
            <span className="font-semibold text-foreground">
              {product.stock + parsed}
            </span>
          </>
        )}
      </p>
      <Field
        label="Variation"
        htmlFor="s-delta"
        hint="Positif pour un réassort, négatif pour une perte ou une correction"
      >
        <input
          id="s-delta"
          required
          inputMode="numeric"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="+20 ou -2"
          className={inputCls}
        />
      </Field>
      <Field label="Motif" htmlFor="s-reason">
        <input
          id="s-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Réassort fournisseur, casse, inventaire..."
          className={inputCls}
        />
      </Field>
      {error && <Alert>{error}</Alert>}
      <FormActions submitLabel="Ajuster le stock" onCancel={onClose} />
    </form>
  );
}

/* ---------- Page ---------- */

export default function ProductsPage() {
  const d = useDashboard();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<StockProduct | "new" | null>(null);
  const [stockFor, setStockFor] = useState<StockProduct | null>(null);
  const [removing, setRemoving] = useState<StockProduct | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const catName = useMemo(
    () => new Map(d.categories.map((c) => [c.id, c.name])),
    [d.categories],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return d.products.filter((p) => {
      if (cat !== "all" && p.categoryId !== cat) return false;
      if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q)) return false;
      if (status === "out" && p.stock !== 0) return false;
      if (status === "low" && !(p.stock > 0 && p.stock <= p.lowStockAt))
        return false;
      if (status === "inactive" && p.active) return false;
      return true;
    });
  }, [d.products, query, cat, status]);

  if (!d.ready) return <PageSkeleton />;

  const stockValue = d.products.reduce((s, p) => s + p.cost * p.stock, 0);
  const alerts = d.products.filter(
    (p) => p.active && p.stock <= p.lowStockAt,
  ).length;

  return (
    <>
      <PageHeader
        title="Produits"
        description="Gérez le catalogue et le stock."
        actions={
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden />
            Nouveau produit
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Références" value={String(d.products.length)} />
        <StatCard
          label="Valeur du stock (au coût)"
          value={formatMAD(stockValue)}
        />
        <StatCard
          label="Alertes de stock"
          value={String(alerts)}
          hint="ruptures et stocks bas"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative block min-w-0 flex-1 basis-56">
          <span className="sr-only">Rechercher un produit</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom ou SKU"
            className={`${inputCls} pl-9`}
          />
        </label>
        <select
          aria-label="Catégorie"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className={`${inputCls} w-auto`}
        >
          <option value="all">Toutes les catégories</option>
          {d.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Statut"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className={`${inputCls} w-auto`}
        >
          <option value="all">Tous les statuts</option>
          <option value="low">Stock bas</option>
          <option value="out">Rupture</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      <div className="mt-4">
        {list.length === 0 ? (
          <EmptyState
            title="Aucun produit"
            text="Modifiez vos filtres ou ajoutez un produit."
          />
        ) : (
          <div className={tableWrapCls}>
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Produit</th>
                  <th className={thCls}>Catégorie</th>
                  <th className={thCls}>Prix</th>
                  <th className={thCls}>Stock</th>
                  <th className={thCls}>Statut</th>
                  <th className={`${thCls} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className={trCls}>
                    <td className={tdCls}>
                      <p className="font-medium">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {p.sku}
                      </p>
                    </td>
                    <td className={`${tdCls} text-muted-foreground`}>
                      {catName.get(p.categoryId) ?? "Sans catégorie"}
                    </td>
                    <td className={`${tdCls} tabular-nums`}>
                      {formatMAD(p.price)}
                      {p.oldPrice && (
                        <span className="ml-2 text-xs text-muted-foreground line-through">
                          {formatMAD(p.oldPrice)}
                        </span>
                      )}
                    </td>
                    <td className={tdCls}>
                      <span className="mr-2 tabular-nums">{p.stock}</span>
                      {p.stock === 0 ? (
                        <Badge tone="danger">Rupture</Badge>
                      ) : p.stock <= p.lowStockAt ? (
                        <Badge tone="warning">Bas</Badge>
                      ) : null}
                    </td>
                    <td className={tdCls}>
                      <Badge tone={p.active ? "success" : "neutral"}>
                        {p.active ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStockFor(p)}
                        >
                          Stock
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Modifier ${p.name}`}
                          onClick={() => setEditing(p)}
                        >
                          <Pencil aria-hidden />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Supprimer ${p.name}`}
                            onClick={() => {
                              setRemoveError(null);
                              setRemoving(p);
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
      </div>

      <Modal
        open={editing !== null}
        title={editing === "new" ? "Nouveau produit" : "Modifier le produit"}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <ProductForm
            initial={editing === "new" ? null : editing}
            categories={d.categories}
            onSave={(input) =>
              d.saveProduct({
                ...input,
                id: editing === "new" ? undefined : editing.id,
              })
            }
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={stockFor !== null}
        title="Ajuster le stock"
        onClose={() => setStockFor(null)}
      >
        {stockFor && (
          <StockForm
            product={stockFor}
            onSave={(delta, reason) => d.adjustStock(stockFor.id, delta, reason)}
            onClose={() => setStockFor(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        title="Supprimer ce produit ?"
        message={
          removing
            ? `« ${removing.name} » sera retiré du catalogue. L'historique des ventes est conservé.`
            : ""
        }
        error={removeError}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          const err = d.deleteProduct(removing.id);
          if (err) setRemoveError(err);
          else setRemoving(null);
        }}
      />
    </>
  );
}