import {
  normalizeArxivXml,
  normalizeBcrp,
  normalizeCrossref,
  normalizeFrankfurter,
  normalizeGeminiModels,
  normalizeGitHub,
  normalizeHuggingFace,
  normalizeOfficialFeed,
  normalizeOpenAiCompatibleModels,
  normalizeOpenAlex,
  normalizeOpenRouter,
  normalizeSecCompanyConcept,
  normalizeSecSubmissions,
} from "../lib/external/normalizers";
import type {
  AdapterResult,
  NormalizedExternalRecord,
} from "../lib/external/types";
import {
  type ModuleSyncResult,
  syncOpenAlexInstitutions,
  syncOpenRouterRankings,
  syncYouTube,
} from "./modules";

export type ExternalEnv = {
  DB: D1Database;
  CACHE: KVNamespace;
  GITHUB_TOKEN?: string;
  HUGGINGFACE_TOKEN?: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  YOUTUBE_API_KEY?: string;
};

export type SourceRow = {
  id: string;
  name: string;
  base_url: string | null;
  endpoint: string | null;
  authentication_type: string;
  secret_binding_name: string | null;
  adapter_name: string | null;
  status: string;
};

export type SyncSummary = {
  runId: string;
  sourceId: string;
  status:
    | "completed"
    | "partial"
    | "failed"
    | "rate_limited"
    | "not_configured";
  discovered: number;
  stored: number;
  changed: number;
  error: string | null;
};

const PUBLIC_SOURCE_IDS = [
  "openrouter",
  "hugging-face",
  "arxiv",
  "openalex",
  "openalex-institutions",
  "crossref",
  "github",
  "openai-news",
  "sec-edgar",
  "sec-xbrl",
  "frankfurter",
  "bcrp",
] as const;

const KEY_SOURCE_IDS = [
  "openai-api",
  "gemini-api",
  "groq-api",
  "mistral-api",
] as const;

const USER_AGENT =
  "AMARU-AI-Observatory/0.1 (local-first research application)";

class SourceHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly rateLimitRemaining: number | null,
  ) {
    super(message);
  }
}

function rateLimit(headers: Headers): number | null {
  const value =
    headers.get("x-ratelimit-remaining") ?? headers.get("ratelimit-remaining");
  return value !== null && Number.isFinite(Number(value))
    ? Number(value)
    : null;
}

async function getResponse(
  url: string,
  options: { token?: string; accept?: string } = {},
): Promise<Response> {
  const headers = new Headers({
    accept: options.accept ?? "application/json",
    "user-agent": USER_AGENT,
  });
  if (options.token) headers.set("authorization", `Bearer ${options.token}`);
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new SourceHttpError(
      `La fuente respondió HTTP ${response.status}.`,
      response.status,
      rateLimit(response.headers),
    );
  }
  return response;
}

function uniqueRecords(
  records: NormalizedExternalRecord[],
): NormalizedExternalRecord[] {
  return [
    ...new Map(
      records.map((record) => [
        `${record.sourceId}:${record.externalId}`,
        record,
      ]),
    ).values(),
  ];
}

async function openRouterAdapter(now: string): Promise<AdapterResult> {
  const response = await getResponse("https://openrouter.ai/api/v1/models");
  return {
    records: normalizeOpenRouter(await response.json(), now),
    httpStatus: response.status,
    rateLimitRemaining: rateLimit(response.headers),
  };
}

async function huggingFaceAdapter(
  now: string,
  env: ExternalEnv,
): Promise<AdapterResult> {
  const headers = { token: env.HUGGINGFACE_TOKEN };
  const [models, datasets, spaces] = await Promise.all([
    getResponse(
      "https://huggingface.co/api/models?limit=100&sort=lastModified&direction=-1",
      headers,
    ),
    getResponse(
      "https://huggingface.co/api/datasets?limit=40&sort=lastModified&direction=-1",
      headers,
    ),
    getResponse(
      "https://huggingface.co/api/spaces?limit=40&sort=lastModified&direction=-1",
      headers,
    ),
  ]);
  const records = [
    ...normalizeHuggingFace(await models.json(), "model", now),
    ...normalizeHuggingFace(await datasets.json(), "dataset", now),
    ...normalizeHuggingFace(await spaces.json(), "space", now),
  ];
  return {
    records,
    httpStatus: 200,
    rateLimitRemaining: rateLimit(models.headers),
  };
}

