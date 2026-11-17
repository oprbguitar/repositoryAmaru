/**
 * Crosses a model's packages with the user's hardware profile using the same
 * memory rule as "Open y local" (compat.ts). Real file sizes win over the
 * parameter-based estimate whenever the repository publishes them.
 */
import type { FormatPackage, HubModel } from "../../../lib/models/hub";
import {
  estimateWeightBytes,
  QUANTIZATION_PRESETS,
} from "../../../lib/models/memory";
import {
  type CompatResult,
  classifyCompatibility,
  DEFAULT_CONTEXT,
  type HardwareProfile,
} from "../local-models/compat";

export type FitOption = {
  label: string;
  bytes: number;
  /** Actual file name when the repository publishes it. */
  fileName: string | null;
  measured: boolean;
  bits: number | null;
  result: CompatResult;
};

const BITS: Array<[RegExp, number]> = [
  [/^(F32|FP32)/, 32],
  [/^(F16|BF16|FP16)/, 16],
  [/^Q8/, 8],
  [/^Q6/, 6],
  [/^Q5/, 5],
  [/^(Q4|IQ4)/, 4],
  [/^(Q3|IQ3)/, 3],
  [/^(Q2|IQ2|IQ1|TQ)/, 2],
];

export function bitsOf(label: string): number | null {
  const clean = label.replace(/^UD-/, "");
  return BITS.find(([pattern]) => pattern.test(clean))?.[1] ?? null;
}

/** Options to evaluate: real GGUF variants, else the estimate table. */
export function fitOptions(
  model: HubModel,
  packages: FormatPackage[] | null,
  hardware: HardwareProfile,
  contextTokens = DEFAULT_CONTEXT,
): FitOption[] {
  const gguf = packages?.find((p) => p.format === "gguf");
  const options: Omit<FitOption, "result">[] = [];
  if (gguf?.variants.length) {
    for (const v of gguf.variants) {
      if (v.label === "mmproj" || v.label === "sin etiqueta") continue;
      options.push({
        label: v.label,
        bytes: v.bytes,
        fileName: v.fileName,
        measured: true,
        bits: bitsOf(v.label),
      });
    }
  } else {
    for (const preset of QUANTIZATION_PRESETS) {
      const bytes = estimateWeightBytes(model.parameters, preset.bitsPerWeight);
      if (bytes === null) continue;
      options.push({
        label: preset.id,
        bytes,
        fileName: null,
        measured: false,
        bits: bitsOf(preset.id),
      });
    }
  }
  return options.map((option) => ({
    ...option,
    result: classifyCompatibility(
      {
        weightBytes: option.bytes,
        parameters: model.parameters,
        contextTokens,
        runnableFormat: true,
      },
      hardware,
    ),
  }));
}

/**
 * Highest-quality option that is fully compatible, capped at 8 bits (beyond
 * that quality gains are imperceptible); else the lightest "limited" one.
 */
export function recommendOption(options: FitOption[]): FitOption | null {
  const compatible = options
    .filter((o) => o.result.level === "compatible" && (o.bits ?? 4) <= 8)
    .sort((a, b) => {
      const gpu = (o: FitOption) => (o.result.target === "gpu" ? 1 : 0);
      return (
        gpu(b) - gpu(a) || (b.bits ?? 0) - (a.bits ?? 0) || b.bytes - a.bytes
      );
    });
  if (compatible.length) {
    // Prefer ≥4 bits: below that quality drops noticeably.
    return compatible.find((o) => (o.bits ?? 4) >= 4) ?? compatible[0];
  }
  const limited = options
    .filter((o) => o.result.level === "limited")
    .sort((a, b) => a.bytes - b.bytes);
  return limited[0] ?? null;
}

/** Whether a list record (estimated Q4 size) would run on this hardware. */
export function quickFit(
  model: HubModel,
  hardware: HardwareProfile,
): CompatResult | null {
  if (model.estimatedPackageBytes === null) return null;
  return classifyCompatibility(
    {
      weightBytes: model.estimatedPackageBytes,
      parameters: model.parameters,
      contextTokens: DEFAULT_CONTEXT,
      runnableFormat: true,
    },
    hardware,
  );
}
