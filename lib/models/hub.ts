// Normalizers for the public Hugging Face Hub API.
//
// Shapes verified with real requests on 2026-11-09:
//   GET /api/models?...&expand[]=safetensors&expand[]=gguf&expand[]=cardData...
//   GET /api/models/{id}?blobs=true
// Nothing here guesses: a field the Hub did not publish becomes null / [].

import { DEFAULT_QUANTIZATION, estimateWeightBytes } from "./memory";
import { lookupOrg, type OrgInfo, type OrgKind } from "./organizations";

export type HubFormat =
  | "safetensors"
  | "gguf"
  | "onnx"
  | "mlx"
  | "pytorch"
  | "openvino";

export const HUB_FORMAT_LABELS: Record<HubFormat, string> = {
  safetensors: "Safetensors",
  gguf: "GGUF",
  onnx: "ONNX",
  mlx: "MLX",
  pytorch: "PyTorch (.bin)",
  openvino: "OpenVINO",
};

/** Formats that run locally without a Python training stack. */
export const LOCAL_FORMATS: HubFormat[] = ["gguf", "mlx", "onnx"];

export type LicenseClass =
  | "permissive"
  | "conditional"
  | "non-commercial"
  | "unknown";

export type Distribution = "open" | "restricted" | "derived" | "api";

export const DISTRIBUTION_LABELS: Record<Distribution, string> = {
  open: "Pesos abiertos",
  restricted: "Licencia restrictiva",
  derived: "Derivado de terceros",
  api: "Solo API",
};

export type HubEval = {
  task: string | null;
  dataset: string;
  metric: string;
  value: number;
  /** Hub flag: the result was verified by Hugging Face, not only self-reported. */
  verified: boolean;
  sourceName: string | null;
  sourceUrl: string | null;
};

export type HubModel = {
  id: string;
  author: string;
  name: string;
  pipelineTag: string | null;
  libraryName: string | null;
  architecture: string | null;
  modelType: string | null;
  downloads: number | null;
  likes: number | null;
  trendingScore: number | null;
  createdAt: string | null;
  lastModified: string | null;
  gated: boolean;
  license: string | null;
  licenseName: string | null;
  licenseUrl: string | null;
  licenseClass: LicenseClass;
  /** true / false only when the licence id settles it; null = read the licence. */
  commercialUse: boolean | null;
  languages: string[];
  programmingLanguages: string[];
  topics: string[];
  datasets: string[];
  arxivIds: string[];
  baseModels: string[];
  baseRelation: string | null;
  parameters: number | null;
  parametersSource: "safetensors" | "gguf" | null;
  formats: HubFormat[];
  contextLength: number | null;
  evals: HubEval[];
  distribution: Distribution;
  originKind: OrgKind;
  org: OrgInfo | null;
  /** Estimated Q4_K_M package size; null when parameters are unknown. */
  estimatedPackageBytes: number | null;
};

type Raw = Record<string, unknown>;

function record(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Raw)
    : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function strings(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

const PERMISSIVE_LICENSES = new Set([
  "apache-2.0",
  "mit",
  "bsd",
  "bsd-2-clause",
  "bsd-3-clause",
  "bsd-3-clause-clear",
  "cc0-1.0",
  "cc-by-4.0",
  "cc-by-3.0",
  "cc-by-2.0",
  "unlicense",
  "isc",
  "wtfpl",
  "cdla-permissive-2.0",
  "pddl",
  "afl-3.0",
  "artistic-2.0",
  "bsl-1.0",
  "zlib",
  "postgresql",
  "ms-pl",
  "ncsa",
]);

/**
 * Copyleft and "open with conditions" licences: commercial use is allowed
 * but under obligations the user must read (share-alike, use policies...).
 */
const CONDITIONAL_COMMERCIAL = new Set([
  "cc-by-sa-4.0",
  "cc-by-sa-3.0",
  "gpl",
  "gpl-2.0",
  "gpl-3.0",
  "lgpl",
  "lgpl-2.1",
  "lgpl-3.0",
  "agpl-3.0",
  "mpl-2.0",
  "epl-2.0",
  "eupl-1.1",
  "eupl-1.2",
  "osl-3.0",
  "odbl",
  "openrail",
  "openrail++",
  "creativeml-openrail-m",
  "bigscience-openrail-m",
  "bigscience-bloom-rail-1.0",
  "bigcode-openrail-m",
]);

export function classifyLicense(
  license: string | null,
  licenseName: string | null = null,
): { licenseClass: LicenseClass; commercialUse: boolean | null } {
  const id = (license ?? "").toLowerCase();
  const name = (licenseName ?? "").toLowerCase();
  if (!id) return { licenseClass: "unknown", commercialUse: null };
  if (
    /(^|-)nc(-|$)/.test(id) ||
    /non-?commercial|research-only|research_only/.test(`${id} ${name}`)
  )
    return { licenseClass: "non-commercial", commercialUse: false };
  if (PERMISSIVE_LICENSES.has(id))
    return { licenseClass: "permissive", commercialUse: true };
  if (CONDITIONAL_COMMERCIAL.has(id))
    return { licenseClass: "conditional", commercialUse: true };
  // Vendor licences (llama*, gemma, "other"...): terms vary, never assumed.
  return { licenseClass: "conditional", commercialUse: null };
}

const PROGRAMMING_LANGUAGES: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  rust: "Rust",
  go: "Go",
  golang: "Go",
  "c++": "C++",
  cpp: "C++",
  "c#": "C#",
  csharp: "C#",
  php: "PHP",
  ruby: "Ruby",
  swift: "Swift",
  kotlin: "Kotlin",
  sql: "SQL",
  bash: "Bash",
  shell: "Shell",
  html: "HTML",
  css: "CSS",
  solidity: "Solidity",
  verilog: "Verilog",
  r: "R",
  scala: "Scala",
  lua: "Lua",
};

