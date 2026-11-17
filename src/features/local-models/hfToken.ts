/**
 * The user's own Hugging Face read token, needed for gated repositories
 * (Meta Llama, Gemma, some Mistral…). It stays in THIS browser only
 * (localStorage), is sent only to huggingface.co, and never reaches AMARU's
 * server. The user types it; the app never creates or fetches tokens.
 */
import { useSyncExternalStore } from "react";

const KEY = "amaru-hf-token-v1";
const EVENT = "amaru-hf-token-change";

let cache: string | null | undefined;

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function getHfToken(): string | null {
  if (cache === undefined) cache = read();
  return cache;
}

/** Accepts only the documented `hf_…` shape so typos are caught early. */
export function isHfToken(value: string): boolean {
  return /^hf_[A-Za-z0-9]{20,}$/.test(value.trim());
}

export function setHfToken(value: string | null) {
  cache = value?.trim() || null;
  try {
    if (cache) localStorage.setItem(KEY, cache);
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode: keep it for this tab only.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Headers for huggingface.co requests; empty without a token. */
export function hfAuthHeaders(): Record<string, string> {
  const token = getHfToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cache = read();
      listener();
    }
  };
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useHfToken(): string | null {
  return useSyncExternalStore(subscribe, getHfToken, () => null);
}
