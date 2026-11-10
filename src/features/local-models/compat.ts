/**
 * Hardware compatibility estimate. File size is NOT memory: running a model
 * needs the quantized weights, plus a KV cache that grows with the context
 * window, plus runtime overhead. Everything here is an estimate and the UI
 * must present it as such.
 */
import { GIB } from "./profiles";

export type HardwareProfile = {
  /** Usable system RAM in GiB, as corrected by the user when possible. */
  ramGib: number | null;
  /** Dedicated or unified GPU memory in GiB; `null` when unknown or absent. */
  vramGib: number | null;
};

export type ModelMemoryInput = {
  /** Size on disk of the quantized weight files. */
  weightBytes: number;
  /** Parameter count; estimated from size and quantization when unknown. */
  parameters: number | null;
  /** Context window to evaluate, in tokens. */
  contextTokens: number;
  /** Only GGUF and safetensors text models are runnable by local runtimes. */
  runnableFormat: boolean;
};

export type MemoryEstimate = {
  weightBytes: number;
  kvCacheBytes: number;
  overheadBytes: number;
  totalBytes: number;
  /** True when the KV cache came from a parameter-count heuristic. */
  kvIsHeuristic: boolean;
};

export type CompatLevel = "compatible" | "limited" | "storage-only" | "unknown";

export type CompatResult = {
  level: CompatLevel;
  label: string;
  reason: string;
  estimate: MemoryEstimate;
  /** Where the model would run according to the rule. */
  target: "gpu" | "cpu" | "hybrid" | "none";
};

export const COMPAT_LABELS: Record<CompatLevel, string> = {
  compatible: "Compatible",
  limited: "Compatible con limitaciones",
  "storage-only": "Solo almacenamiento",
  unknown: "Sin evaluar",
};

export const DEFAULT_CONTEXT = 4096;
export const MIN_CONTEXT = 2048;

const FIXED_OVERHEAD_BYTES = 0.5 * GIB;
const OVERHEAD_RATIO = 0.1;
/** Share of VRAM we allow a model to take; the rest is for the desktop. */
const VRAM_USABLE = 0.9;

/**
 * KV cache bytes per context token.
 *
 * Exact value: 2 (K and V) × layers × kv_dim × 2 bytes (f16). Without the
 * architecture we approximate a standard transformer where
 * params ≈ 12 × layers × dim² and dim ≈ 128 × layers, and assume grouped-query
 * attention keeps half of the dimension in the cache. That lands between
 * classic attention (e.g. Llama 2 7B ≈ 512 KiB/token) and aggressive GQA
 * (Llama 3 8B ≈ 128 KiB/token), so the figure is deliberately conservative.
 */
export function kvBytesPerToken(parameters: number): number {
  const layers = Math.max(1, Math.cbrt(parameters / (12 * 128 * 128)));
  const dim = 128 * layers;
  return 2 * layers * (dim / 2) * 2;
}

export function estimateMemory(input: ModelMemoryInput): MemoryEstimate {
  const kvCacheBytes = input.parameters
    ? Math.round(kvBytesPerToken(input.parameters) * input.contextTokens)
    : 0;
  const overheadBytes = Math.round(
    FIXED_OVERHEAD_BYTES + input.weightBytes * OVERHEAD_RATIO,
  );
  return {
    weightBytes: input.weightBytes,
    kvCacheBytes,
    overheadBytes,
    totalBytes: input.weightBytes + kvCacheBytes + overheadBytes,
    kvIsHeuristic: true,
  };
}

/** RAM left for a model after reserving room for the OS and the browser. */
export function usableRamBytes(ramGib: number): number {
  const reserve = Math.max(2, ramGib * 0.25);
  return Math.max(0, ramGib - reserve) * GIB;
}

/**
 * Classification rule (documented in the UI):
 * 1. fits in 90 % of VRAM                         → Compatible (GPU)
 * 2. fits in half of the usable RAM               → Compatible (CPU, slower)
 * 3. fits in usable RAM + VRAM                    → Limited (CPU or hybrid)
 * 4. fits only with the minimum context (2048)    → Limited (reduce context)
 * 5. otherwise                                    → Storage only
 */
export function classifyCompatibility(
  input: ModelMemoryInput,
  hardware: HardwareProfile,
): CompatResult {
  const estimate = estimateMemory(input);
  if (!input.runnableFormat)
    return {
      level: "storage-only",
      label: COMPAT_LABELS["storage-only"],
      reason:
        "El formato publicado no es ejecutable por Ollama ni LM Studio; solo puede guardarse.",
      estimate,
      target: "none",
    };
  if (hardware.ramGib === null && hardware.vramGib === null)
    return {
      level: "unknown",
      label: COMPAT_LABELS.unknown,
      reason:
        "Falta el perfil de tu equipo. Analízalo o introduce tu RAM y VRAM para clasificar.",
      estimate,
      target: "none",
    };
  const need = estimate.totalBytes;
  const vram = (hardware.vramGib ?? 0) * GIB * VRAM_USABLE;
  const ram = hardware.ramGib !== null ? usableRamBytes(hardware.ramGib) : 0;
  if (vram > 0 && need <= vram)
    return {
      level: "compatible",
      label: COMPAT_LABELS.compatible,
      reason: "Cabe completo en la memoria de la GPU con el contexto indicado.",
      estimate,
      target: "gpu",
    };
  if (ram > 0 && need <= ram * 0.5)
    return {
      level: "compatible",
      label: COMPAT_LABELS.compatible,
      reason:
        "Cabe con holgura en la RAM. Se ejecutará en CPU, más lento que en GPU.",
      estimate,
      target: "cpu",
    };
  if (need <= ram + vram)
    return {
      level: "limited",
      label: COMPAT_LABELS.limited,
      reason:
        vram > 0
          ? "No cabe entero en la GPU: se repartirá entre GPU y RAM, con menor velocidad."
          : "Ocupa más de la mitad de la RAM utilizable: funcionará en CPU con poco margen.",
      estimate,
      target: vram > 0 ? "hybrid" : "cpu",
    };
  if (input.contextTokens > MIN_CONTEXT) {
    const reduced = estimateMemory({ ...input, contextTokens: MIN_CONTEXT });
    if (reduced.totalBytes <= ram + vram)
      return {
        level: "limited",
        label: COMPAT_LABELS.limited,
        reason: `Solo cabe reduciendo el contexto a ${MIN_CONTEXT} tokens.`,
        estimate,
        target: vram > 0 ? "hybrid" : "cpu",
      };
  }
  return {
    level: "storage-only",
    label: COMPAT_LABELS["storage-only"],
    reason:
      "La memoria estimada supera la de tu equipo. Puedes guardarlo, pero no ejecutarlo aquí.",
    estimate,
    target: "none",
  };
}
