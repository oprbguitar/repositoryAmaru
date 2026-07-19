import { z } from "zod";

// Rankings de modelos con procedencia. Dos familias:
// 1) "category-*": orden de uso real devuelto por el parámetro documentado
//    `category` de GET /api/v1/models de OpenRouter.
// 2) órdenes deterministas calculados por el observatorio sobre el catálogo
//    público (fórmula visible en `methodology`).
// Verificado el 2026-07-18: `order=` es ignorado por la API pública, por lo que
// los rankings globales de popularidad/inteligencia no están disponibles.

export type CatalogModel = {
  id: string;
  name: string;
  created: number | null;
  contextLength: number | null;
  promptPricePerMillion: number | null;
  completionPricePerMillion: number | null;
  huggingFaceId: string | null;
  inputModalities: string[];
};

export type RankingEntry = {
  modelExternalId: string;
  modelTitle: string;
  rankingType: string;
  rankingPosition: number;
  score: number | null;
  scoreUnit: string | null;
  methodology: string;
  methodologyUrl: string | null;
};

const catalogSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.string(),
        name: z.string().optional(),
        created: z.number().nullish(),
        context_length: z.number().nullish(),
        hugging_face_id: z.string().nullish(),
        pricing: z.record(z.string(), z.unknown()).nullish(),
        architecture: z.record(z.string(), z.unknown()).nullish(),
      })
      .passthrough(),
  ),
});

function pricePerMillion(value: unknown): number | null {
  const perToken = Number(value);
  return Number.isFinite(perToken) && perToken >= 0
    ? Math.round(perToken * 1_000_000 * 10_000) / 10_000
    : null;
}

export function parseCatalogModels(payload: unknown): CatalogModel[] {
  const parsed = catalogSchema.parse(payload);
  return parsed.data.map((model) => {
    const pricing = model.pricing ?? {};
    const architecture = model.architecture ?? {};
    const modalities = Array.isArray(architecture.input_modalities)
      ? architecture.input_modalities.filter(
          (item): item is string => typeof item === "string",
        )
      : [];
    return {
      id: model.id,
      name: model.name ?? model.id,
      created: model.created ?? null,
      contextLength: model.context_length ?? null,
      promptPricePerMillion: pricePerMillion(pricing.prompt),
      completionPricePerMillion: pricePerMillion(pricing.completion),
      huggingFaceId: model.hugging_face_id ?? null,
      inputModalities: modalities,
    };
  });
}

const CATALOG_METHODOLOGY =
  "Orden determinista calculado por el observatorio sobre el catálogo público de OpenRouter (GET /api/v1/models).";
const CATEGORY_METHODOLOGY =
  "Ranking por uso real dentro de la categoría, según el parámetro documentado `category` de la API de OpenRouter.";
const METHODOLOGY_URL =
  "https://openrouter.ai/docs/api-reference/list-available-models";

export const CATALOG_RANKING_TYPES = [
  "newest",
  "pricing-low",
  "context-high",
  "open-local",
  "free-api",
  "multimodal",
] as const;

export const CATEGORY_RANKING_TYPES = [
  "category-programming",
  "category-technology",
  "category-science",
  "category-translation",
] as const;

export const UNAVAILABLE_RANKING_TYPES = [
  "most-popular",
  "top-weekly",
  "intelligence",
  "agentic",
  "latency-low",
  "throughput-high",
] as const;

function entries(
  models: CatalogModel[],
  rankingType: string,
  score: (model: CatalogModel) => number | null,
  scoreUnit: string | null,
  limit = 50,
): RankingEntry[] {
  return models.slice(0, limit).map((model, index) => ({
    modelExternalId: model.id,
    modelTitle: model.name,
    rankingType,
    rankingPosition: index + 1,
    score: score(model),
    scoreUnit,
    methodology: CATALOG_METHODOLOGY,
    methodologyUrl: METHODOLOGY_URL,
  }));
}

