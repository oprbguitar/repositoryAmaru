import { useSyncExternalStore } from "react";
import type { CategoryId } from "./catalog";

/** Personal prompt history, kept only in this browser (localStorage). */
export type HistoryEntry = {
  id: string;
  title: string;
  category: CategoryId;
  text: string;
  createdAt: string;
  origin: "manual" | "generador" | "cadena";
};

const KEY = "amaru.prompts.history.v1";
const MAX_ENTRIES = 200;
const listeners = new Set<() => void>();
let cache: HistoryEntry[] | null = null;

function read(): HistoryEntry[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(entries: HistoryEntry[]) {
  cache = entries.slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked: the entry lives until the tab closes.
  }
  for (const listener of listeners) listener();
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "createdAt">) {
  write([
    { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ...read(),
  ]);
}

export function removeHistory(id: string) {
  write(read().filter((entry) => entry.id !== id));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHistory() {
  return useSyncExternalStore(subscribe, read, () => []);
}