/** Hub tags that are plumbing, not a statement about what the model is for. */
const NOISE_TAG =
  /^(transformers|safetensors|gguf|onnx|mlx|pytorch|tf|jax|openvino|endpoints_compatible|text-generation-inference|autotrain_compatible|conversational|custom_code|region:.*|license:.*|base_model:.*|arxiv:.*|dataset:.*|deploy:.*|doi:.*|model-index|eval-results|4-bit|8-bit|bitsandbytes|unsloth|imatrix|text-generation|[a-z]{2,3})$/;

function isLanguageCode(value: string): boolean {
  return /^[a-z]{2,3}$/.test(value) && value !== "code";
}

function detectFormats(
  tags: string[],
  libraryName: string | null,
  files: string[],
  hasGguf: boolean,
  hasSafetensors: boolean,
): HubFormat[] {
  const formats = new Set<HubFormat>();
  const lower = tags.map((tag) => tag.toLowerCase());
  const isMlx = lower.includes("mlx") || libraryName === "mlx";
  if (isMlx) formats.add("mlx");
  if (
    !isMlx &&
    (hasSafetensors ||
      lower.includes("safetensors") ||
      files.some((file) => file.endsWith(".safetensors")))
  )
    formats.add("safetensors");
  if (
    hasGguf ||
    lower.includes("gguf") ||
    files.some((file) => file.endsWith(".gguf"))
  )
    formats.add("gguf");
  if (lower.includes("onnx") || files.some((file) => file.endsWith(".onnx")))
    formats.add("onnx");
  if (
    lower.includes("openvino") ||
    files.some((file) => file.startsWith("openvino_"))
  )
    formats.add("openvino");
  if (
    files.some(
      (file) => /pytorch_model.*\.bin$/.test(file) || file.endsWith(".pt"),
    )
  )
    formats.add("pytorch");
  return [...formats];
}

export function parseEvalResults(modelIndex: unknown): HubEval[] {
  if (!Array.isArray(modelIndex)) return [];
  const evals: HubEval[] = [];
  for (const entry of modelIndex) {
    const results = record(entry).results;
    if (!Array.isArray(results)) continue;
    for (const rawResult of results) {
      const result = record(rawResult);
      const dataset = record(result.dataset);
      const datasetName = text(dataset.name) ?? text(dataset.type);
      if (!datasetName) continue;
      const source = record(result.source);
      const task = record(result.task);
      const metrics = Array.isArray(result.metrics) ? result.metrics : [];
      for (const rawMetric of metrics) {
        const metric = record(rawMetric);
        const value =
          typeof metric.value === "string"
            ? Number(metric.value)
            : finite(metric.value);
        if (value === null || !Number.isFinite(value)) continue;
        evals.push({
          task: text(task.name) ?? text(task.type),
          dataset: datasetName,
          metric: text(metric.name) ?? text(metric.type) ?? "métrica",
          value,
          verified: metric.verified === true,
          sourceName: text(source.name),
          sourceUrl: text(source.url),
        });
      }
    }
  }
  return evals;
}