async function arxivAdapter(now: string): Promise<AdapterResult> {
  const query = new URL("https://export.arxiv.org/api/query");
  query.searchParams.set("search_query", "cat:cs.AI OR cat:cs.CL OR cat:cs.LG");
  query.searchParams.set("start", "0");
  query.searchParams.set("max_results", "60");
  query.searchParams.set("sortBy", "submittedDate");
  query.searchParams.set("sortOrder", "descending");
  const response = await getResponse(query.toString(), {
    accept: "application/atom+xml",
  });
  return {
    records: normalizeArxivXml(await response.text(), now),
    httpStatus: response.status,
    rateLimitRemaining: rateLimit(response.headers),
  };
}

async function openAlexAdapter(now: string): Promise<AdapterResult> {
  const query = new URL("https://api.openalex.org/works");
  query.searchParams.set("search", "artificial intelligence");
  query.searchParams.set("filter", "from_publication_date:2025-01-01");
  query.searchParams.set("sort", "publication_date:desc");
  query.searchParams.set("per-page", "60");
  const response = await getResponse(query.toString());
  return {
    records: normalizeOpenAlex(await response.json(), now),
    httpStatus: response.status,
    rateLimitRemaining: rateLimit(response.headers),
  };
}

async function crossrefAdapter(now: string): Promise<AdapterResult> {
  const query = new URL("https://api.crossref.org/works");
  query.searchParams.set("query", "artificial intelligence");
  query.searchParams.set("filter", "from-pub-date:2025-01-01");
  query.searchParams.set("sort", "published");
  query.searchParams.set("order", "desc");
  query.searchParams.set("rows", "40");
  const response = await getResponse(query.toString());
  return {
    records: normalizeCrossref(await response.json(), now),
    httpStatus: response.status,
    rateLimitRemaining: rateLimit(response.headers),
  };
}

async function githubAdapter(
  now: string,
  env: ExternalEnv,
): Promise<AdapterResult> {
  // Orden por estrellas: el ranking por defecto del módulo GitHub es "Más estrellas".
  const queries = [
    "topic:llm",
    "topic:machine-learning",
    "topic:retrieval-augmented-generation",
    "topic:ai-agent",
    "topic:local-ai",
    "topic:speech-to-text",
    "topic:computer-vision",
    "topic:ollama",
    '"model context protocol" in:name,description',
    '"ai peru" in:name,description',
  ];
  const responses = [] as Response[];
  for (const queryText of queries) {
    const query = new URL("https://api.github.com/search/repositories");
    query.searchParams.set("q", queryText);
    query.searchParams.set("sort", "stars");
    query.searchParams.set("order", "desc");
    query.searchParams.set("per_page", "25");
    responses.push(
      await getResponse(query.toString(), { token: env.GITHUB_TOKEN }),
    );
  }
  const records: NormalizedExternalRecord[] = [];
  for (const response of responses)
    records.push(...normalizeGitHub(await response.json(), now));
  return {
    records: uniqueRecords(records),
    httpStatus: 200,
    rateLimitRemaining: rateLimit(responses.at(-1)?.headers ?? new Headers()),
  };
}

async function officialFeedAdapter(
  source: SourceRow,
  now: string,
): Promise<AdapterResult> {
  if (!source.endpoint)
    throw new Error("La fuente no tiene endpoint registrado.");
  const response = await getResponse(source.endpoint, {
    accept: "application/rss+xml, application/atom+xml, text/xml",
  });
  return {
    records: normalizeOfficialFeed(
      await response.text(),
      {
        id: source.id,
        name: source.name,
        baseUrl: source.base_url ?? source.endpoint,
      },
      now,
    ),
    httpStatus: response.status,
    rateLimitRemaining: rateLimit(response.headers),
  };
}

// Empresas cotizadas relevantes para IA (CIK oficiales de la SEC).
const SEC_AI_COMPANIES: Array<{ cik: string; providerId: string | null }> = [
  { cik: "0001045810", providerId: "nvidia" }, // NVIDIA
  { cik: "0000789019", providerId: null }, // Microsoft
  { cik: "0001652044", providerId: "google-gemini" }, // Alphabet
  { cik: "0001326801", providerId: null }, // Meta Platforms
  { cik: "0000002488", providerId: null }, // AMD
  { cik: "0001321655", providerId: null }, // Palantir
];

