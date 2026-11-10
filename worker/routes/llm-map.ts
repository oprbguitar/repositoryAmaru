/**
 * GET /api/map/llm-origins — LLM developer organizations by country, derived
 * from model records already indexed in D1 (see lib/geo/llm-origins.ts).
 */
import {
  aggregateLlmOrigins,
  type LlmOriginsResponse,
  LONG_CONTEXT_TOKENS,
  type ModelInput,
  ORG_REGISTRY_VERIFIED,
} from "../../lib/geo/llm-origins";
import type { ExtraRouter } from "../extra-routes";

const CACHE_KEY = "map:llm-origins:v1";
const CACHE_TTL_SECONDS = 600;
const SOURCES = [
  {
    id: "openrouter",
    name: "OpenRouter (catálogo público)",
    url: "https://openrouter.ai/api/v1/models",
  },
  {
    id: "gemini-api",
    name: "Gemini API",
    url: "https://ai.google.dev/gemini-api/docs/models",
  },
  {
    id: "mistral-api",
    name: "Mistral API",
    url: "https://docs.mistral.ai/getting-started/models/models_overview/",
  },
  {
    id: "hugging-face",
    name: "Hugging Face Hub",
    url: "https://huggingface.co/models",
  },
] as const;

export const llmMapRouter: ExtraRouter = async (request, env, url) => {
  if (request.method !== "GET" || url.pathname !== "/api/map/llm-origins")
    return null;
  let data = await env.CACHE.get<LlmOriginsResponse>(CACHE_KEY, "json");
  if (!data || url.searchParams.get("force") === "1") {
    const rows = await env.DB.prepare(
      `SELECT source_id, external_id, data_json, last_successful_sync_at AS synced
       FROM observatory_records
       WHERE record_kind = 'model' AND source_id IN ('openrouter','gemini-api','mistral-api','hugging-face')`,
    ).all<{
      source_id: ModelInput["source"];
      external_id: string;
      data_json: string;
      synced: string | null;
    }>();
    const counts = new Map<string, number>();
    let asOf = "";
    const models: ModelInput[] = [];
    for (const row of rows.results) {
      counts.set(row.source_id, (counts.get(row.source_id) ?? 0) + 1);
      if (row.synced && row.synced > asOf) asOf = row.synced;
      try {
        models.push({
          source: row.source_id,
          externalId: row.external_id,
          data: JSON.parse(row.data_json) as Record<string, unknown>,
        });
      } catch {
        // Malformed record: skipped, never guessed.
      }
    }
    const providers = await env.DB.prepare(
      "SELECT id, name, country FROM providers",
    ).all<{ id: string; name: string; country: string | null }>();
    data = {
      ...aggregateLlmOrigins(models, providers.results),
      asOf: asOf || new Date().toISOString(),
      registryVerifiedAt: ORG_REGISTRY_VERIFIED,
      longContextTokens: LONG_CONTEXT_TOKENS,
      sources: SOURCES.map((s) => ({
        name: s.name,
        url: s.url,
        records: counts.get(s.id) ?? 0,
      })),
      notes: [
        "Abierto = el modelo declara un identificador de Hugging Face (OpenRouter) o proviene del Hub; cerrado = sin pesos públicos detectados; sin clasificar = solo aparece en una API de proveedor.",
        "Razonamiento, multimodal, herramientas y contexto largo se leen de los parámetros y modalidades de OpenRouter; MoE se infiere del nombre (p. ej. 8x7b, a22b) y es una heurística.",
        "Cobertura: solo modelos del catálogo indexado de organizaciones del registro. Los modelos de autores no registrados no se atribuyen a ningún país.",
      ],
    };
    await env.CACHE.put(CACHE_KEY, JSON.stringify(data), {
      expirationTtl: CACHE_TTL_SECONDS,
    });
  }
  return new Response(
    JSON.stringify({
      data,
      meta: {
        requestId: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        total: data.orgs.length,
        sourceStatus: data.orgs.length ? "ready" : "empty",
      },
    }),
    { headers: { "content-type": "application/json; charset=utf-8" } },
  );
};
