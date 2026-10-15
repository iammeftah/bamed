"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, BarList } from "@/components/dashboard/charts";
import {
  Alert,
  Badge,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PageSkeleton,
  Segmented,
  StatCard,
  tableCls,
  tableWrapCls,
  tdCls,
  thCls,
  trCls,
} from "@/components/dashboard/ui";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime, fmtDay } from "@/lib/dashboard/format";
import { formatMAD } from "@/lib/products";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/services/admin.service";
import { systemService } from "@/services/system.service";
import type { Level, SystemOverview } from "@/types/system";

type Range = 24 | 72 | 168;
const ranges: { id: Range; label: string }[] = [
  { id: 24, label: "24 h" },
  { id: 72, label: "3 jours" },
  { id: 168, label: "7 jours" },
];

const levelTone: Record<Level, "danger" | "warning" | "neutral"> = {
  danger: "danger",
  warning: "warning",
  info: "neutral",
};

function fmtBytes(n: number | null) {
  if (n === null) return "n/a";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const fmtMs = (n: number) => `${Math.round(n)} ms`;
const fmtInt = (n: number) => String(Math.round(n));

function Status({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            "inline-block size-2 rounded-full",
            ok ? "bg-success" : "bg-destructive",
          )}
        />
        {label}
      </span>
      <span className="text-xs text-muted-foreground">
        <span className="sr-only">{ok ? "OK, " : "Problème, "}</span>
        {detail}
      </span>
    </li>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export default function SystemPage() {
  const { user } = useAuth();
  const allowed = user?.role === "super_admin";

  const [hours, setHours] = useState<Range>(24);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<SystemOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pruning, setPruning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  // Load, and again whenever the range changes or "tick" is bumped (refresh, auto-refresh)
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    systemService
      .overview(hours)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, hours, tick]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!allowed) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [allowed]);

  const label = (at: number) => {
    const h = new Date(at).getHours();
    return hours <= 24 ? `${h}h` : `${fmtDay(at)} ${h}h`;
  };

  const requests = useMemo(
    () =>
      (data?.traffic.series ?? []).map((s) => ({
        label: label(s.at),
        value: s.requests,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, hours],
  );
  const failures = useMemo(
    () =>
      (data?.traffic.series ?? []).map((s) => ({
        label: label(s.at),
        value: s.errors,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, hours],
  );

  if (!allowed) {
    return (
      <EmptyState
        title="Accès refusé"
        text="Cette page est réservée au compte développeur."
      />
    );
  }

  if (!data) {
    return error ? <Alert>{error}</Alert> : <PageSkeleton />;
  }

  const { health, traffic, security, errors, storage, business } = data;
  const errorRate = traffic.total
    ? (traffic.serverErrors / traffic.total) * 100
    : 0;

  async function prune() {
    setPruning(true);
    setNotice(null);
    try {
      const r = await systemService.pruneImages();
      setNotice(`${r.deleted} fichier(s) supprimé(s).`);
      setTick((t) => t + 1);
    } catch (e) {
      setNotice(errorMessage(e));
    }
    setPruning(false);
  }

  return (
    <>
      <PageHeader
        title="Système"
        description={`Supervision du site. Mis à jour à ${fmtDateTime(data.generatedAt)}, rafraîchi toutes les 30 s.`}
        actions={
          <>
            <Segmented
              label="Période"
              value={hours}
              options={ranges}
              onChange={setHours}
            />
            <Button
              variant="outline"
              size="lg"
              onClick={() => setTick((t) => t + 1)}
            >
              <RefreshCw className="size-4" aria-hidden />
              Actualiser
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {/* Problems */}
      <Card>
        <CardHeader
          title="État général"
          description="Ce qui demande votre attention"
        />
        {data.problems.length === 0 ? (
          <Badge tone="success">Tout est opérationnel</Badge>
        ) : (
          <ul className="space-y-2.5">
            {data.problems.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Badge tone={levelTone[p.level]}>
                  {p.level === "danger"
                    ? "Critique"
                    : p.level === "warning"
                      ? "Attention"
                      : "Info"}
                </Badge>
                <span className="leading-snug">{p.message}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Traffic numbers */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Requêtes API"
          value={fmtInt(traffic.total)}
          hint={`${traffic.ok} réussies`}
        />
        <StatCard
          label="Erreurs serveur (5xx)"
          value={fmtInt(traffic.serverErrors)}
          hint={`${errorRate.toFixed(1)} % des requêtes`}
        />
        <StatCard
          label="Temps de réponse moyen"
          value={fmtMs(traffic.avgMs)}
          hint={`p95 : ${fmtMs(traffic.p95Ms)}`}
        />
        <StatCard
          label="Adresses IP distinctes"
          value={fmtInt(traffic.uniqueIps)}
          hint="derrière Next : le serveur compte pour 1"
        />
      </div>

      {/* Charts + health */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Requêtes par heure"
            description="Appels reçus par l'API Laravel"
          />
          <AreaChart data={requests} format={fmtInt} />
        </Card>

        <Card>
          <CardHeader title="Santé des services" />
          <ul className="space-y-3">
            <Status
              label="Base de données"
              ok={health.database.ok}
              detail={`${health.database.driver} · ${health.database.latencyMs} ms · ${fmtBytes(health.database.sizeBytes)}`}
            />
            <Status
              label="Cache"
              ok={health.cache.ok}
              detail={health.cache.driver}
            />
            <Status
              label="File d'attente"
              ok={health.queue.failed === 0}
              detail={`${health.queue.pending} en attente · ${health.queue.failed} en échec`}
            />
            <Status
              label="Stockage des photos"
              ok={health.disk.writable && health.disk.storageLinked}
              detail={`${fmtBytes(health.disk.freeBytes)} libres sur ${fmtBytes(health.disk.totalBytes)}`}
            />
          </ul>
          <dl className="mt-5 space-y-1.5 border-t border-border pt-4">
            <KeyValue
              label="Environnement"
              value={`${health.app.env}${health.app.debug ? " (debug)" : ""}`}
            />
            <KeyValue label="Laravel" value={health.app.laravel} />
            <KeyValue label="PHP" value={health.app.php} />
            <KeyValue label="Fuseau" value={health.app.timezone} />
          </dl>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Erreurs par heure"
            description="Réponses 5xx"
          />
          <AreaChart data={failures} format={fmtInt} height={200} />
        </Card>
        <Card>
          <CardHeader
            title="Routes les plus appelées"
            description="Sur la période"
          />
          <BarList
            items={traffic.topRoutes.map((r) => ({
              label: `${r.method} ${r.route.replace(/^api\//, "")}`,
              value: r.count,
              sub: `${fmtMs(r.avgMs)} en moyenne${r.errors ? ` · ${r.errors} erreur(s)` : ""}`,
            }))}
            format={fmtInt}
          />
        </Card>
        <Card>
          <CardHeader
            title="Routes les plus lentes"
            description="Temps moyen, 3 appels minimum"
          />
          <BarList
            items={traffic.slowest.map((r) => ({
              label: `${r.method} ${r.route.replace(/^api\//, "")}`,
              value: r.avgMs,
              sub: `${r.count} appels`,
            }))}
            format={fmtMs}
          />
        </Card>
      </div>

      {/* Security + storage */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Sécurité"
            description="Connexions à l'espace équipe sur la période"
          />
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard
              label="Connexions réussies"
              value={fmtInt(security.successfulLogins)}
            />
            <StatCard
              label="Échecs"
              value={fmtInt(security.failedLogins)}
              hint="mauvais mot de passe"
            />
            <StatCard
              label="Bloquées (429)"
              value={fmtInt(security.rateLimited)}
              hint="trop de tentatives"
            />
            <StatCard
              label="Accès refusés"
              value={fmtInt(security.adminDenied)}
              hint="API admin 401 / 403"
            />
          </div>
          {security.byIp.length > 0 && (
            <div className={cn(tableWrapCls, "mt-4")}>
              <table className={tableCls}>
                <thead>
                  <tr>
                    <th className={thCls}>Adresse IP</th>
                    <th className={thCls}>Tentatives refusées</th>
                    <th className={thCls}>Dernière</th>
                  </tr>
                </thead>
                <tbody>
                  {security.byIp.map((r) => (
                    <tr key={r.ip} className={trCls}>
                      <td className={`${tdCls} font-mono text-xs`}>{r.ip}</td>
                      <td className={`${tdCls} tabular-nums`}>{r.count}</td>
                      <td className={`${tdCls} text-muted-foreground`}>
                        {fmtDateTime(r.lastAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Photos"
            description="Fichiers du dossier products"
          />
          <dl className="space-y-1.5">
            <KeyValue label="Fichiers" value={fmtInt(storage.files)} />
            <KeyValue label="Taille" value={fmtBytes(storage.bytes)} />
            <KeyValue
              label="Orphelins"
              value={`${storage.orphans} (${fmtBytes(storage.orphanBytes)})`}
            />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Un fichier orphelin n&apos;est utilisé par aucun produit (envoi
            réussi, produit non enregistré). Seuls ceux de plus d&apos;une
            heure sont supprimés.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            size="lg"
            disabled={pruning || storage.orphans === 0}
            onClick={prune}
          >
            {pruning ? "Nettoyage..." : "Nettoyer les orphelins"}
          </Button>
          {notice && (
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              {notice}
            </p>
          )}
        </Card>
      </div>

      {/* Errors */}
      <Card className="mt-4">
        <CardHeader
          title="Erreurs serveur"
          description={`${errors.last24h} sur 24 h, ${errors.total} au total (30 jours conservés)`}
          action={
            errors.total > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setClearError(null);
                  setConfirmClear(true);
                }}
              >
                <Trash2 className="size-3.5" aria-hidden />
                Vider
              </Button>
            ) : undefined
          }
        />
        {errors.recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucune erreur enregistrée.
          </p>
        ) : (
          <div className={tableWrapCls}>
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Erreur</th>
                  <th className={thCls}>Requête</th>
                </tr>
              </thead>
              <tbody>
                {errors.recent.map((e) => (
                  <tr key={e.id} className={cn(trCls, "align-top")}>
                    <td
                      className={`${tdCls} whitespace-nowrap text-muted-foreground`}
                    >
                      {fmtDateTime(e.at)}
                    </td>
                    <td className={tdCls}>
                      <p className="font-medium">
                        {e.class.split("\\").pop()}
                      </p>
                      <p className="mt-0.5 break-words text-xs text-muted-foreground">
                        {e.message}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {e.location}
                      </p>
                      {e.trace && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs underline-offset-4 hover:underline">
                            Pile d&apos;appels
                          </summary>
                          <pre className="mt-1 overflow-x-auto rounded-md bg-accent p-2 font-mono text-[11px]">
                            {e.trace}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td
                      className={`${tdCls} font-mono text-xs text-muted-foreground`}
                    >
                      {e.method ? `${e.method} /${e.path}` : "console"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Business snapshot */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Produits actifs"
          value={`${business.activeProducts} / ${business.products}`}
          hint={`${business.categories} catégories`}
        />
        <StatCard label="Ruptures" value={fmtInt(business.outOfStock)} />
        <StatCard label="Stock bas" value={fmtInt(business.lowStock)} />
        <StatCard
          label="Ventes (24 h)"
          value={formatMAD(business.revenue24h)}
          hint={`${business.sales24h} vente(s), ${business.salesTotal} au total`}
        />
      </div>

      {/* Accounts */}
      <Card className="mt-4">
        <CardHeader
          title="Comptes"
          description="Dernière activité d'après les sessions ouvertes"
        />
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Nom</th>
                <th className={thCls}>Rôle</th>
                <th className={thCls}>Statut</th>
                <th className={thCls}>Sessions</th>
                <th className={thCls}>Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {data.team.map((m) => (
                <tr key={m.id} className={trCls}>
                  <td className={tdCls}>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {m.phone}
                    </p>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={m.role === "super_admin" ? "primary" : "neutral"}>
                      {m.role === "super_admin" ? "Super admin" : "Admin"}
                    </Badge>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={m.active ? "success" : "neutral"}>
                      {m.active ? "Actif" : "Désactivé"}
                    </Badge>
                  </td>
                  <td className={`${tdCls} tabular-nums`}>{m.sessions}</td>
                  <td className={`${tdCls} text-muted-foreground`}>
                    {m.lastSeen ? fmtDateTime(m.lastSeen) : "Jamais"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmClear}
        title="Vider les erreurs ?"
        message="Toutes les erreurs enregistrées seront supprimées. Les nouvelles continueront d'être enregistrées."
        confirmLabel="Vider"
        error={clearError}
        onClose={() => setConfirmClear(false)}
        onConfirm={async () => {
          try {
            await systemService.clearErrors();
            setConfirmClear(false);
            setTick((t) => t + 1);
          } catch (e) {
            setClearError(errorMessage(e));
          }
        }}
      />
    </>
  );
}