async function secAdapter(now: string): Promise<AdapterResult> {
  const records: NormalizedExternalRecord[] = [];
  let lastStatus = 200;
  for (const company of SEC_AI_COMPANIES) {
    const response = await getResponse(
      `https://data.sec.gov/submissions/CIK${company.cik}.json`,
    );
    lastStatus = response.status;
    records.push(
      ...normalizeSecSubmissions(await response.json(), now, {
        providerId: company.providerId,
        limit: 8,
      }),
    );
  }
  return {
    records,
    httpStatus: lastStatus,
    rateLimitRemaining: null,
  };
}

const SEC_METRICS = [
  { tag: "Revenues", label: "Ingresos" },
  {
    tag: "RevenueFromContractWithCustomerExcludingAssessedTax",
    label: "Ingresos",
  },
  { tag: "NetIncomeLoss", label: "Utilidad neta" },
] as const;

async function secXbrlAdapter(now: string): Promise<AdapterResult> {
  const records: NormalizedExternalRecord[] = [];
  let lastStatus = 200;
  for (const company of SEC_AI_COMPANIES) {
    const seenMetricLabels = new Set<string>();
    for (const metric of SEC_METRICS) {
      // Las empresas usan etiquetas distintas para ingresos; se toma la primera
      // etiqueta con datos y no se mezclan valores de etiquetas diferentes.
      if (seenMetricLabels.has(metric.label)) continue;
      try {
        const response = await getResponse(
          `https://data.sec.gov/api/xbrl/companyconcept/CIK${company.cik}/us-gaap/${metric.tag}.json`,
        );
        lastStatus = response.status;
        const normalized = normalizeSecCompanyConcept(
          await response.json(),
          metric,
          now,
          company.providerId,
        );
        if (normalized.length) {
          records.push(...normalized);
          seenMetricLabels.add(metric.label);
        }
      } catch {
        // Etiqueta sin datos para esta empresa: se intenta la siguiente.
      }
    }
  }
  return { records, httpStatus: lastStatus, rateLimitRemaining: null };
}

async function frankfurterAdapter(now: string): Promise<AdapterResult> {
  const response = await getResponse(
    "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,JPY,CNY,BRL,MXN,CLP,COP",
  );
  return {
    records: normalizeFrankfurter(await response.json(), now),
    httpStatus: response.status,
    rateLimitRemaining: rateLimit(response.headers),
  };
}

