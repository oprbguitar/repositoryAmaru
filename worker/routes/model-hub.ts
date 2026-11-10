/**
 * Hugging Face Hub explorer for the "Modelos" page.
 *
 *   GET /api/model-hub/specialty?id=<SpecialtyId>  candidate pool per specialty
 *   GET /api/model-hub/search?q=<text>             free-text hub search
 *   GET /api/model-hub/overview                    broad pool (origin + technology)
 *   GET /api/model-hub/model?id=<owner/name>       technical sheet with file sizes
 *
 * Everything comes from the public Hub API; HUGGINGFACE_TOKEN (optional, via
 * resolveSecret) only raises rate limits. Responses are cached in KV with a
 * freshness window and served stale when the hub is unreachable.
 */
import {
  extractLimitations,
  type HubModel,
  normalizeHubList,
  normalizeHubModel,
  parseHubFiles,
  summarizeFiles,
} from "../../lib/models/hub";
import type {
  HubConfigFacts,
  HubDetailPayload,
  HubPoolPayload,
  HubSource,
} from "../../lib/models/hub-payloads";
import {
  type HubQuery,
  isSpecialtyId,
  matchesSpecialty,
  SPECIALTY_BY_ID,
} from "../../lib/models/specialties";
import type { ApiResponse } from "../../types/api";
import type { ExtraEnv, ExtraRouter } from "../extra-routes";
import { resolveSecret } from "../integrations";

const HUB = "https://huggingface.co";
const USER_AGENT = "AMARU-AI-Observatory/1.0 (+local)";
const CACHE_PREFIX = "model-hub:v1:";
const POOL_FRESH_MS = 6 * 60 * 60 * 1000;
const DETAIL_FRESH_MS = 12 * 60 * 60 * 1000;
const KV_TTL_SECONDS = 7 * 24 * 60 * 60;

const EXPAND_FIELDS = [
  "author",
  "baseModels",
  "cardData",
  "config",
  "createdAt",
  "downloads",
  "gated",
  "gguf",
  "lastModified",
  "library_name",
  "likes",
  "pipeline_tag",
  "safetensors",
  "siblings",
  "tags",
  "trendingScore",
];

type Cached<T> = { savedAt: number; payload: T };

function respond<T>(
  data: T,
  meta: Partial<ApiResponse<T>["meta"]> = {},
  status = 200,
  errors?: ApiResponse<T>["errors"],
): Response {
  const body: ApiResponse<T> = {
    data,
    meta: {
      requestId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      ...meta,
    },
    ...(errors?.length ? { errors } : {}),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function failure(code: string, message: string, status: number): Response {
  return respond(null, {}, status, [{ code, message }]);
}

async function hubHeaders(env: ExtraEnv): Promise<{
  headers: HeadersInit;
  authenticated: boolean;
}> {
  const token = await resolveSecret(env, "HUGGINGFACE_TOKEN").catch(() => "");
  const headers: Record<string, string> = {
    accept: "application/json",
    "user-agent": USER_AGENT,
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return { headers, authenticated: Boolean(token) };
}

export function hubListUrl(query: HubQuery, limit: number, sort = "downloads") {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.filter) params.set("filter", query.filter);
  if (query.pipelineTag) params.set("pipeline_tag", query.pipelineTag);
  params.set("sort", sort);
  params.set("direction", "-1");
  params.set("limit", String(limit));
  for (const field of EXPAND_FIELDS) params.append("expand[]", field);
  return `${HUB}/api/models?${params.toString()}`;
}

/** Public, human-browsable equivalent of a list query (for "Fuentes"). */
function browseUrl(query: HubQuery, sort = "downloads"): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.filter) params.set("other", query.filter);
  if (query.pipelineTag) params.set("pipeline_tag", query.pipelineTag);
  params.set("sort", sort);
  return `${HUB}/models?${params.toString()}`;
}