export function computeCatalogRankings(models: CatalogModel[]): RankingEntry[] {
  const results: RankingEntry[] = [];
  const byNewest = [...models].sort(
    (a, b) => (b.created ?? 0) - (a.created ?? 0),
  );
  results.push(
    ...entries(byNewest, "newest", (model) => model.created, "unix_epoch"),
  );

  const priced = models.filter(
    (model) =>
      model.promptPricePerMillion !== null && model.promptPricePerMillion > 0,
  );
  const byPrice = [...priced].sort(
    (a, b) =>
      (a.promptPricePerMillion ?? Number.POSITIVE_INFINITY) -
      (b.promptPricePerMillion ?? Number.POSITIVE_INFINITY),
  );
  results.push(
    ...entries(
      byPrice,
      "pricing-low",
      (model) => model.promptPricePerMillion,
      "usd_per_million_input",
    ),
  );

  const byContext = [...models].sort(
    (a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0),
  );
  results.push(
    ...entries(
      byContext,
      "context-high",
      (model) => model.contextLength,
      "tokens",
    ),
  );

  const openWeights = byNewest.filter((model) => model.huggingFaceId);
  results.push(
    ...entries(
      openWeights,
      "open-local",
      (model) => model.created,
      "unix_epoch",
    ),
  );

  const free = byNewest.filter(
    (model) =>
      model.id.endsWith(":free") ||
      (model.promptPricePerMillion === 0 &&
        model.completionPricePerMillion === 0),
  );
  results.push(
    ...entries(free, "free-api", (model) => model.created, "unix_epoch"),
  );

  const multimodal = byNewest.filter(
    (model) => model.inputModalities.length > 1,
  );
  results.push(
    ...entries(
      multimodal,
      "multimodal",
      (model) => model.created,
      "unix_epoch",
    ),
  );
  return results;
}

export function categoryRanking(
  payload: unknown,
  rankingType: string,
): RankingEntry[] {
  const models = parseCatalogModels(payload);
  return models.slice(0, 50).map((model, index) => ({
    modelExternalId: model.id,
    modelTitle: model.name,
    rankingType,
    rankingPosition: index + 1,
    score: null,
    scoreUnit: null,
    methodology: CATEGORY_METHODOLOGY,
    methodologyUrl: METHODOLOGY_URL,
  }));
}

// Ofertas por proveedor: GET /api/v1/models/:author/:slug/endpoints
const endpointsSchema = z.object({
  data: z.object({
    id: z.string(),
    name: z.string().optional(),
    endpoints: z.array(
      z
        .object({
          name: z.string().optional(),
          provider_name: z.string(),
          context_length: z.number().nullish(),
          max_completion_tokens: z.number().nullish(),
          quantization: z.string().nullish(),
          status: z.union([z.number(), z.string()]).nullish(),
          pricing: z.record(z.string(), z.unknown()).nullish(),
          supported_parameters: z.array(z.string()).nullish(),
        })
        .passthrough(),
    ),
  }),
});

export type OfferingEntry = {
  modelExternalId: string;
  modelTitle: string;
  providerName: string;
  providerModelIdentifier: string | null;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  cachedInputPricePerMillion: number | null;
  requestPrice: number | null;
  imagePrice: number | null;
  originalPricing: Record<string, unknown>;
  contextLength: number | null;
  maxCompletionTokens: number | null;
  quantization: string | null;
  status: string | null;
  supportedParameters: string[];
};

export function parseModelOfferings(payload: unknown): OfferingEntry[] {
  const parsed = endpointsSchema.parse(payload);
  const model = parsed.data;
  return model.endpoints.map((endpoint) => {
    const pricing = endpoint.pricing ?? {};
    const requestPrice = Number(pricing.request);
    const imagePrice = Number(pricing.image);
    return {
      modelExternalId: model.id,
      modelTitle: model.name ?? model.id,
      providerName: endpoint.provider_name,
      providerModelIdentifier: endpoint.name ?? null,
      inputPricePerMillion: pricePerMillion(pricing.prompt),
      outputPricePerMillion: pricePerMillion(pricing.completion),
      cachedInputPricePerMillion: pricePerMillion(pricing.input_cache_read),
      requestPrice:
        Number.isFinite(requestPrice) && requestPrice > 0 ? requestPrice : null,
      imagePrice:
        Number.isFinite(imagePrice) && imagePrice > 0 ? imagePrice : null,
      originalPricing: pricing,
      contextLength: endpoint.context_length ?? null,
      maxCompletionTokens: endpoint.max_completion_tokens ?? null,
      quantization: endpoint.quantization ?? null,
      status:
        endpoint.status === null || endpoint.status === undefined
          ? null
          : String(endpoint.status),
      supportedParameters: endpoint.supported_parameters ?? [],
    };
  });
}
