/**
 * Personal favorites (models, GitHub repos, guide models) kept in the
 * browser. Shared store so every module sees the same stars.
 */
import { useSyncExternalStore } from "react";

export type FavoriteKind = "model" | "repo" | "guide";
export type Favorite = {
  kind: FavoriteKind;
  id: string;
  label: string;
  url: string | null;
  savedAt: string;
};

const KEY = "amaru.favorites.v1";
const listeners = new Set<() => void>();

function load(): Favorite[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

let items: Favorite[] = typeof localStorage === "undefined" ? [] : load();

function persist(next: Favorite[]) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: keep favorites for this session only.
  }
  for (const listener of listeners) listener();
}

export function isFavorite(kind: FavoriteKind, id: string): boolean {
  return items.some((f) => f.kind === kind && f.id === id);
}

export function toggleFavorite(entry: Omit<Favorite, "savedAt">): void {
  persist(
    isFavorite(entry.kind, entry.id)
      ? items.filter((f) => !(f.kind === entry.kind && f.id === entry.id))
      : [...items, { ...entry, savedAt: new Date().toISOString() }],
  );
}

export function useFavorites(): Favorite[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => items,
    () => items,
  );
}
