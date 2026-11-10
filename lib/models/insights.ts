// Aggregations over real catalog data for the "Por procedencia" and
// "Tecnología real" views. Pure functions: they only count what the sources
// publish and report how many records lacked the field instead of guessing.

import type { Distribution, HubModel } from "./hub";
import { LOCAL_FORMATS } from "./hub";
import {
  countryName,
  lookupOrg,
  type OrgRegion,
  regionOf,
} from "./organizations";
import { MULTIMODAL_PIPELINES } from "./specialties";

/** A model listed by an API catalogue (OpenRouter) rather than the hub. */
export type ApiCatalogModel = {
  id: string;
  title: string;
  openWeights: boolean;
};

export type OriginBucket = Distribution;

export type OrgAggregate = {
  name: string;
  handle: string;
  counts: Record<OriginBucket, number>;
  downloads: number;
  models: string[];
};

export type CountryAggregate = {
  country: string;
  name: string;
  region: OrgRegion | null;
  counts: Record<OriginBucket, number>;
  total: number;
  downloads: number;
  orgs: OrgAggregate[];
};

export type OriginSummary = {
  countries: CountryAggregate[];
  totals: Record<OriginBucket, number>;
  /** Records whose publisher is not in the curated organisation list. */
  unclassified: number;
  unclassifiedHandles: string[];
};

function emptyCounts(): Record<OriginBucket, number> {
  return { open: 0, restricted: 0, derived: 0, api: 0 };
}

export function aggregateOrigins(
  hubModels: HubModel[],
  apiModels: ApiCatalogModel[] = [],
): OriginSummary {
  const countries = new Map<string, CountryAggregate>();
  const totals = emptyCounts();
  const unclassified = new Map<string, number>();
  const seen = new Set<string>();

  function add(
    handle: string,
    bucket: OriginBucket,
    modelId: string,
    downloads: number,
  ) {
    const org = lookupOrg(handle);
    if (!org) {
      unclassified.set(handle, (unclassified.get(handle) ?? 0) + 1);
      return;
    }
    totals[bucket] += 1;
    const country = countries.get(org.country) ?? {
      country: org.country,
      name: countryName(org.country),
      region: regionOf(org.country),
      counts: emptyCounts(),
      total: 0,
      downloads: 0,
      orgs: [],
    };
    country.counts[bucket] += 1;
    country.total += 1;
    country.downloads += downloads;
    let orgRow = country.orgs.find((row) => row.name === org.name);
    if (!orgRow) {
      orgRow = {
        name: org.name,
        handle,
        counts: emptyCounts(),
        downloads: 0,
        models: [],
      };
      country.orgs.push(orgRow);
    }
    orgRow.counts[bucket] += 1;
    orgRow.downloads += downloads;
    if (orgRow.models.length < 8) orgRow.models.push(modelId);
    countries.set(org.country, country);
  }

  for (const model of hubModels) {
    if (seen.has(model.id)) continue;
    seen.add(model.id);
    add(model.author, model.distribution, model.id, model.downloads ?? 0);
  }
  // Open-weight API entries are already represented by their hub repos;
  // only closed (API-only) entries add information here.
  for (const model of apiModels) {
    if (model.openWeights || seen.has(model.id)) continue;
    seen.add(model.id);
    add(model.id.split("/")[0] ?? "", "api", model.id, 0);
  }

  const list = [...countries.values()];
  for (const country of list)
    country.orgs.sort((a, b) => sumCounts(b.counts) - sumCounts(a.counts));
  list.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  return {
    countries: list,
    totals,
    unclassified: [...unclassified.values()].reduce((a, b) => a + b, 0),
    unclassifiedHandles: [...unclassified.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([handle]) => handle),
  };
}

export function sumCounts(counts: Record<OriginBucket, number>): number {
  return counts.open + counts.restricted + counts.derived + counts.api;
}

// ---------------------------------------------------------------------------
// Technology
// ---------------------------------------------------------------------------

export type TechFeatureId =
  | "moe"
  | "long-context"
  | "multimodal"
  | "reasoning"
  | "local-format";

export type TechFeature = {
  id: TechFeatureId;
  label: string;
  kind: "declarado" | "medido";
  /** Which published field proves it. */
  field: string;
  explanation: string;
  count: number;
  /** Models where the field exists at all (the honest denominator). */
  withData: number;
  examples: HubModel[];
};

const MOE_PATTERN =
  /moe|mixtral|deepseekv[23]|deepseek_v[23]|gptoss|gpt_oss|dbrx|jamba|arctic|llama4|minimax|ernie4_5_moe|hunyuan/i;

