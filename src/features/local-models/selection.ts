/**
 * Pure selection logic: from the full file listing of a Hugging Face repo,
 * pick the MINIMUM usable package instead of every published variant.
 */

export type RepoFile = {
  path: string;
  size: number;
  /** SHA-256 of the content; Hugging Face publishes it only for LFS files. */
  sha256: string | null;
  /** Git blob id (SHA-1 of "blob <size>\0<content>") for regular files. */
  gitOid: string | null;
};

export type FileRole = "weights" | "config" | "tokenizer" | "docs";

export type PackageFile = RepoFile & { role: FileRole };

export type ModelFormat = "gguf" | "safetensors";

export type GgufVariant = {
  /** Quantization label in upper case (Q4_K_M) or the file name when unlabeled. */
  id: string;
  files: RepoFile[];
  bytes: number;
  /** Approximate bits per weight for known quantizations; `null` when unknown. */
  bitsPerWeight: number | null;
  split: boolean;
};

export type ModelPackage = {
  format: ModelFormat;
  variant: string | null;
  files: PackageFile[];
  totalBytes: number;
  weightBytes: number;
};

/**
 * Approximate bits per weight of llama.cpp quantizations (weights only).
 * Source: llama.cpp `quantize` documentation; real files vary by a few percent.
 */
export const BITS_PER_WEIGHT: Record<string, number> = {
  Q2_K: 3.35,
  Q2_K_L: 3.6,
  IQ2_XXS: 2.06,
  IQ2_XS: 2.31,
  IQ2_S: 2.5,
  IQ2_M: 2.7,
  IQ3_XXS: 3.06,
  IQ3_XS: 3.3,
  IQ3_S: 3.44,
  IQ3_M: 3.66,
  Q3_K_S: 3.5,
  Q3_K_M: 3.91,
  Q3_K_L: 4.27,
  Q3_K_XL: 4.4,
  IQ4_XS: 4.25,
  IQ4_NL: 4.5,
  Q4_0: 4.55,
  Q4_1: 5.0,
  Q4_K_S: 4.58,
  Q4_K_M: 4.85,
  Q4_K_L: 5.0,
  Q4_K: 4.85,
  Q5_0: 5.54,
  Q5_1: 6.0,
  Q5_K_S: 5.54,
  Q5_K_M: 5.69,
  Q5_K_L: 5.9,
  Q5_K: 5.69,
  Q6_K: 6.59,
  Q6_K_L: 6.8,
  Q8_0: 8.5,
  F16: 16,
  FP16: 16,
  BF16: 16,
  F32: 32,
  FP32: 32,
};

const SPLIT_SUFFIX = /-(\d{5})-of-(\d{5})$/i;
const QUANT_PATTERN =
  /(?:^|[-._])((?:i?q\d+(?:_[a-z0-9]+)*)|bf16|fp16|fp32|f16|f32)(?=$|[-._])/gi;

function baseName(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? path : path.slice(index + 1);
}

function isRootFile(path: string): boolean {
  return !path.includes("/");
}

/** Parses the Hugging Face `/api/models/{id}/tree/{rev}` payload. */
export function parseTree(payload: unknown): RepoFile[] {
  if (!Array.isArray(payload)) return [];
  const files: RepoFile[] = [];
  for (const entry of payload) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    if (item.type !== "file" || typeof item.path !== "string") continue;
    const lfs =
      item.lfs && typeof item.lfs === "object"
        ? (item.lfs as Record<string, unknown>)
        : null;
    const lfsOid =
      lfs && typeof lfs.oid === "string" && /^[0-9a-f]{64}$/i.test(lfs.oid)
        ? lfs.oid.toLowerCase()
        : null;
    const size =
      lfs && typeof lfs.size === "number"
        ? lfs.size
        : typeof item.size === "number"
          ? item.size
          : 0;
    files.push({
      path: item.path,
      size,
      sha256: lfsOid,
      gitOid: !lfsOid && typeof item.oid === "string" ? item.oid : null,
    });
  }
  return files;
}

/** Returns the quantization label of a GGUF file name, or `null`. */
export function detectQuant(path: string): string | null {
  const stem = baseName(path)
    .replace(/\.gguf$/i, "")
    .replace(SPLIT_SUFFIX, "");
  let last: string | null = null;
  for (const match of stem.matchAll(QUANT_PATTERN))
    last = match[1].toUpperCase();
  return last;
}

function isProjector(path: string): boolean {
  return /mmproj/i.test(baseName(path));
}

export function detectFormats(files: RepoFile[]): ModelFormat[] {
  const formats: ModelFormat[] = [];
  if (
    files.some((file) => /\.gguf$/i.test(file.path) && !isProjector(file.path))
  )
    formats.push("gguf");
  if (safetensorsWeights(files).length) formats.push("safetensors");
  return formats;
}

/**
 * Groups GGUF files into one variant per quantization. Multimodal projector
 * files (mmproj) are not language-model weights and are left out.
 */