/** Works for both list items (`expand[]`) and the detail endpoint. */
export function normalizeHubModel(input: unknown): HubModel | null {
  const raw = record(input);
  const id = text(raw.id) ?? text(raw.modelId);
  if (!id) return null;
  const author = text(raw.author) ?? id.split("/")[0] ?? "";
  const card = record(raw.cardData);
  const config = record(raw.config);
  const gguf = record(raw.gguf);
  const safetensors = record(raw.safetensors);
  const tags = strings(raw.tags);
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  const files = Array.isArray(raw.siblings)
    ? raw.siblings
        .map((sibling) => text(record(sibling).rfilename))
        .filter((name): name is string => Boolean(name))
    : [];

  const licenseTag = lowerTags.find((tag) => tag.startsWith("license:"));
  const license =
    strings(card.license)[0]?.toLowerCase() ??
    (licenseTag ? licenseTag.slice("license:".length) : null);
  const licenseName = text(card.license_name);
  const { licenseClass, commercialUse } = classifyLicense(license, licenseName);

  const baseModelsRaw = record(raw.baseModels);
  const baseFromExpand = Array.isArray(baseModelsRaw.models)
    ? baseModelsRaw.models
        .map((model) => text(record(model).id))
        .filter((value): value is string => Boolean(value))
    : [];
  const baseFromTags = tags
    .filter((tag) => /^base_model:[^:]+\/[^:]+$/.test(tag))
    .map((tag) => tag.slice("base_model:".length));
  const baseModels = [
    ...new Set([
      ...baseFromExpand,
      ...strings(card.base_model),
      ...baseFromTags,
    ]),
  ];
  const relationTag = tags.find((tag) =>
    /^base_model:(finetune|quantized|adapter|merge):/.test(tag),
  );
  const baseRelation =
    text(baseModelsRaw.relation) ??
    text(card.base_model_relation) ??
    (relationTag ? relationTag.split(":")[1] : null) ??
    (baseModels.length ? "finetune" : null);

  const safetensorsTotal = finite(safetensors.total);
  const ggufTotal = finite(gguf.total);
  const parameters = safetensorsTotal ?? ggufTotal;
  const parametersSource =
    safetensorsTotal !== null
      ? "safetensors"
      : ggufTotal !== null
        ? "gguf"
        : null;

  const languages = [
    ...new Set([
      ...strings(card.language).map((value) => value.toLowerCase()),
      ...lowerTags.filter(isLanguageCode),
    ]),
  ].filter(isLanguageCode);

  const programmingLanguages = [
    ...new Set(
      lowerTags
        .map((tag) => PROGRAMMING_LANGUAGES[tag])
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const topics = [
    ...new Set(lowerTags.filter((tag) => !NOISE_TAG.test(tag))),
  ].slice(0, 24);

  const org = lookupOrg(author);
  const gated = raw.gated === true || typeof raw.gated === "string";
  const baseAuthors = baseModels.map((base) => base.split("/")[0]);
  const isThirdPartyDerivative =
    baseModels.length > 0 &&
    baseAuthors.every(
      (baseAuthor) => baseAuthor.toLowerCase() !== author.toLowerCase(),
    );

  let distribution: Distribution = "restricted";
  if (isThirdPartyDerivative) distribution = "derived";
  else if (licenseClass === "permissive" && !gated) distribution = "open";

  return {
    id,
    author,
    name: id.split("/").slice(1).join("/") || id,
    pipelineTag: text(raw.pipeline_tag) ?? text(card.pipeline_tag),
    libraryName: text(raw.library_name) ?? text(card.library_name),
    architecture:
      strings(config.architectures)[0] ?? text(gguf.architecture) ?? null,
    modelType: text(config.model_type) ?? text(gguf.architecture),
    downloads: finite(raw.downloads),
    likes: finite(raw.likes),
    trendingScore: finite(raw.trendingScore),
    createdAt: text(raw.createdAt),
    lastModified: text(raw.lastModified),
    gated,
    license,
    licenseName,
    licenseUrl: text(card.license_link),
    licenseClass,
    commercialUse,
    languages,
    programmingLanguages,
    topics,
    datasets: [
      ...new Set([
        ...strings(card.datasets),
        ...tags
          .filter((tag) => tag.startsWith("dataset:"))
          .map((tag) => tag.slice("dataset:".length)),
      ]),
    ].slice(0, 12),
    arxivIds: tags
      .filter((tag) => tag.startsWith("arxiv:"))
      .map((tag) => tag.slice("arxiv:".length)),
    baseModels,
    baseRelation,
    parameters,
    parametersSource,
    formats: detectFormats(
      tags,
      text(raw.library_name),
      files,
      ggufTotal !== null,
      safetensorsTotal !== null,
    ),
    contextLength: finite(gguf.context_length),
    evals: parseEvalResults(raw["model-index"] ?? card["model-index"]),
    distribution,
    originKind: org?.kind ?? "community",
    org,
    estimatedPackageBytes: estimateWeightBytes(
      parameters,
      DEFAULT_QUANTIZATION.bitsPerWeight,
    ),
  };
}

export function normalizeHubList(payload: unknown): HubModel[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item) => normalizeHubModel(item))
    .filter((model): model is HubModel => model !== null);
}

// ---------------------------------------------------------------------------
// File packages (detail endpoint with ?blobs=true)
// ---------------------------------------------------------------------------

export type HubFile = { name: string; size: number };

