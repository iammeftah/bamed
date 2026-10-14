"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarList } from "@/components/dashboard/charts";
import {
  Alert,
  Card,
  CardHeader,
  EmptyState,
  Field,
  FormActions,
  Modal,
  PageHeader,
  PageSkeleton,
  Segmented,
  StatCard,
  inputCls,
  tableCls,
  tableWrapCls,
  tdCls,
  thCls,
  trCls,
} from "@/components/dashboard/ui";
import { fmtDateTime } from "@/lib/dashboard/format";
import {
  addDays,
  bySeller,
  startOfDay,
  summarize,
} from "@/lib/dashboard/stats";
import { useDashboard } from "@/lib/dashboard/store";
import { formatMAD } from "@/lib/products";
import type { AdminUser, Sale, StockProduct } from "@/types/dashboard";

type Period = "7" | "30" | "90" | "all";
const periods: { id: Period; label: string }[] = [
  { id: "7", label: "7 j" },
  { id: "30", label: "30 j" },
  { id: "90", label: "90 j" },
  { id: "all", label: "Tout" },
];

function SaleForm({
  products,
  sellers,
  defaultSellerId,
  onSave,
  onClose,
}: {
  products: StockProduct[];
  sellers: AdminUser[];
  defaultSellerId: string;
  onSave: (i: {
    productId: string;
    qty: number;
    soldById: string;
  }) => string | null;
  onClose: () => void;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [soldById, setSoldById] = useState(defaultSellerId);
  const [error, setError] = useState<string | null>(null);

  const product = products.find((p) => p.id === productId);
  const q = Number(qty);
  const total = product && Number.isInteger(q) && q > 0 ? product.price * q : 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = onSave({ productId, qty: q, soldById });
    if (err) setError(err);
    else onClose();
  }

  if (products.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Aucun produit actif avec du stock disponible.
      </p>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Produit" htmlFor="v-product">
        <select
          id="v-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className={inputCls}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · stock {p.stock}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quantité" htmlFor="v-qty">
          <input
            id="v-qty"
            required
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Vendu par" htmlFor="v-seller">
          <select
            id="v-seller"
            value={soldById}
            onChange={(e) => setSoldById(e.target.value)}
            className={inputCls}
          >
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="text-sm text-muted-foreground">
        Total :{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {formatMAD(total)}
        </span>
      </p>
      {error && <Alert>{error}</Alert>}
      <FormActions submitLabel="Enregistrer la vente" onCancel={onClose} />
    </form>
  );
}

/** Stops Excel and Sheets from running cell text as a formula (CSV injection). */
function csvCell(v: string | number) {
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function exportCsv(sales: Sale[]) {
  const rows = [
    ["Date", "Produit", "Quantité", "Prix unitaire", "Total", "Vendu par"],
    ...sales.map((s) => [
      fmtDateTime(s.at),
      s.productName,
      s.qty,
      s.unitPrice,
      s.total,
      s.soldByName,
    ]),
  ];
  const csv = "\uFEFF" + rows.map((r) => r.map(csvCell).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "ventes-bamed.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function SalesPage() {
  const d = useDashboard();
  const [period, setPeriod] = useState<Period>("30");
  const [seller, setSeller] = useState("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(25);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const from =
      period === "all" ? 0 : addDays(startOfDay(d.now), -(Number(period) - 1));
    const q = query.trim().toLowerCase();
    return d.sales.filter(
      (s) =>
        s.at >= from &&
        (seller === "all" || s.soldById === seller) &&
        (!q || s.productName.toLowerCase().includes(q)),
    );
  }, [d.sales, d.now, period, seller, query]);

  const sum = useMemo(() => summarize(filtered), [filtered]);
  const sellerBars = useMemo(() => bySeller(filtered), [filtered]);

  if (!d.ready) return <PageSkeleton />;

  const activeAdmins = d.admins.filter((a) => a.active);
  const sellable = d.products.filter((p) => p.active && p.stock > 0);
  const defaultSeller =
    activeAdmins.find((a) => a.id === d.actorId)?.id ?? activeAdmins[0]?.id ?? "";
  // sellers that appear in history but may no longer exist
  const sellerFilter = [
    ...new Map(d.sales.map((s) => [s.soldById, s.soldByName])).entries(),
  ];

  return (
    <>
      <PageHeader
        title="Ventes"
        description="Les ventes en boutique, liées à la personne qui les a réalisées."
        actions={
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
            >
              <Download className="size-4" aria-hidden />
              Exporter en CSV
            </Button>
            <Button size="lg" onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden />
              Nouvelle vente
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented
          label="Période"
          value={period}
          options={periods}
          onChange={(v) => {
            setPeriod(v);
            setVisible(25);
          }}
        />
        <select
          aria-label="Vendeur"
          value={seller}
          onChange={(e) => {
            setSeller(e.target.value);
            setVisible(25);
          }}
          className={`${inputCls} w-auto`}
        >
          <option value="all">Tous les vendeurs</option>
          {sellerFilter.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <label className="relative block min-w-0 flex-1 basis-48">
          <span className="sr-only">Rechercher un produit</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(25);
            }}
            placeholder="Produit"
            className={`${inputCls} pl-9`}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Chiffre d'affaires" value={formatMAD(sum.revenue)} />
        <StatCard label="Commandes" value={String(sum.orders)} hint={`${sum.units} pièces`} />
        <StatCard label="Bénéfice estimé" value={formatMAD(sum.profit)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {filtered.length === 0 ? (
            <EmptyState
              title="Aucune vente"
              text="Aucune vente ne correspond à ces filtres."
            />
          ) : (
            <>
              <div className={tableWrapCls}>
                <table className={tableCls}>
                  <thead>
                    <tr>
                      <th className={thCls}>Date</th>
                      <th className={thCls}>Produit</th>
                      <th className={thCls}>Qté</th>
                      <th className={thCls}>Total</th>
                      <th className={thCls}>Vendu par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, visible).map((s) => (
                      <tr key={s.id} className={trCls}>
                        <td className={`${tdCls} whitespace-nowrap text-muted-foreground`}>
                          {fmtDateTime(s.at)}
                        </td>
                        <td className={`${tdCls} font-medium`}>{s.productName}</td>
                        <td className={`${tdCls} tabular-nums`}>{s.qty}</td>
                        <td className={`${tdCls} tabular-nums`}>
                          {formatMAD(s.total)}
                        </td>
                        <td className={tdCls}>{s.soldByName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {visible < filtered.length && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + 25)}>
                    Afficher plus ({filtered.length - visible})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Classement des vendeurs" />
          <BarList items={sellerBars} format={formatMAD} />
        </Card>
      </div>

      <Modal open={adding} title="Nouvelle vente" onClose={() => setAdding(false)}>
        {adding && (
          <SaleForm
            products={sellable}
            sellers={activeAdmins}
            defaultSellerId={defaultSeller}
            onSave={d.recordSale}
            onClose={() => setAdding(false)}
          />
        )}
      </Modal>
    </>
  );
}