"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Trash2, X } from "lucide-react";
import { formatMAD } from "@/lib/products";
import {
  clearSelection,
  closeSelection,
  removeItem,
  setItemSize,
  useSelection,
  useSelectionOpen,
} from "@/lib/selection";
import { whatsappNumbers, whatsappUrl } from "@/lib/whatsapp";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** True from the "sm" breakpoint up: the panel then slides from the right instead of the bottom. */
function useIsWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 640px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 640px)").matches,
    () => false,
  );
}

export function SelectionBar() {
  const pathname = usePathname();
  const items = useSelection();
  const open = useSelectionOpen();
  const wide = useIsWide();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  const total = items.reduce((s, i) => s + i.price, 0);
  const canSend = whatsappNumbers().length > 0;

  function send() {
    const url = whatsappUrl(items);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  const hidden = wide ? { x: "100%" } : { y: "100%" };
  const shown = wide ? { x: 0 } : { y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60">
          <motion.button
            type="button"
            aria-label="Fermer ma sélection"
            onClick={closeSelection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 cursor-default bg-black/50"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Ma sélection"
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={{ duration: 0.45, ease }}
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-xl bg-background sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none"
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <p className="font-display text-3xl font-bold uppercase leading-none">
                Ma sélection
              </p>
              <button
                type="button"
                onClick={closeSelection}
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
                <AnimatePresence initial={false}>
                  {items.map((i) => (
                    <motion.li
                      key={i.key}
                      layout
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.3, ease }}
                      className="py-4"
                    >
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
                    </motion.li>
                  ))}
                </AnimatePresence>
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
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="size-5 fill-current"
                  >
                    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.43 0 .04 5.39.04 12c0 2.12.55 4.2 1.6 6.02L0 24l6.12-1.57A11.96 11.96 0 0 0 12.04 24c6.61 0 12-5.39 12-12 0-3.2-1.25-6.22-3.52-8.52ZM12.04 21.8c-1.9 0-3.76-.5-5.4-1.45l-.39-.23-3.64.94 1-3.52-.25-.38A9.8 9.8 0 0 1 2.2 12c0-5.42 4.42-9.84 9.84-9.84 2.62 0 5.08 1.02 6.94 2.87a9.82 9.82 0 0 1 2.87 6.97c0 5.42-4.42 9.84-9.84 9.84Zm5.43-7.38c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.18.2-.35.22-.65.08-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.8-1.68-2.1-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.53.08-.8.38-.27.3-1.02 1-1.02 2.45s1.05 2.84 1.2 3.04c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.27-.2-.57-.35Z" />
                  </svg>
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
                    closeSelection();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Vider ma sélection
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}