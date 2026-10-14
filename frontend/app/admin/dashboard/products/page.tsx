"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
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
} from "@/components/dashboard/ui";
import { useDashboard, type ActionResult } from "@/lib/dashboard/store";
import { formatMAD, type ProductColor, type ProductImage } from "@/lib/products";
import { scaleOfCategory, sortSizes, type SizeScale } from "@/lib/sizes";
import type { Category, StockProduct } from "@/types/dashboard";

type StatusFilter = "all" | "low" | "out" | "inactive";

const num = (s: string) => Number(s.trim().replace(",", "."));

/* ---------- Image reading (demo mode) ---------- */

const MAX_SIDE = 720;
const MAX_FILE = 10 * 1024 * 1024;
const MAX_PER_COLOR = 8;

/**
 * Demo mode: shrinks the photo and returns it as a data URL, so it fits in
 * localStorage. With a backend, upload the file (Cloudinary...) and keep the URL.
 */
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load"));
    };
    img.src = url;
  });
}

/* ---------- One colour: name, tint and its photos ---------- */

function ColorBlock({
  index,
  color,
  onChange,
  onRemove,
}: {
  index: number;
  color: ProductColor;
  onChange: (c: ProductColor) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const images = color.images;

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_PER_COLOR - images.length;
    if (room <= 0) {
      setError(`Maximum ${MAX_PER_COLOR} photos par couleur.`);
      return;
    }

    setError(null);
    setBusy(true);
    const added: ProductImage[] = [];
    let skipped = false;
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith("image/") || file.size > MAX_FILE) {
        skipped = true;
        continue;
      }
      try {
        added.push({ src: await readImage(file), alt: "" });
      } catch {
        skipped = true;
      }
    }
    setBusy(false);

    if (added.length) onChange({ ...color, images: [...images, ...added] });
    if (skipped) setError("Certains fichiers ont été ignorés (image, 10 Mo max).");
    else if (files.length > room)
      setError(`Maximum ${MAX_PER_COLOR} photos par couleur.`);
  }

  const removeImage = (n: number) =>
    onChange({ ...color, images: images.filter((_, k) => k !== n) });

  const makeCover = (n: number) =>
    onChange({
      ...color,
      images: [images[n], ...images.filter((_, k) => k !== n)],
    });

  const mini =
    "flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground hover:bg-background";

  return (
    <fieldset className="rounded-lg border border-border p-3">
      <legend className="sr-only">Couleur {index + 1}</legend>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color.hex}
          onChange={(e) => onChange({ ...color, hex: e.target.value })}
          aria-label={`Teinte de la couleur ${index + 1}`}
          className="size-9 shrink-0"
        />
        <input
          value={color.name}
          onChange={(e) => onChange({ ...color, name: e.target.value })}
          placeholder="Nom de la couleur (ex. Noir)"
          aria-label={`Nom de la couleur ${index + 1}`}
          className={inputCls}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Supprimer la couleur ${color.name || index + 1}`}
          onClick={onRemove}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>

      <ul className="mt-3 grid grid-cols-6 gap-2">
        {images.map((img, n) => (
          <li key={n} className="relative overflow-hidden rounded-md">
            <ImagePlaceholder
              src={img.src}
              alt={`Photo ${n + 1}`}
              ratio="4 / 5"
              label=""
              kind="product"
              tone="dark"
              sizes="96px"
              rounded={false}
            />
            {n === 0 && (
              <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold-foreground">
                Couverture
              </span>
            )}
            <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1">
              {n > 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(n)}
                  aria-label={`Définir la photo ${n + 1} comme couverture`}
                  className={mini}
                >
                  <Star className="size-3" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(n)}
                aria-label={`Retirer la photo ${n + 1}`}
                className={mini}
              >
                <X className="size-3" aria-hidden />
              </button>
            </div>
          </li>
        ))}

        {images.length < MAX_PER_COLOR && (
          <li>
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <ImagePlus className="size-5" aria-hidden />
              {busy ? "..." : "Ajouter"}
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFiles}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}

/* ---------- Size picker (sizes depend on the category) ---------- */

function SizePicker({
  scale,
  value,
  onChange,
}: {
  scale: SizeScale;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  // Sizes saved earlier that are not in the scale stay visible, so editing never drops them silently
  const options = [
    ...scale.sizes,
    ...value.filter((s) => !scale.sizes.includes(s)),
  ];
  const toggle = (s: string) =>
    onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  const all = options.every((s) => value.includes(s));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-medium">{scale.title}</p>
          <p className="text-xs text-muted-foreground">
            {scale.short} · {scale.hint}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(all ? [] : options)}
          className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {all ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
      </div>
      <div
        role="group"
        aria-label="Tailles disponibles"
        className="flex flex-wrap gap-2"
      >
        {options.map((s) => {
          const on = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s)}
              className={
                on
                  ? "h-9 min-w-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                  : "h-9 min-w-10 rounded-md border border-input px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              }
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Product form ---------- */

function ProductForm({
  initial,
  categories,
  onSave,
  onClose,
}: {
  initial: StockProduct | null;
  categories: Category[];
  onSave: (input: Omit<StockProduct, "id" | "createdAt">) => ActionResult;
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
    active: initial?.active ?? true,
  });
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [colors, setColors] = useState<ProductColor[]>(
    () => initial?.colors ?? [{ name: "", hex: "#111111", images: [] }],
  );
  const [activeColor, setActiveColor] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }));

  // The size buttons follow the size scale of the chosen category
  const scale = scaleOfCategory(categories.find((c) => c.id === v.categoryId));

  // Only one colour is edited at a time (tabs), so the modal keeps a fixed height
  const current = Math.min(activeColor, colors.length - 1);

  const setColor = (i: number, c: ProductColor) =>
    setColors((list) => list.map((x, k) => (k === i ? c : x)));
  const addColor = () => {
    setColors((list) => [...list, { name: "", hex: "#111111", images: [] }]);
    setActiveColor(colors.length);
  };
  const removeColor = (i: number) => {
    setColors((list) => list.filter((_, k) => k !== i));
    setActiveColor(i <= current ? Math.max(0, current - 1) : current);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    const err = await onSave({
      name: v.name,
      sku: v.sku,
      categoryId: v.categoryId,
      // An untouched empty colour row is ignored
      colors: colors.filter((c) => c.name.trim() || c.images.length > 0),
      price: num(v.price),
      oldPrice: v.oldPrice.trim() ? num(v.oldPrice) : undefined,
      cost: v.cost.trim() ? num(v.cost) : 0,
      stock: initial ? initial.stock : num(v.stock),
      lowStockAt: num(v.lowStockAt),
      sizes: sortSizes(sizes),
      active: v.active,
    });
    setPending(false);
    if (err) setError(err);
    else onClose();
  }

  return (
    <form onSubmit={submit} className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
      {/* Left column: product details */}
      <div className="space-y-4">
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
              onChange={(e) => {
                const next = scaleOfCategory(
                  categories.find((c) => c.id === e.target.value),
                );
                set({ categoryId: e.target.value });
                // Sizes that do not exist in the new scale are dropped
                setSizes((s) => s.filter((x) => next.sizes.includes(x)));
              }}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="SKU" htmlFor="p-sku" hint="Vide = généré">
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
            hint={initial ? "Modifiable via « Stock »" : undefined}
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

        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={v.active}
            onChange={(e) => set({ active: e.target.checked })}
            className="size-4 accent-[var(--primary)]"
          />
          Produit actif (vendable)
        </label>
      </div>

      {/* Right column: sizes, colours and photos */}
      <div className="space-y-4">
        <SizePicker scale={scale} value={sizes} onChange={setSizes} />

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium">Couleurs et photos</p>
            <p className="text-xs text-muted-foreground">
              Chaque couleur a ses photos (jusqu&apos;à {MAX_PER_COLOR}). La
              première est la couverture.
            </p>
          </div>

          <ul aria-label="Couleurs du produit" className="flex flex-wrap gap-1.5">
            {colors.map((c, i) => {
              const on = i === current;
              return (
                <li key={i}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setActiveColor(i)}
                    className={`flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-semibold transition-colors ${
                      on
                        ? "border-primary bg-accent text-foreground"
                        : "border-input text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.5)]"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name.trim() || `Couleur ${i + 1}`}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={addColor}
                className="flex h-8 items-center gap-1.5 rounded-md border border-dashed border-input px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="size-3.5" aria-hidden />
                Couleur
              </button>
            </li>
          </ul>

          {colors[current] && (
            <ColorBlock
              key={current}
              index={current}
              color={colors[current]}
              onChange={(next) => setColor(current, next)}
              onRemove={() => removeColor(current)}
            />
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        {error && <Alert>{error}</Alert>}
        <FormActions
          pending={pending}
          submitLabel={initial ? "Enregistrer" : "Créer le produit"}
          onCancel={onClose}
        />
      </div>
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
  onSave: (delta: number, reason: string) => ActionResult;
  onClose: () => void;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const parsed = Number(delta);
  const valid = Number.isInteger(parsed) && parsed !== 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    const err = await onSave(parsed, reason);
    setPending(false);
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
      <FormActions
        pending={pending}
        submitLabel="Ajuster le stock"
        onCancel={onClose}
      />
    </form>
  );
}

