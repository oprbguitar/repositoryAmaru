/**
 * Shared, persisted hardware profile ("Mi PC"). Detection only runs when the
 * user presses the button; the result stays in this browser (localStorage)
 * and is never sent to the server. RAM/VRAM remain editable because browsers
 * cap or hide the real values.
 */
import { useCallback, useSyncExternalStore } from "react";
import {
  type GpuVendor,
  gpuVendorFrom,
  type Platform,
  platformFrom,
} from "../../../lib/models/runtime";
import { buildHardwareReport, detectHardware } from "./hardware";

export type StoredHardware = {
  platform: Platform | null;
  cores: number | null;
  gpuVendor: GpuVendor | null;
  gpuName: string | null;
  ramGib: number | null;
  vramGib: number | null;
  ramCapped: boolean;
  notes: string[];
  detectedAt: string;
};

const KEY = "amaru-hardware-v1";
const EVENT = "amaru-hardware-change";

function read(): StoredHardware | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredHardware) : null;
  } catch {
    return null;
  }
}

let cache: StoredHardware | null | undefined;
function snapshot(): StoredHardware | null {
  if (cache === undefined) cache = read();
  return cache;
}

function write(value: StoredHardware | null) {
  cache = value;
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode: keep the in-memory copy only.
  }
  window.dispatchEvent(new Event(EVENT));
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

export async function detectMyPc(): Promise<StoredHardware> {
  const raw = await detectHardware();
  const report = buildHardwareReport(raw);
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = platformFrom(
    navigator.userAgent,
    nav.userAgentData?.platform,
  );
  const gpuVendor = gpuVendorFrom(raw.gpu?.vendor);
  const previous = snapshot();
  const ramGib = previous?.ramGib ?? report.suggestedRamGib;
  // Apple GPUs share system memory; ~2/3 of it is usable by the GPU.
  const vramGib =
    previous?.vramGib ??
    (gpuVendor === "apple" && ramGib ? Math.round(ramGib * 0.66) : null);
  const value: StoredHardware = {
    platform,
    cores: raw.cores,
    gpuVendor,
    gpuName: raw.gpu?.description || raw.gpu?.architecture || null,
    ramGib,
    vramGib,
    ramCapped: report.ramCapped,
    notes: report.notes,
    detectedAt: new Date().toISOString(),
  };
  write(value);
  return value;
}

export function useHardwareProfile() {
  const profile = useSyncExternalStore(subscribe, snapshot, () => null);
  const update = useCallback((patch: Partial<StoredHardware>) => {
    const current = snapshot();
    if (!current) return;
    write({ ...current, ...patch });
  }, []);
  const forget = useCallback(() => write(null), []);
  return { profile, update, forget };
}
