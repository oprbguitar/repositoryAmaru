/**
 * "Analizar mi equipo": reads what the browser exposes (only after explicit
 * consent) and turns it into an editable hardware profile. Browsers hide the
 * real RAM and VRAM, so every detected value is a starting point the user
 * corrects, never a measurement.
 */
import type { HardwareProfile } from "./compat";

/** `navigator.deviceMemory` is rounded and capped at 8 GiB by the spec. */
export const DEVICE_MEMORY_CAP_GIB = 8;

export type RawHardware = {
  cores: number | null;
  deviceMemory: number | null;
  webgpu: "unsupported" | "no-adapter" | "available";
  gpu: {
    vendor: string;
    architecture: string;
    description: string;
  } | null;
  /** Largest buffer the adapter allows, a weak lower bound for its memory. */
  maxBufferBytes: number | null;
};

export type HardwareReport = RawHardware & {
  /** RAM suggested for the editable field. */
  suggestedRamGib: number | null;
  /** True when deviceMemory hit the cap, so real RAM is probably higher. */
  ramCapped: boolean;
  notes: string[];
};

export function buildHardwareReport(raw: RawHardware): HardwareReport {
  const notes: string[] = [];
  const ramCapped =
    raw.deviceMemory !== null && raw.deviceMemory >= DEVICE_MEMORY_CAP_GIB;
  if (raw.deviceMemory === null)
    notes.push(
      "Tu navegador no informa la memoria. Escribe tu RAM a mano (Administrador de tareas → Rendimiento → Memoria).",
    );
  else if (ramCapped)
    notes.push(
      `El navegador limita el dato a ${DEVICE_MEMORY_CAP_GIB} GB por privacidad: si tu equipo tiene más, corrígelo.`,
    );
  else
    notes.push(
      "La memoria informada por el navegador es aproximada (redondeada a potencias de 2).",
    );
  if (raw.webgpu === "unsupported")
    notes.push(
      "WebGPU no está disponible: no se puede identificar la GPU. Indica la VRAM si tienes GPU dedicada.",
    );
  else if (raw.webgpu === "no-adapter")
    notes.push("WebGPU existe pero no devolvió ningún adaptador gráfico.");
  else
    notes.push(
      "WebGPU identifica la GPU pero no su memoria: escribe la VRAM de tu tarjeta (0 si es integrada).",
    );
  return {
    ...raw,
    suggestedRamGib: raw.deviceMemory,
    ramCapped,
    notes,
  };
}

/** Parses a user-typed GiB value; empty or invalid → null. */
export function parseGib(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 4096) return null;
  return parsed;
}

export function toProfile(ram: string, vram: string): HardwareProfile {
  return { ramGib: parseGib(ram), vramGib: parseGib(vram) };
}

type GpuAdapterLike = {
  info?: { vendor?: string; architecture?: string; description?: string };
  limits?: { maxBufferSize?: number };
};

/** Browser-only. Call only after the user consents. */
export async function detectHardware(): Promise<RawHardware> {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    gpu?: { requestAdapter: () => Promise<GpuAdapterLike | null> };
  };
  let webgpu: RawHardware["webgpu"] = "unsupported";
  let gpu: RawHardware["gpu"] = null;
  let maxBufferBytes: number | null = null;
  if (nav.gpu) {
    try {
      const adapter = await nav.gpu.requestAdapter();
      if (adapter) {
        webgpu = "available";
        gpu = {
          vendor: adapter.info?.vendor || "sin dato",
          architecture: adapter.info?.architecture || "sin dato",
          description: adapter.info?.description || "",
        };
        maxBufferBytes = adapter.limits?.maxBufferSize ?? null;
      } else webgpu = "no-adapter";
    } catch {
      webgpu = "no-adapter";
    }
  }
  return {
    cores: nav.hardwareConcurrency || null,
    deviceMemory:
      typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    webgpu,
    gpu,
    maxBufferBytes,
  };
}