function describe(query: HubQuery): string {
  return [
    query.search ? `búsqueda «${query.search}»` : null,
    query.filter ? `etiqueta «${query.filter}»` : null,
    query.pipelineTag ? `pipeline ${query.pipelineTag}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

async function withCache<T>(
  env: ExtraEnv,
  key: string,
  freshMs: number,
  force: boolean,
  load: () => Promise<T>,
): Promise<{ payload: T; stale: boolean; cached: boolean }> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cached = (await env.CACHE.get(cacheKey, "json").catch(
    () => null,
  )) as Cached<T> | null;
  if (cached && !force && Date.now() - cached.savedAt < freshMs)
    return { payload: cached.payload, stale: false, cached: true };
  try {
    const payload = await load();
    await env.CACHE.put(
      cacheKey,
      JSON.stringify({ savedAt: Date.now(), payload }),
      { expirationTtl: KV_TTL_SECONDS },
    ).catch(() => undefined);
    return { payload, stale: false, cached: false };
  } catch (error) {
    if (cached) return { payload: cached.payload, stale: true, cached: true };
    throw error;
  }
}

async function fetchJson(url: string, headers: HeadersInit): Promise<unknown> {
  const response = await fetch(url, { headers });
  if (!response.ok)
    throw new Error(`Hugging Face respondió ${response.status} para ${url}`);
  return response.json();
}

async function loadPool(
  env: ExtraEnv,
  queries: Array<{ query: HubQuery; limit: number; sort?: string }>,
  keep: (model: HubModel) => boolean = () => true,
): Promise<HubPoolPayload> {
  const { headers, authenticated } = await hubHeaders(env);
  const settled = await Promise.allSettled(
    queries.map(({ query, limit, sort }) =>
      fetchJson(hubListUrl(query, limit, sort), headers),
    ),
  );
  const byId = new Map<string, HubModel>();
  const sources: HubSource[] = [];
  settled.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const { query, sort } = queries[index];
    sources.push({
      label: `Hugging Face · ${describe(query)} · orden ${sort ?? "downloads"}`,
      url: browseUrl(query, sort),
    });
    for (const model of normalizeHubList(result.value)) {
      if (!byId.has(model.id) && keep(model)) byId.set(model.id, model);
    }
  });
  if (!sources.length) {
    const reason = settled.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    throw new Error(
      reason?.reason instanceof Error
        ? reason.reason.message
        : "Hugging Face no respondió.",
    );
  }
  return {
    models: [...byId.values()],
    sources,
    fetchedAt: new Date().toISOString(),
    authenticated,
  };
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Reads the facts the UI needs from a raw config.json (text configs nest). */
export function parseConfigFacts(raw: unknown): HubConfigFacts | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const text =
    root.text_config && typeof root.text_config === "object"
      ? (root.text_config as Record<string, unknown>)
      : {};
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = finiteNumber(text[key]) ?? finiteNumber(root[key]);
      if (value !== null) return { key, value };
    }
    return null;
  };
  const context = pick(
    "max_position_embeddings",
    "max_sequence_length",
    "seq_length",
    "n_positions",
    "model_max_length",
  );
  return {
    contextLength: context?.value ?? null,
    contextField: context ? `config.json → ${context.key}` : null,
    numExperts:
      pick(
        "num_local_experts",
        "num_experts",
        "n_routed_experts",
        "moe_num_experts",
      )?.value ?? null,
    expertsPerToken:
      pick("num_experts_per_tok", "moe_top_k", "num_experts_per_token")
        ?.value ?? null,
    hiddenSize: pick("hidden_size", "d_model", "n_embd")?.value ?? null,
    layers: pick("num_hidden_layers", "n_layer", "num_layers")?.value ?? null,
  };
}

async function loadDetail(
  env: ExtraEnv,
  id: string,
): Promise<HubDetailPayload> {
  const { headers } = await hubHeaders(env);
  const path = id
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const raw = await fetchJson(`${HUB}/api/models/${path}?blobs=true`, headers);
  const model = normalizeHubModel(raw);
  if (!model) throw new Error("Respuesta de Hugging Face sin identificador.");
  const files = parseHubFiles((raw as Record<string, unknown>).siblings);
  const packages = summarizeFiles(files, {
    isMlx: model.formats.includes("mlx"),
  });
  const names = new Set(files.map((file) => file.name));

  const [configRaw, readme] = await Promise.all([
    names.has("config.json")
      ? fetchJson(`${HUB}/${path}/resolve/main/config.json`, headers).catch(
          () => null,
        )
      : Promise.resolve(null),
    names.has("README.md")
      ? fetch(`${HUB}/${path}/resolve/main/README.md`, { headers })
          .then((response) => (response.ok ? response.text() : ""))
          .catch(() => "")
      : Promise.resolve(""),
  ]);

  return {
    model,
    packages,
    config: parseConfigFacts(configRaw),
    limitations: readme ? extractLimitations(readme.slice(0, 200_000)) : null,
    sources: [
      { label: "Ficha en Hugging Face", url: `${HUB}/${id}` },
      {
        label: "API del hub (metadatos y tamaños)",
        url: `${HUB}/api/models/${id}?blobs=true`,
      },
      ...(configRaw
        ? [{ label: "config.json", url: `${HUB}/${id}/blob/main/config.json` }]
        : []),
    ],
    fetchedAt: new Date().toISOString(),
  };
}

const VALID_ID = /^[\w.-]+\/[\w.-]+$/;

export const modelHubRouter: ExtraRouter = async (request, env, url) => {
  if (!url.pathname.startsWith("/api/model-hub/")) return null;
  if (request.method !== "GET")
    return failure("method_not_allowed", "Solo se admite GET.", 405);
  const force = url.searchParams.get("refresh") === "1";
  const route = url.pathname.slice("/api/model-hub/".length);

  try {
    if (route === "specialty") {
      const id = url.searchParams.get("id") ?? "";
      if (!isSpecialtyId(id))
        return failure("invalid_specialty", "Especialidad desconocida.", 400);
      const specialty = SPECIALTY_BY_ID.get(id);
      if (!specialty)
        return failure("invalid_specialty", "Especialidad desconocida.", 400);
      const result = await withCache(
        env,
        `specialty:${id}`,
        POOL_FRESH_MS,
        force,
        () =>
          loadPool(
            env,
            specialty.queries.map((query) => ({ query, limit: 50 })),
            (model) => matchesSpecialty(model, id),
          ),
      );
      return respond(result.payload, {
        stale: result.stale,
        total: result.payload.models.length,
        sourceStatus: result.cached ? "cache" : "live",
      });
    }

    if (route === "search") {
      const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
      if (q.length < 2)
        return failure("invalid_query", "Escribe al menos 2 caracteres.", 400);
      const key = `search:${q.toLowerCase()}`;
      const result = await withCache(env, key, POOL_FRESH_MS, force, () =>
        loadPool(env, [{ query: { search: q }, limit: 50 }]),
      );
      return respond(result.payload, {
        stale: result.stale,
        total: result.payload.models.length,
        sourceStatus: result.cached ? "cache" : "live",
      });
    }

    if (route === "overview") {
      const result = await withCache(
        env,
        "overview",
        POOL_FRESH_MS,
        force,
        () =>
          loadPool(env, [
            { query: { pipelineTag: "text-generation" }, limit: 120 },
            {
              query: { pipelineTag: "text-generation" },
              limit: 60,
              sort: "trendingScore",
            },
            { query: { pipelineTag: "image-text-to-text" }, limit: 60 },
            { query: { pipelineTag: "any-to-any" }, limit: 30 },
          ]),
      );
      return respond(result.payload, {
        stale: result.stale,
        total: result.payload.models.length,
        sourceStatus: result.cached ? "cache" : "live",
      });
    }

    if (route === "model") {
      const id = url.searchParams.get("id") ?? "";
      if (!VALID_ID.test(id))
        return failure(
          "invalid_model",
          "Identificador de modelo inválido.",
          400,
        );
      const result = await withCache(
        env,
        `model:${id}`,
        DETAIL_FRESH_MS,
        force,
        () => loadDetail(env, id),
      );
      return respond(result.payload, {
        stale: result.stale,
        modelId: id,
        sourceStatus: result.cached ? "cache" : "live",
      });
    }
  } catch (error) {
    return failure(
      "hub_unavailable",
      error instanceof Error ? error.message : "Hugging Face no respondió.",
      502,
    );
  }

  return failure("not_found", "Ruta de model-hub desconocida.", 404);
};