export const LONG_CONTEXT_TOKENS = 128_000;

export function isMoe(model: HubModel): boolean | null {
  if (model.topics.some((topic) => /^(moe|mixture-of-experts)$/.test(topic)))
    return true;
  const arch = `${model.architecture ?? ""} ${model.modelType ?? ""}`.trim();
  if (!arch) return null;
  return MOE_PATTERN.test(arch);
}

export function isReasoning(model: HubModel): boolean {
  return model.topics.some((topic) =>
    /^(reasoning|thinking|chain-of-thought|cot|r1|reasoning-model)$/.test(
      topic,
    ),
  );
}

export function parameterBucket(parameters: number | null): string | null {
  if (parameters === null) return null;
  const billions = parameters / 1e9;
  if (billions < 3) return "< 3 B";
  if (billions < 10) return "3–10 B";
  if (billions < 40) return "10–40 B";
  if (billions < 150) return "40–150 B";
  return "≥ 150 B";
}

export const PARAMETER_BUCKETS = [
  "< 3 B",
  "3–10 B",
  "10–40 B",
  "40–150 B",
  "≥ 150 B",
];

export type TechSummary = {
  total: number;
  features: TechFeature[];
  sizes: Array<{ bucket: string; count: number }>;
  unknownSize: number;
};

function byDownloads(a: HubModel, b: HubModel): number {
  return (b.downloads ?? -1) - (a.downloads ?? -1);
}

export function summarizeTechnology(pool: HubModel[]): TechSummary {
  const models = [...new Map(pool.map((m) => [m.id, m])).values()];

  function feature(
    base: Omit<TechFeature, "count" | "withData" | "examples">,
    test: (model: HubModel) => boolean | null,
  ): TechFeature {
    let withData = 0;
    const hits: HubModel[] = [];
    for (const model of models) {
      const result = test(model);
      if (result === null) continue;
      withData += 1;
      if (result) hits.push(model);
    }
    return {
      ...base,
      count: hits.length,
      withData,
      examples: hits.sort(byDownloads).slice(0, 6),
    };
  }

  const features: TechFeature[] = [
    feature(
      {
        id: "moe",
        label: "Mezcla de expertos (MoE)",
        kind: "declarado",
        field: "config.architectures / model_type",
        explanation:
          "Solo se activa una parte de los parámetros por token: más capacidad total con menos cómputo por respuesta, pero toda la red debe caber en memoria.",
      },
      isMoe,
    ),
    feature(
      {
        id: "long-context",
        label: `Contexto largo (≥ ${LONG_CONTEXT_TOKENS / 1000} K tokens)`,
        kind: "declarado",
        field: "gguf.context_length",
        explanation:
          "Ventana de contexto declarada en los metadatos GGUF. Solo se cuenta en repositorios que publican ese metadato.",
      },
      (model) =>
        model.contextLength === null
          ? null
          : model.contextLength >= LONG_CONTEXT_TOKENS,
    ),
    feature(
      {
        id: "multimodal",
        label: "Multimodal",
        kind: "declarado",
        field: "pipeline_tag",
        explanation:
          "El repositorio declara un pipeline que recibe imagen, audio o video además de texto.",
      },
      (model) =>
        model.pipelineTag === null
          ? null
          : MULTIMODAL_PIPELINES.includes(model.pipelineTag),
    ),
    feature(
      {
        id: "reasoning",
        label: "Razonamiento explícito",
        kind: "declarado",
        field: "tags",
        explanation:
          "El repositorio se etiqueta como modelo de razonamiento («reasoning», «thinking», «chain-of-thought»). Es una declaración del autor, no una medición.",
      },
      isReasoning,
    ),
    feature(
      {
        id: "local-format",
        label: "Formato local (GGUF / MLX / ONNX)",
        kind: "declarado",
        field: "archivos del repositorio",
        explanation:
          "Publica pesos en un formato que corre en llama.cpp, LM Studio, Ollama (GGUF), Apple MLX u ONNX Runtime.",
      },
      (model) => model.formats.some((format) => LOCAL_FORMATS.includes(format)),
    ),
  ];

  const sizeCounts = new Map<string, number>();
  let unknownSize = 0;
  for (const model of models) {
    const bucket = parameterBucket(model.parameters);
    if (!bucket) unknownSize += 1;
    else sizeCounts.set(bucket, (sizeCounts.get(bucket) ?? 0) + 1);
  }

  return {
    total: models.length,
    features,
    sizes: PARAMETER_BUCKETS.map((bucket) => ({
      bucket,
      count: sizeCounts.get(bucket) ?? 0,
    })),
    unknownSize,
  };
}