/* ---------- Product card (grid) ---------- */

function ProductCard({
  product: p,
  categoryName,
  onStock,
  onEdit,
  onRemove,
}: {
  product: StockProduct;
  categoryName: string;
  onStock: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const out = p.stock === 0;
  const low = !out && p.stock <= p.lowStockAt;
  const cover = p.colors[0]?.images[0];
  const photos = p.colors.reduce((s, c) => s + c.images.length, 0);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative">
        <ImagePlaceholder
          src={cover?.src}
          alt={cover?.alt ?? p.name}
          ratio="4 / 5"
          label="Sans image"
          kind="product"
          tone="dark"
          rounded={false}
          sizes="(min-width:1536px) 20vw, (min-width:1024px) 25vw, 50vw"
        />
        {(!p.active || out || low) && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {!p.active && (
              <span className="rounded-full bg-background">
                <Badge tone="neutral">Inactif</Badge>
              </span>
            )}
            {out && (
              <span className="rounded-full bg-background">
                <Badge tone="danger">Rupture</Badge>
              </span>
            )}
            {low && (
              <span className="rounded-full bg-background">
                <Badge tone="warning">Stock bas</Badge>
              </span>
            )}
          </div>
        )}
        {photos > 0 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {photos} photo{photos > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {p.sku} · {categoryName}
        </p>
        <h3 className="mt-1 text-sm font-semibold leading-snug">{p.name}</h3>

        {p.colors.length > 0 && (
          <ul aria-label="Couleurs" className="mt-2 flex flex-wrap gap-1.5">
            {p.colors.map((c) => (
              <li key={c.name} title={c.name}>
                <span
                  className="block size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.5)]"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="sr-only">{c.name}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums">
          <span className="font-semibold">{formatMAD(p.price)}</span>
          {p.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatMAD(p.oldPrice)}
            </span>
          )}
        </p>
        {p.sizes.length > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {sortSizes(p.sizes).join(" · ")}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          Stock :{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {p.stock}
          </span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-1 pt-3">
          <Button variant="outline" size="sm" onClick={onStock}>
            Stock
          </Button>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Modifier ${p.name}`}
              onClick={onEdit}
            >
              <Pencil aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Supprimer ${p.name}`}
              onClick={onRemove}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </article>
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 2xl:grid-cols-4">
            {list.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                categoryName={catName.get(p.categoryId) ?? "Sans catégorie"}
                onStock={() => setStockFor(p)}
                onEdit={() => setEditing(p)}
                onRemove={() => {
                  setRemoveError(null);
                  setRemoving(p);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={editing !== null}
        title={editing === "new" ? "Nouveau produit" : "Modifier le produit"}
        size="xl"
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
        onConfirm={async () => {
          if (!removing) return;
          const err = await d.deleteProduct(removing.id);
          if (err) setRemoveError(err);
          else setRemoving(null);
        }}
      />
    </>
  );
}