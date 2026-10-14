"use client";

import { useEffect, useId, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CircleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtPct } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

/* ---------- Shared class names ---------- */

export const inputCls =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:opacity-50";
export const tableWrapCls =
  "overflow-x-auto rounded-xl border border-border bg-card";
export const tableCls = "w-full min-w-[640px] text-left text-sm";
export const thCls = "px-4 py-3 text-xs font-medium text-muted-foreground";
export const trCls = "border-t border-border transition-colors hover:bg-accent/40";
export const tdCls = "px-4 py-3 align-middle";

/* ---------- Layout ---------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.6px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-5", className)}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  /** Percent change vs the previous period (null = no comparison) */
  delta?: number | null;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {delta !== undefined && delta !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular-nums",
              delta >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {delta >= 0 ? (
              <ArrowUpRight className="size-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden />
            )}
            {fmtPct(delta)}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="h-8 w-56 rounded-md bg-accent" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-card" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-card" />
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <p className="text-base font-semibold">{title}</p>
      {text && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {text}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Small pieces ---------- */

const tones = {
  neutral: "bg-accent text-muted-foreground",
  primary: "bg-primary/15 text-gold",
  success: "bg-success/15 text-success",
  warning: "bg-amber-400/15 text-amber-300",
  danger: "bg-destructive/15 text-destructive",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-full border border-border bg-card p-0.5"
    >
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-7 rounded-full px-3 text-xs font-medium transition-colors",
            o.id === value
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ---------- Modal ---------- */

const modalSizes = { md: "max-w-lg", xl: "max-w-4xl" } as const;

export function Modal({
  open,
  title,
  onClose,
  size = "md",
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  size?: keyof typeof modalSizes;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[92dvh] w-full ${modalSizes[size]} flex-col rounded-t-xl border border-border bg-popover sm:rounded-xl`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function FormActions({
  submitLabel,
  onCancel,
}: {
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <Button type="button" variant="outline" size="lg" onClick={onCancel}>
        Annuler
      </Button>
      <Button type="submit" size="lg">
        {submitLabel}
      </Button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Supprimer",
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{message}</p>
      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" size="lg" onClick={onClose}>
          Annuler
        </Button>
        <Button type="button" variant="destructive" size="lg" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}