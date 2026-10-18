"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Heart, MessageCircle, Trash2, X } from "lucide-react";
import { formatMAD } from "@/lib/products";
import {
  clearSelection,
  removeItem,
  setItemSize,
  useSelection,
} from "@/lib/selection";
import { whatsappNumbers, whatsappUrl } from "@/lib/whatsapp";

export function SelectionBar() {
  const pathname = usePathname();
  const items = useSelection();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pathname.startsWith("/admin")) return null;
  if (items.length === 0 && !open) return null;

  const total = items.reduce((s, i) => s + i.price, 0);
  const canSend = whatsappNumbers().length > 0;

  function send() {
    const url = whatsappUrl(items);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto inline-flex h-12 items-center gap-3 rounded-full bg-foreground pl-4 pr-5 text-sm font-semibold text-background shadow-[0_10px_30px_rgb(0_0_0/0.3)] transition-transform active:scale-95"
        >
          <Heart className="size-4 fill-current" aria-hidden />
          Ma sélection
          <span className="flex size-6 items-center justify-center rounded-full bg-gold text-xs text-gold-foreground">
            {items.length}
          </span>
          <span className="hidden tabular-nums opacity-70 sm:inline">
            {formatMAD(total)}
          </span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-60">
          <button
            type="button"
            aria-label="Fermer ma sélection"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ma sélection"
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-xl bg-background sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none"
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <p className="font-display text-3xl font-bold uppercase leading-none">
                Ma sélection
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="flex size-11 items-center justify-center rounded-md hover:bg-muted"
              >
                <X className="size-6" aria-hidden />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="px-6 py-10 text-sm text-muted-foreground">
                Votre sélection est vide. Appuyez sur le cœur d&apos;un article
                pour l&apos;ajouter.
              </p>
            ) : (
              <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
                {items.map((i) => (
                  <li key={i.key} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {i.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            aria-hidden
                            className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.4)]"
                            style={{ backgroundColor: i.hex }}
                          />
                          {i.brand ? `${i.brand} · ` : ""}
                          {i.color}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatMAD(i.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(i.key)}
                          aria-label={`Retirer ${i.name}`}
                          className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </div>
                    </div>

                    {i.sizes.length > 0 && (
                      <div
                        role="group"
                        aria-label={`Taille pour ${i.name}`}
                        className="mt-3 flex flex-wrap gap-1.5"
                      >
                        {i.sizes.map((s) => {
                          const on = i.size === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              aria-pressed={on}
                              onClick={() =>
                                setItemSize(i.key, on ? undefined : s)
                              }
                              className={
                                on
                                  ? "h-8 min-w-9 rounded-md bg-foreground px-2.5 text-xs font-semibold text-background"
                                  : "h-8 min-w-9 rounded-md bg-muted px-2.5 text-xs font-semibold hover:bg-foreground/10"
                              }
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {items.length > 0 && (
              <div className="border-t border-border px-6 pb-6 pt-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Total indicatif
                  </p>
                  <p className="font-display text-3xl font-bold tabular-nums">
                    {formatMAD(total)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={send}
                  disabled={!canSend}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gold text-base font-semibold text-gold-foreground transition-colors hover:bg-gold/90 disabled:opacity-50"
                >
                  <MessageCircle className="size-5" aria-hidden />
                  Vérifier sur WhatsApp
                </button>
                {!canSend && (
                  <p className="mt-2 text-xs text-destructive">
                    Numéro WhatsApp non configuré.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Un message est préparé pour vous : vous pouvez le modifier
                  avant de l&apos;envoyer.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearSelection();
                    setOpen(false);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Vider ma sélection
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}