export type PackageVariant = {
  /** Quantization label parsed from the file name, e.g. "Q4_K_M". */
  label: string;
  bytes: number;
  files: number;
  /** First file of the variant, for linking. */
  fileName: string;
};

export type FormatPackage = {
  format: HubFormat;
  bytes: number;
  files: number;
  variants: PackageVariant[];
};

export function parseHubFiles(siblings: unknown): HubFile[] {
  if (!Array.isArray(siblings)) return [];
  const files: HubFile[] = [];
  for (const sibling of siblings) {
    const item = record(sibling);
    const name = text(item.rfilename);
    const size = finite(item.size) ?? finite(record(item.lfs).size);
    if (name && size !== null) files.push({ name, size });
  }
  return files;
}

const QUANT_PATTERN =
  /(?:^|[-._])((?:I?Q\d+(?:_[A-Z0-9]+)*)|BF16|F16|F32|FP16|FP32)(?=[-._]|$)/i;

export function quantizationLabel(fileName: string): string {
  const base = fileName.split("/").pop() ?? fileName;
  if (/mmproj/i.test(base)) return "mmproj";
  const match = base.match(QUANT_PATTERN);
  return match ? match[1].toUpperCase() : "sin etiqueta";
}

function formatOfFile(name: string, isMlx: boolean): HubFormat | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".gguf")) return "gguf";
  if (lower.endsWith(".safetensors")) return isMlx ? "mlx" : "safetensors";
  if (lower.endsWith(".onnx") || lower.endsWith(".onnx_data")) return "onnx";
  if (lower.includes("openvino_") && lower.endsWith(".bin")) return "openvino";
  if (/pytorch_model.*\.bin$/.test(lower) || lower.endsWith(".pt"))
    return "pytorch";
  return null;
}

/**
 * Groups weight files by format. GGUF repositories usually ship one file (or
 * one split set) per quantization, so each GGUF variant is its own download;
 * the other formats are downloaded whole.
 */
export function summarizeFiles(
  files: HubFile[],
  options: { isMlx?: boolean } = {},
): { packages: FormatPackage[]; smallestRunnableBytes: number | null } {
  const byFormat = new Map<HubFormat, FormatPackage>();
  const variants = new Map<string, PackageVariant>();
  for (const file of files) {
    const format = formatOfFile(file.name, options.isMlx === true);
    if (!format) continue;
    const pack = byFormat.get(format) ?? {
      format,
      bytes: 0,
      files: 0,
      variants: [],
    };
    pack.bytes += file.size;
    pack.files += 1;
    byFormat.set(format, pack);
    if (format === "gguf") {
      const label = quantizationLabel(file.name);
      const variant = variants.get(label) ?? {
        label,
        bytes: 0,
        files: 0,
        fileName: file.name,
      };
      variant.bytes += file.size;
      variant.files += 1;
      variants.set(label, variant);
    }
  }
  const ggufPack = byFormat.get("gguf");
  if (ggufPack)
    ggufPack.variants = [...variants.values()].sort(
      (left, right) => left.bytes - right.bytes,
    );

  const candidates: number[] = [];
  for (const pack of byFormat.values()) {
    if (pack.format === "gguf") {
      for (const variant of pack.variants)
        if (variant.label !== "mmproj") candidates.push(variant.bytes);
    } else candidates.push(pack.bytes);
  }
  return {
    packages: [...byFormat.values()].sort(
      (left, right) => left.bytes - right.bytes,
    ),
    smallestRunnableBytes: candidates.length ? Math.min(...candidates) : null,
  };
}

// ---------------------------------------------------------------------------
// Model card: known limitations
// ---------------------------------------------------------------------------

const LIMITATION_HEADING =
  /limitation|bias|risk|out[- ]of[- ]scope|responsible ai|caveat|limitaciones|known issues/i;

function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns a short excerpt of the section of the model card that documents
 * limitations, or null when the card has no such section. The excerpt is kept
 * short on purpose: the UI links to the full card.
 */
export function extractLimitations(
  markdown: string,
  maxLength = 360,
): { heading: string; excerpt: string } | null {
  const lines = markdown.replace(/^---[\s\S]*?\n---/, "").split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,4})\s+(.*)$/);
    if (!match || !LIMITATION_HEADING.test(match[2])) continue;
    const level = match[1].length;
    const body: string[] = [];
    for (let next = index + 1; next < lines.length; next += 1) {
      const heading = lines[next].match(/^(#{1,4})\s+/);
      if (heading && heading[1].length <= level) break;
      body.push(lines[next]);
    }
    const excerpt = stripMarkdown(body.join("\n"));
    if (!excerpt) continue;
    return {
      heading: stripMarkdown(match[2]),
      excerpt:
        excerpt.length > maxLength
          ? `${excerpt.slice(0, maxLength).replace(/\s+\S*$/, "")}…`
          : excerpt,
    };
  }
  return null;
}