export function listGgufVariants(files: RepoFile[]): GgufVariant[] {
  const groups = new Map<string, RepoFile[]>();
  for (const file of files) {
    if (!/\.gguf$/i.test(file.path) || isProjector(file.path)) continue;
    const quant = detectQuant(file.path);
    // Unlabeled files are only offered when they sit at the repo root, which
    // avoids listing patches or auxiliary tensors kept in subfolders.
    if (!quant && !isRootFile(file.path)) continue;
    const key =
      quant ??
      baseName(file.path)
        .replace(/\.gguf$/i, "")
        .replace(SPLIT_SUFFIX, "");
    const list = groups.get(key);
    if (list) list.push(file);
    else groups.set(key, [file]);
  }
  const variants: GgufVariant[] = [];
  for (const [id, group] of groups) {
    const sorted = [...group].sort((a, b) => a.path.localeCompare(b.path));
    const parts = sorted.filter((file) =>
      SPLIT_SUFFIX.test(file.path.replace(/\.gguf$/i, "")),
    );
    // A quantization may be published both whole and split; keep one of them.
    const chosen =
      parts.length && parts.length < sorted.length
        ? sorted.filter((file) => !parts.includes(file)).slice(0, 1)
        : parts.length
          ? parts
          : sorted.slice(0, 1);
    variants.push({
      id,
      files: chosen,
      bytes: chosen.reduce((sum, file) => sum + file.size, 0),
      bitsPerWeight: BITS_PER_WEIGHT[id] ?? null,
      split: chosen.length > 1,
    });
  }
  return variants.sort((a, b) => a.bytes - b.bytes);
}

const DOC_PATTERN =
  /^(readme\.md|licen[sc]e(\.[a-z]+)?|notice(\.[a-z]+)?|use_policy\.md)$/i;

function docFiles(files: RepoFile[]): PackageFile[] {
  return files
    .filter((file) => isRootFile(file.path) && DOC_PATTERN.test(file.path))
    .map((file) => ({ ...file, role: "docs" as const }));
}

function finish(
  format: ModelFormat,
  variant: string | null,
  files: PackageFile[],
): ModelPackage {
  return {
    format,
    variant,
    files,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    weightBytes: files
      .filter((file) => file.role === "weights")
      .reduce((sum, file) => sum + file.size, 0),
  };
}

/** One quantization (all its parts) + README/LICENSE. */
export function selectGgufPackage(
  files: RepoFile[],
  variantId: string,
): ModelPackage | null {
  const variant = listGgufVariants(files).find(
    (entry) => entry.id.toLowerCase() === variantId.toLowerCase(),
  );
  if (!variant) return null;
  return finish("gguf", variant.id, [
    ...variant.files.map((file) => ({ ...file, role: "weights" as const })),
    ...docFiles(files),
  ]);
}

function safetensorsWeights(files: RepoFile[]): RepoFile[] {
  const root = files.filter(
    (file) => isRootFile(file.path) && /\.safetensors$/i.test(file.path),
  );
  const single = root.find((file) => file.path === "model.safetensors");
  if (single) return [single];
  const shards = root.filter((file) =>
    /^model-\d{5}-of-\d{5}\.safetensors$/i.test(file.path),
  );
  if (shards.length) return shards.sort((a, b) => a.path.localeCompare(b.path));
  // Adapters ship their own single weight file.
  const adapter = root.find(
    (file) => file.path === "adapter_model.safetensors",
  );
  if (adapter) return [adapter];
  return root.length === 1 ? root : [];
}

const CONFIG_FILES = new Set([
  "config.json",
  "generation_config.json",
  "adapter_config.json",
  "model.safetensors.index.json",
]);

// A tokenizer is unusable without its vocabulary and special-token files, so
// those companions travel with the `tokenizer*` files the package requires.
const TOKENIZER_FILES = new Set([
  "special_tokens_map.json",
  "added_tokens.json",
  "vocab.json",
  "vocab.txt",
  "merges.txt",
  "spiece.model",
  "sentencepiece.bpe.model",
  "chat_template.json",
  "chat_template.jinja",
]);

/** Weights + config + tokenizer + generation config + LICENSE + README. */
export function selectSafetensorsPackage(
  files: RepoFile[],
): ModelPackage | null {
  const weights = safetensorsWeights(files);
  if (!weights.length) return null;
  const selected: PackageFile[] = weights.map((file) => ({
    ...file,
    role: "weights" as const,
  }));
  for (const file of files) {
    if (!isRootFile(file.path)) continue;
    const name = file.path.toLowerCase();
    if (CONFIG_FILES.has(name)) selected.push({ ...file, role: "config" });
    else if (name.startsWith("tokenizer") || TOKENIZER_FILES.has(name))
      selected.push({ ...file, role: "tokenizer" });
  }
  selected.push(...docFiles(files));
  return finish("safetensors", null, selected);
}

const PREFERRED_QUANTS = ["Q4_K_M", "Q4_K", "Q4_K_S", "Q4_0", "Q5_K_M", "Q5_K"];

/**
 * Suggests a quantization: the largest one that fits `budgetBytes` among the
 * balanced 4/5-bit options, falling back to the largest that fits at all.
 */
export function recommendVariant(
  variants: GgufVariant[],
  budgetBytes: number | null = null,
): GgufVariant | null {
  if (!variants.length) return null;
  const fits = (variant: GgufVariant) =>
    budgetBytes === null || variant.bytes <= budgetBytes;
  for (const id of PREFERRED_QUANTS) {
    const match = variants.find((variant) => variant.id === id);
    if (match && fits(match)) return match;
  }
  const fitting = variants.filter(fits);
  if (fitting.length) return fitting[fitting.length - 1];
  return variants[0];
}

/** Rough parameter count derived from weight size and quantization. */
export function estimateParameters(
  weightBytes: number,
  bitsPerWeight: number | null,
): number | null {
  if (!bitsPerWeight || weightBytes <= 0) return null;
  return Math.round((weightBytes * 8) / bitsPerWeight);
}