async function bcrpAdapter(now: string): Promise<AdapterResult> {
  const until = now.slice(0, 10);
  const from = new Date(new Date(now).getTime() - 45 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const response = await getResponse(
    `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04640PD/json/${from}/${until}`,
  );
  return {
    records: normalizeBcrp(await response.json(), now),
    httpStatus: response.status,
    rateLimitRemaining: rateLimit(response.headers),
  };
}

async function accountModelsAdapter(
  source: SourceRow,
  now: string,
  env: ExternalEnv,
): Promise<AdapterResult> {
  const definitions: Record<
    string,
    { token?: string; name: string; providerId: string; modelsUrl: string }
  > = {
    "openai-api": {
      token: env.OPENAI_API_KEY,
      name: "OpenAI Models API",
      providerId: "openai",
      modelsUrl: "https://platform.openai.com/docs/models",
    },
    "groq-api": {
      token: env.GROQ_API_KEY,
      name: "Groq Models API",
      providerId: "groq",
      modelsUrl: "https://console.groq.com/docs/models",
    },
    "mistral-api": {
      token: env.MISTRAL_API_KEY,
      name: "Mistral Models API",
      providerId: "mistral",
      modelsUrl:
        "https://docs.mistral.ai/getting-started/models/models_overview/",
    },
  };
  if (!source.endpoint)
    throw new Error("La fuente no tiene endpoint registrado.");
  if (source.id === "gemini-api") {
    const query = new URL(source.endpoint);
    query.searchParams.set("key", env.GEMINI_API_KEY ?? "");
    const response = await getResponse(query.toString());
    return {
      records: normalizeGeminiModels(await response.json(), now),
      httpStatus: response.status,
      rateLimitRemaining: rateLimit(response.headers),
    };
  }
  const definition = definitions[source.id];
  if (!definition) throw new Error(`No existe definición para ${source.id}.`);
  const response = await getResponse(source.endpoint, {
    token: definition.token,
  });
  return {
    records: normalizeOpenAiCompatibleModels(
      await response.json(),
      {
        id: source.id,
        name: definition.name,
        providerId: definition.providerId,
        modelsUrl: definition.modelsUrl,
      },
      now,
    ),
    httpStatus: response.status,
    rateLimitRemaining: rateLimit(response.headers),
  };
}

export async function runAdapter(
  source: SourceRow,
  now: string,
  env: ExternalEnv,
): Promise<AdapterResult> {
  switch (source.adapter_name) {
    case "openrouter":
      return openRouterAdapter(now);
    case "hugging-face":
      return huggingFaceAdapter(now, env);
    case "arxiv":
      return arxivAdapter(now);
    case "openalex":
      return openAlexAdapter(now);
    case "crossref":
      return crossrefAdapter(now);
    case "github":
      return githubAdapter(now, env);
    case "official-feed":
      return officialFeedAdapter(source, now);
    case "sec-edgar":
      return secAdapter(now);
    case "sec-xbrl":
      return secXbrlAdapter(now);
    case "frankfurter":
      return frankfurterAdapter(now);
    case "bcrp":
      return bcrpAdapter(now);
    case "openai-api":
    case "gemini-api":
    case "groq-api":
    case "mistral-api":
      return accountModelsAdapter(source, now, env);
    default:
      throw new Error(`No existe un adaptador activo para ${source.id}.`);
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function persistRecords(
  source: SourceRow,
  records: NormalizedExternalRecord[],
  env: ExternalEnv,
): Promise<{ stored: number; changed: number }> {
  const existingRows = await env.DB.prepare(
    "SELECT external_id, content_hash FROM observatory_records WHERE source_id = ?",
  )
    .bind(source.id)
    .all<{ external_id: string; content_hash: string }>();
  const existing = new Map(
    existingRows.results.map((row) => [row.external_id, row.content_hash]),
  );
  const statements: D1PreparedStatement[] = [];
  let changed = 0;
  for (const record of records) {
    const dataJson = JSON.stringify(record.data);
    const contentHash = await sha256(
      JSON.stringify({
        title: record.title,
        summary: record.summary,
        data: record.data,
      }),
    );
    const id = await sha256(`${record.sourceId}:${record.externalId}`);
    const previousHash = existing.get(record.externalId);
    if (previousHash !== contentHash) changed += 1;
    statements.push(
      env.DB.prepare(`
      INSERT INTO observatory_records (
        id, source_id, record_kind, external_id, title, summary, original_url, source_name, source_type,
        published_at, detected_at, retrieved_at, verification_status, confidence_level, language, country_region,
        last_successful_sync_at, provider_id, data_json, content_hash, first_seen_at, last_seen_at, is_stale
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(source_id, external_id) DO UPDATE SET
        title = excluded.title, summary = excluded.summary, original_url = excluded.original_url,
        published_at = excluded.published_at, retrieved_at = excluded.retrieved_at,
        verification_status = excluded.verification_status, confidence_level = excluded.confidence_level,
        language = excluded.language, country_region = excluded.country_region,
        last_successful_sync_at = excluded.last_successful_sync_at, provider_id = excluded.provider_id,
        data_json = excluded.data_json, content_hash = excluded.content_hash, last_seen_at = excluded.last_seen_at,
        is_stale = 0
    `).bind(
        id,
        record.sourceId,
        record.recordKind,
        record.externalId,
        record.title,
        record.summary,
        record.originalUrl,
        record.sourceName,
        record.sourceType,
        record.publishedAt,
        record.detectedAt,
        record.retrievedAt,
        record.verificationStatus,
        record.confidenceLevel,
        record.language,
        record.countryRegion,
        record.lastSuccessfulSyncAt,
        record.providerId,
        dataJson,
        contentHash,
        record.detectedAt,
        record.retrievedAt,
      ),
    );
    if (!previousHash || previousHash !== contentHash) {
      const eventType = !previousHash
        ? `new_${record.recordKind}`
        : `updated_${record.recordKind}`;
      const target =
        record.recordKind === "model"
          ? "/models"
          : record.recordKind === "paper"
            ? "/research"
            : record.recordKind === "repository"
              ? "/github"
              : record.recordKind === "news"
                ? "/news"
                : "/markets";
      statements.push(
        env.DB.prepare(`
        INSERT INTO live_events (id, event_type, record_id, title, event_at, source_name, target_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
          crypto.randomUUID(),
          eventType,
          id,
          record.title,
          record.retrievedAt,
          record.sourceName,
          target,
        ),
      );
    }
    if (record.recordKind === "repository") {
      statements.push(
        env.DB.prepare(`
        INSERT INTO repository_snapshots (id, record_id, snapshot_date, stars, forks, open_issues, captured_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(record_id, snapshot_date) DO UPDATE SET stars = excluded.stars, forks = excluded.forks,
          open_issues = excluded.open_issues, captured_at = excluded.captured_at
      `).bind(
          crypto.randomUUID(),
          id,
          record.retrievedAt.slice(0, 10),
          Number(record.data.stars ?? 0),
          Number(record.data.forks ?? 0),
          Number(record.data.openIssues ?? 0),
          record.retrievedAt,
        ),
      );
    }
  }
  for (let index = 0; index < statements.length; index += 60) {
    await env.DB.batch(statements.slice(index, index + 60));
  }
  return { stored: records.length, changed };
}

export function credentialConfigured(
  source: SourceRow,
  env: ExternalEnv,
): boolean {
  if (
    source.authentication_type === "none" ||
    source.authentication_type === "optional_bearer"
  )
    return true;
  if (!source.secret_binding_name) return false;
  return Boolean(
    (env as unknown as Record<string, unknown>)[source.secret_binding_name],
  );
}

export async function synchronizeSource(
  sourceId: string,
  env: ExternalEnv,
): Promise<SyncSummary> {
  const source = await env.DB.prepare(`
    SELECT id, name, base_url, endpoint, authentication_type, secret_binding_name, adapter_name, status
    FROM source_registry WHERE id = ? AND is_enabled = 1 LIMIT 1
  `)
    .bind(sourceId)
    .first<SourceRow>();
  const runId = crypto.randomUUID();
  const requestedAt = new Date().toISOString();
  if (!source) {
    return {
      runId,
      sourceId,
      status: "failed",
      discovered: 0,
      stored: 0,
      changed: 0,
      error: "Fuente inexistente o desactivada.",
    };
  }
  if (!credentialConfigured(source, env)) {
    await env.DB.prepare(`INSERT INTO synchronization_runs
      (id, source_id, scope, status, requested_at, completed_at, error_message)
      VALUES (?, ?, ?, 'not_configured', ?, ?, ?)`)
      .bind(
        runId,
        sourceId,
        sourceId,
        requestedAt,
        requestedAt,
        `Falta ${source.secret_binding_name}`,
      )
      .run();
    return {
      runId,
      sourceId,
      status: "not_configured",
      discovered: 0,
      stored: 0,
      changed: 0,
      error: `Falta ${source.secret_binding_name}`,
    };
  }
  await env.DB.prepare(`INSERT INTO synchronization_runs
    (id, source_id, scope, status, requested_at, started_at) VALUES (?, ?, ?, 'running', ?, ?)`)
    .bind(runId, sourceId, sourceId, requestedAt, requestedAt)
    .run();
  await env.DB.prepare(
    "UPDATE source_registry SET last_request_at = ?, status = 'running' WHERE id = ?",
  )
    .bind(requestedAt, sourceId)
    .run();
  try {
    // Adaptadores de módulo con persistencia propia (tablas dedicadas)
    let moduleResult: ModuleSyncResult | null = null;
    if (source.adapter_name === "youtube")
      moduleResult = await syncYouTube(env, requestedAt);
    else if (source.adapter_name === "openalex-institutions")
      moduleResult = await syncOpenAlexInstitutions(env, requestedAt);

    let records: NormalizedExternalRecord[] = [];
    let persisted = { stored: 0, changed: 0 };
    let httpStatus = moduleResult?.httpStatus ?? 200;
    let rateLimitRemaining = moduleResult?.rateLimitRemaining ?? null;
    let discovered = moduleResult?.discovered ?? 0;
    if (!moduleResult) {
      const result = await runAdapter(source, requestedAt, env);
      records = uniqueRecords(result.records);
      persisted = await persistRecords(source, records, env);
      httpStatus = result.httpStatus;
      rateLimitRemaining = result.rateLimitRemaining;
      discovered = records.length;
      if (source.id === "openrouter") {
        // Rankings y ofertas por proveedor acompañan la sincronización del catálogo.
        const rankings = await syncOpenRouterRankings(env, requestedAt);
        discovered += rankings.discovered;
        persisted = {
          stored: persisted.stored + rankings.stored,
          changed: persisted.changed + rankings.changed,
        };
      }
    } else {
      persisted = {
        stored: moduleResult.stored,
        changed: moduleResult.changed,
      };
    }
    const completedAt = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare(`UPDATE source_registry SET status = 'connected', configured = 1,
        last_success_at = ?, last_http_status = ?, last_error = NULL, record_count = ?,
        rate_limit_remaining = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(
        completedAt,
        httpStatus,
        discovered,
        rateLimitRemaining,
        sourceId,
      ),
      env.DB.prepare(`UPDATE synchronization_runs SET status = 'completed', completed_at = ?,
        discovered_count = ?, stored_count = ?, changed_count = ?, http_status = ?, rate_limit_remaining = ? WHERE id = ?`).bind(
        completedAt,
        discovered,
        persisted.stored,
        persisted.changed,
        httpStatus,
        rateLimitRemaining,
        runId,
      ),
    ]);
    await env.CACHE.delete("observatory:dashboard");
    return {
      runId,
      sourceId,
      status: "completed",
      discovered,
      stored: persisted.stored,
      changed: persisted.changed,
      error: null,
    };
  } catch (error) {
    const completedAt = new Date().toISOString();
    const httpStatus = error instanceof SourceHttpError ? error.status : null;
    const remaining =
      error instanceof SourceHttpError ? error.rateLimitRemaining : null;
    const message =
      error instanceof Error
        ? error.message.slice(0, 500)
        : "Fallo desconocido";
    const status = httpStatus === 429 ? "rate_limited" : "failed";
    await env.DB.batch([
      env.DB.prepare(`UPDATE source_registry SET status = ?, last_failure_at = ?, last_http_status = ?,
        last_error = ?, rate_limit_remaining = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(
        status,
        completedAt,
        httpStatus,
        message,
        remaining,
        sourceId,
      ),
      env.DB.prepare(`UPDATE synchronization_runs SET status = ?, completed_at = ?, error_message = ?,
        http_status = ?, rate_limit_remaining = ? WHERE id = ?`).bind(
        status,
        completedAt,
        message,
        httpStatus,
        remaining,
        runId,
      ),
    ]);
    return {
      runId,
      sourceId,
      status,
      discovered: 0,
      stored: 0,
      changed: 0,
      error: message,
    };
  }
}

export async function synchronizeScope(
  scope: string,
  env: ExternalEnv,
): Promise<SyncSummary[]> {
  const mapping: Record<string, readonly string[]> = {
    all: [...PUBLIC_SOURCE_IDS, ...KEY_SOURCE_IDS],
    public: PUBLIC_SOURCE_IDS,
    providers: ["openrouter", "hugging-face", ...KEY_SOURCE_IDS],
    models: ["openrouter", "hugging-face", ...KEY_SOURCE_IDS],
    news: ["openai-news"],
    research: ["arxiv", "openalex", "crossref"],
    github: ["github"],
    market: ["sec-edgar", "sec-xbrl", "bcrp", "frankfurter"],
    map: ["openalex-institutions", "openalex"],
    videos: ["youtube"],
    failed: [],
  };
  let sourceIds = mapping[scope] ?? [scope];
  if (scope === "failed") {
    const failed = await env.DB.prepare(
      "SELECT id FROM source_registry WHERE is_enabled = 1 AND status IN ('failed','rate_limited')",
    ).all<{ id: string }>();
    sourceIds = failed.results.map((row) => row.id);
  }
  const summaries: SyncSummary[] = [];
  for (const sourceId of sourceIds)
    summaries.push(await synchronizeSource(sourceId, env));
  return summaries;
}

export async function dueSourceIds(env: ExternalEnv): Promise<string[]> {
  const result = await env.DB.prepare(`
    SELECT id FROM source_registry WHERE is_enabled = 1 AND source_type != 'local_directory'
      AND (last_success_at IS NULL OR datetime(last_success_at, '+' || update_frequency_minutes || ' minutes') <= CURRENT_TIMESTAMP)
    ORDER BY CASE WHEN last_success_at IS NULL THEN 0 ELSE 1 END, last_success_at ASC LIMIT 12
  `).all<{ id: string }>();
  return result.results.map((row) => row.id);
}
