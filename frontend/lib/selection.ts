"use client";

import { useSyncExternalStore } from "react";

const KEY = "bamed.selection.v1";
const MAX_ITEMS = 30;

export type SelectedItem = {
  /** productId::colour name */
  key: string;
  id: string;
  name: string;
  brand?: string;
  color: string;
  hex: string;
  price: number;
  /** Sizes the product offers, so the panel can ask for one */
  sizes: string[];
  size?: string;
};

const EMPTY: SelectedItem[] = [];
let cache: SelectedItem[] | null = null;
const listeners = new Set<() => void>();

export const itemKey = (id: string, color: string) => `${id}::${color}`;

function valid(i: unknown): i is SelectedItem {
  if (!i || typeof i !== "object") return false;
  const r = i as Record<string, unknown>;
  return (
    typeof r.key === "string" &&
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    typeof r.color === "string" &&
    typeof r.hex === "string" &&
    typeof r.price === "number" &&
    Array.isArray(r.sizes)
  );
}

function read(): SelectedItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    const list = parsed.filter(valid).slice(0, MAX_ITEMS);
    return list.length ? list : EMPTY;
  } catch {
    return EMPTY;
  }
}

function snapshot() {
  if (cache === null) cache = read();
  return cache;
}

function commit(next: SelectedItem[]) {
  cache = next.length ? next : EMPTY;
  try {
    if (next.length) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the selection lives until the page closes */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Another tab changed the selection
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSelection(): SelectedItem[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function toggleItem(item: Omit<SelectedItem, "size">) {
  const list = snapshot();
  if (list.some((i) => i.key === item.key)) {
    commit(list.filter((i) => i.key !== item.key));
  } else if (list.length < MAX_ITEMS) {
    commit([...list, item]);
  }
}

export function removeItem(key: string) {
  commit(snapshot().filter((i) => i.key !== key));
}

export function setItemSize(key: string, size: string | undefined) {
  commit(snapshot().map((i) => (i.key === key ? { ...i, size } : i)));
}

export function clearSelection() {
  commit([]);
}