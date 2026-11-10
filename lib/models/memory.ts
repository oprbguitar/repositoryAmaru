// Memory and package-size estimates. These are ESTIMATES, always labelled as
// such in the UI: bytes = parameters × bits-per-weight / 8, plus a fixed
// overhead for the context window and runtime buffers.

export type QuantizationPreset = {
  id: string;
  label: string;
  /** Approximate effective bits per weight (llama.cpp published averages). */
  bitsPerWeight: number;
};

export const QUANTIZATION_PRESETS: QuantizationPreset[] = [
  { id: "Q4_K_M", label: "Q4_K_M (4 bits)", bitsPerWeight: 4.85 },
  { id: "Q5_K_M", label: "Q5_K_M (5 bits)", bitsPerWeight: 5.7 },
  { id: "Q6_K", label: "Q6_K (6 bits)", bitsPerWeight: 6.6 },
  { id: "Q8_0", label: "Q8_0 (8 bits)", bitsPerWeight: 8.5 },
  { id: "F16", label: "F16 (sin cuantizar)", bitsPerWeight: 16 },
];

/** Default preset used for size/compatibility filters. */
export const DEFAULT_QUANTIZATION = QUANTIZATION_PRESETS[0];

/** Runtime overhead applied on top of the weights (context + buffers). */
export const MEMORY_OVERHEAD = 1.2;

export const BYTES_PER_GB = 1024 ** 3;

export function estimateWeightBytes(
  parameters: number | null | undefined,
  bitsPerWeight: number = DEFAULT_QUANTIZATION.bitsPerWeight,
): number | null {
  if (
    typeof parameters !== "number" ||
    !Number.isFinite(parameters) ||
    parameters <= 0
  )
    return null;
  return Math.round((parameters * bitsPerWeight) / 8);
}

export function estimateMemoryBytes(
  parameters: number | null | undefined,
  bitsPerWeight: number = DEFAULT_QUANTIZATION.bitsPerWeight,
): number | null {
  const weights = estimateWeightBytes(parameters, bitsPerWeight);
  return weights === null ? null : Math.round(weights * MEMORY_OVERHEAD);
}

export function bytesToGb(bytes: number | null | undefined): number | null {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) return null;
  return bytes / BYTES_PER_GB;
}

export type MemoryEstimateRow = {
  preset: QuantizationPreset;
  weightBytes: number;
  memoryBytes: number;
};

export function memoryTable(
  parameters: number | null | undefined,
): MemoryEstimateRow[] {
  const rows: MemoryEstimateRow[] = [];
  for (const preset of QUANTIZATION_PRESETS) {
    const weightBytes = estimateWeightBytes(parameters, preset.bitsPerWeight);
    const memoryBytes = estimateMemoryBytes(parameters, preset.bitsPerWeight);
    if (weightBytes === null || memoryBytes === null) continue;
    rows.push({ preset, weightBytes, memoryBytes });
  }
  return rows;
}

export const MEMORY_FORMULA =
  "memoria ≈ parámetros × bits por peso ÷ 8 × 1,2 (20 % adicional para contexto y búferes de ejecución)";
