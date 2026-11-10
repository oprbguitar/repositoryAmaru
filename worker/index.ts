import { LATAM_CODES } from "../lib/geo/countries";
import type { ProjectInputs } from "../lib/laboratory/engine";
import {
  importBatchSchema,
  type ValidatedImportBatch,
} from "../lib/validation/local-import";
import type {
  ApiResponse,
  DocumentAnalysis,
  LibraryStats,
  LiveEvent,
  LocalDocument,
  ObservatoryDashboard,
  ObservatoryRecord,
  ProviderRecord,
  SourceHealth,
} from "../types/api";
import { developerLabRouter } from "./developer-lab/router";
import {
  dueSourceIds,
  type ExternalEnv,
  synchronizeScope,
  synchronizeSource,
} from "./external";
import { type ExtraEnv, extraRouters } from "./extra-routes";
import {
  deleteIntegration,
  listIntegrations,
  resolveSecret,
  saveIntegration,
  testIntegration,
  withStoredSecrets,
} from "./integrations";
import { getMarketQuotes } from "./market";
import {
  deleteLaboratoryProject,
  getCountryPanel,
  getGithubRankings,
  getGlobalMap,
  getLaboratoryProject,
  getModelDetail,
  getModelOfferings,
  getModelRankings,
  getPriceHistory,
  getProviderModels,
  getRegionalMap,
  listLaboratoryProjects,
  listVideos,
  recommendForProject,
  saveLaboratoryProject,
} from "./modules";

type Env = {
  DB: D1Database;
  RAW_BUCKET?: R2Bucket;
  CACHE: KVNamespace;
  INDEX_QUEUE?: Queue<IndexJob>;
  ASSETS: Fetcher;
  AI?: Ai;
  APP_ENV: string;
  APP_LOCALE: string;
  ENABLE_DEMO_DATA: string;
  ENABLE_WORKERS_AI: string;
  ENABLE_VECTOR_SEARCH: string;
  ENABLE_DEVELOPER_LAB?: string;
  ENABLE_PROVIDER_RAW_INSPECTOR?: string;
  ENABLE_LOCAL_AI_PROVIDERS?: string;
  ENABLE_AGENT_TESTS?: string;
  ENABLE_RAG_TESTS?: string;
  ENABLE_MEDIA_TESTS?: string;
  ENABLE_VIDEO_TESTS?: string;
  DEVELOPER_LAB_ENCRYPTION_KEY?: string;
  DEVELOPER_LAB_INTERNAL_TOKEN?: string;
  LOCAL_IMPORT_TOKEN?: string;
  CRON_SECRET?: string;
  GITHUB_TOKEN?: string;
  HUGGINGFACE_TOKEN?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GROQ_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  COHERE_API_KEY?: string;
  TOGETHER_API_KEY?: string;
  FIREWORKS_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  XAI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPINFRA_API_KEY?: string;
  REPLICATE_API_TOKEN?: string;
  STABILITY_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  DEEPGRAM_API_KEY?: string;
  ASSEMBLYAI_API_KEY?: string;
  YOUTUBE_API_KEY?: string;
  NVIDIA_API_KEY?: string;
  NVIDIA_MODEL?: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
  INSTAGRAM_ACCESS_TOKEN?: string;
  INSTAGRAM_BUSINESS_ACCOUNT_ID?: string;
  X_BEARER_TOKEN?: string;
  FINNHUB_API_KEY?: string;
  SEMANTIC_SCHOLAR_API_KEY?: string;
  CORE_API_KEY?: string;
  OLLAMA_BASE_URL?: string;
  LM_STUDIO_BASE_URL?: string;
  VLLM_BASE_URL?: string;
  LOCALAI_BASE_URL?: string;
};

type IndexJob = {
  sourceId: string;
  requestedAt: string;
  reason: "scheduled" | "manual";
};

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const SECURITY_HEADERS = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://i.ytimg.com https://*.fbcdn.net https://scontent.xx.fbcdn.net; connect-src 'self' https://tiles.openfreemap.org; font-src 'self'; worker-src 'self' blob:; child-src blob:; frame-src https://www.youtube-nocookie.com https://www.facebook.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

function requestId(): string {
  return crypto.randomUUID();
}

function envelope<T>(
  data: T,
  options: Partial<ApiResponse<T>["meta"]> & {
    errors?: ApiResponse<T>["errors"];
  } = {},
): ApiResponse<T> {
  const { errors, ...meta } = options;
  return {
    data,
    meta: {
      requestId: requestId(),
      generatedAt: new Date().toISOString(),
      ...meta,
    },
    ...(errors?.length ? { errors } : {}),
  };
}

function json<T>(payload: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
): Response {
  return json(envelope(null, { errors: [{ code, message }] }), status);
}

function mapDocument(
  row: Record<string, unknown>,
  withText = false,
): LocalDocument {
  return {
    id: String(row.id),
    relativePath: String(row.relative_path),
    fileName: String(row.file_name),
    extension: String(row.extension),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    modifiedAt: String(row.modified_at),
    sha256: String(row.sha256),
    parserName: String(row.parser_name),
    parserVersion: String(row.parser_version),
    ingestionStatus: row.ingestion_status as LocalDocument["ingestionStatus"],
    ingestedAt: String(row.ingested_at),
    lastError: row.last_error ? String(row.last_error) : null,
    detectedTitle: row.detected_title ? String(row.detected_title) : null,
    summary: row.summary ? String(row.summary) : null,
    ...(withText
      ? {
          extractedText: row.extracted_text ? String(row.extracted_text) : null,
        }
      : {}),
    tags: parseTags(row.tags_json),
    origin: row.origin ? String(row.origin) : null,
    sourceAlias: String(row.source_alias),
    isRelevant: Boolean(row.is_relevant),
    inWatchlist: Boolean(row.in_watchlist),
  };
}

function parseTags(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

async function getStatus(env: Env): Promise<Response> {
  let databaseStatus: LibraryStats["databaseStatus"] = "ready";
  let lastScanAt: string | null = null;
  let discovered = 0;
  let processed = 0;
  let rejected = 0;
  let warnings = 0;
  let unsupported = 0;
  let types: LibraryStats["types"] = [];

  try {
    const [counts, latest, typeRows] = await Promise.all([
      env.DB.prepare(`
        SELECT COUNT(*) AS discovered,
          SUM(CASE WHEN ingestion_status = 'processed' THEN 1 ELSE 0 END) AS processed,
          SUM(CASE WHEN ingestion_status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
          SUM(CASE WHEN ingestion_status = 'warning' THEN 1 ELSE 0 END) AS warnings,
          SUM(CASE WHEN ingestion_status = 'unsupported' THEN 1 ELSE 0 END) AS unsupported
        FROM local_documents
      `).first<Record<string, number>>(),
      env.DB.prepare(
        "SELECT completed_at FROM import_runs ORDER BY started_at DESC LIMIT 1",
      ).first<{
        completed_at: string | null;
      }>(),
      env.DB.prepare(
        "SELECT UPPER(CASE WHEN extension = '' THEN 'OTRO' ELSE extension END) AS label, COUNT(*) AS count FROM local_documents GROUP BY extension ORDER BY count DESC LIMIT 8",
      ).all<{ label: string; count: number }>(),
    ]);
    discovered = Number(counts?.discovered ?? 0);
    processed = Number(counts?.processed ?? 0);
    rejected = Number(counts?.rejected ?? 0);
    warnings = Number(counts?.warnings ?? 0);
    unsupported = Number(counts?.unsupported ?? 0);
    lastScanAt = latest?.completed_at ?? null;
    types = typeRows.results.map((row) => ({
      label: row.label,
      count: Number(row.count),
    }));
  } catch (error) {
    databaseStatus =
      error instanceof Error && error.message.includes("no such table")
        ? "needs_migration"
        : "unavailable";
  }

  let cacheStatus: LibraryStats["cacheStatus"] = "ready";
  try {
    await env.CACHE.put("health:last-check", new Date().toISOString(), {
      expirationTtl: 300,
    });
  } catch {
    cacheStatus = "unavailable";
  }

  const stats: LibraryStats = {
    discovered,
    processed,
    rejected,
    warnings,
    unsupported,
    lastScanAt,
    directoryAlias: "Biblioteca local",
    databaseStatus,
    objectStorageStatus: env.RAW_BUCKET ? "ready" : "unavailable",
    cacheStatus,
    types,
  };
  return json(
    envelope(stats, {
      sourceStatus: databaseStatus === "ready" ? "ready" : databaseStatus,
    }),
  );
}

async function listDocuments(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  const status = (url.searchParams.get("status") ?? "").trim();
  const extension = (url.searchParams.get("type") ?? "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? 30), 1),
    100,
  );
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (search) {
    conditions.push(
      "(file_name LIKE ? OR detected_title LIKE ? OR summary LIKE ? OR tags_json LIKE ?)",
    );
    const pattern = `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    bindings.push(pattern, pattern, pattern, pattern);
  }
  if (["processed", "warning", "rejected", "unsupported"].includes(status)) {
    conditions.push("ingestion_status = ?");
    bindings.push(status);
  }
  if (extension) {
    conditions.push("extension = ?");
    bindings.push(extension);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const count = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM local_documents ${where}`,
  )
    .bind(...bindings)
    .first<{ total: number }>();
  const rows = await env.DB.prepare(
    `SELECT * FROM local_documents ${where} ORDER BY modified_at DESC, file_name ASC LIMIT ? OFFSET ?`,
  )
    .bind(...bindings, limit, offset)
    .all<Record<string, unknown>>();
  const total = Number(count?.total ?? 0);
  const nextOffset = offset + rows.results.length;
  return json(
    envelope(
      rows.results.map((row) => mapDocument(row)),
      {
        total,
        nextCursor: nextOffset < total ? String(nextOffset) : undefined,
        sourceStatus: "ready",
      },
    ),
  );
}

async function getDocument(id: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    "SELECT * FROM local_documents WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!row)
    return errorResponse(
      "not_found",
      "No se encontró el documento solicitado.",
      404,
    );
  return json(envelope(mapDocument(row, true), { sourceStatus: "ready" }));
}

async function updateDocument(
  request: Request,
  id: string,
  env: Env,
): Promise<Response> {
  if (request.headers.get("x-amaru-csrf") !== "local-ui") {
    return errorResponse(
      "csrf_failed",
      "La solicitud no incluye la protección requerida.",
      403,
    );
  }
  const body = (await request.json().catch(() => null)) as {
    isRelevant?: unknown;
    inWatchlist?: unknown;
  } | null;
  if (
    !body ||
    (typeof body.isRelevant !== "boolean" &&
      typeof body.inWatchlist !== "boolean")
  ) {
    return errorResponse(
      "invalid_payload",
      "La actualización no es válida.",
      400,
    );
  }
  const current = await env.DB.prepare(
    "SELECT is_relevant, in_watchlist FROM local_documents WHERE id = ?",
  )
    .bind(id)
    .first<{ is_relevant: number; in_watchlist: number }>();
  if (!current)
    return errorResponse(
      "not_found",
      "No se encontró el documento solicitado.",
      404,
    );
  await env.DB.prepare(
    "UPDATE local_documents SET is_relevant = ?, in_watchlist = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  )
    .bind(
      typeof body.isRelevant === "boolean"
        ? Number(body.isRelevant)
        : current.is_relevant,
      typeof body.inWatchlist === "boolean"
        ? Number(body.inWatchlist)
        : current.in_watchlist,
      id,
    )
    .run();
  return getDocument(id, env);
}

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";
const ANALYSIS_CACHE_VERSION = "v1";
const ANALYSIS_MAX_INPUT_CHARS = 14_000;
const ANALYSIS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

function analysisCacheKey(id: string, sha256: string): string {
  return `analysis:${ANALYSIS_CACHE_VERSION}:${id}:${sha256}`;
}

function toStringArray(value: unknown, limit = 10): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, limit)
    : [];
}

function parseAnalysisContent(
  content: string,
  documentId: string,
  model: string,
): DocumentAnalysis {
  const generatedAt = new Date().toISOString();
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(content.slice(start, end + 1)) as Record<
        string,
        unknown
      >;
      return {
        documentId,
        model,
        generatedAt,
        summary:
          typeof parsed.resumen === "string" && parsed.resumen.trim()
            ? parsed.resumen.trim()
            : content.trim(),
        keyPoints: toStringArray(parsed.puntos_clave),
        entities: toStringArray(parsed.entidades),
        risks: toStringArray(parsed.riesgos),
        recommendations: toStringArray(parsed.recomendaciones),
      };
    } catch {
      // El modelo no devolvió JSON válido: conservar el texto completo.
    }
  }
  return {
    documentId,
    model,
    generatedAt,
    summary: content.trim(),
    keyPoints: [],
    entities: [],
    risks: [],
    recommendations: [],
  };
}

async function getDocumentAnalysis(id: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    "SELECT id, sha256 FROM local_documents WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<{ id: string; sha256: string }>();
  if (!row)
    return errorResponse(
      "not_found",
      "No se encontró el documento solicitado.",
      404,
    );
  const cached = await env.CACHE.get<DocumentAnalysis>(
    analysisCacheKey(row.id, row.sha256),
    "json",
  );
  const apiKey = await resolveSecret(env, "NVIDIA_API_KEY");
  return json(
    envelope(cached ?? null, {
      sourceStatus: apiKey ? "ready" : "not_configured",
    }),
  );
}

async function analyzeDocument(
  request: Request,
  id: string,
  env: Env,
): Promise<Response> {
  if (request.headers.get("x-amaru-csrf") !== "local-ui") {
    return errorResponse(
      "csrf_failed",
      "La solicitud no incluye la protección requerida.",
      403,
    );
  }
  const apiKey = await resolveSecret(env, "NVIDIA_API_KEY");
  if (!apiKey) {
    return errorResponse(
      "not_configured",
      "La clave NVIDIA_API_KEY no está configurada. Añádela en Configuración › Integraciones.",
      503,
    );
  }
  const row = await env.DB.prepare(
    "SELECT id, sha256, file_name, detected_title, summary, extracted_text FROM local_documents WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<{
      id: string;
      sha256: string;
      file_name: string;
      detected_title: string | null;
      summary: string | null;
      extracted_text: string | null;
    }>();
  if (!row)
    return errorResponse(
      "not_found",
      "No se encontró el documento solicitado.",
      404,
    );
  const text = (row.extracted_text ?? row.summary ?? "").trim();
  if (!text) {
    return errorResponse(
      "no_text",
      "El documento no tiene texto extraído para analizar.",
      422,
    );
  }
  const force = new URL(request.url).searchParams.get("force") === "1";
  const cacheKey = analysisCacheKey(row.id, row.sha256);
  if (!force) {
    const cached = await env.CACHE.get<DocumentAnalysis>(cacheKey, "json");
    if (cached) return json(envelope(cached, { sourceStatus: "ready" }));
  }
  const model = env.NVIDIA_MODEL?.trim() || DEFAULT_NVIDIA_MODEL;
  const title = row.detected_title || row.file_name;
  const upstream = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "Eres un analista documental. Respondes únicamente con un objeto JSON válido, en español, con las claves: resumen (string), puntos_clave (array de strings), entidades (array de strings), riesgos (array de strings), recomendaciones (array de strings). No inventes datos que no estén en el documento.",
        },
        {
          role: "user",
          content: `Analiza el siguiente documento titulado «${title}». Devuelve solo el JSON pedido.\n\n---\n${text.slice(0, ANALYSIS_MAX_INPUT_CHARS)}`,
        },
      ],
    }),
  });
  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("nvidia_analysis_failed", {
      status: upstream.status,
      detail: detail.slice(0, 300),
    });
    return errorResponse(
      "upstream_error",
      `La API de NVIDIA respondió ${upstream.status}. Revisa la clave y la cuota.`,
      502,
    );
  }
  const completion = (await upstream.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string } }>;
  } | null;
  const content = completion?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return errorResponse(
      "upstream_error",
      "La API de NVIDIA no devolvió contenido analizable.",
      502,
    );
  }
  const analysis = parseAnalysisContent(content, row.id, model);
  await env.CACHE.put(cacheKey, JSON.stringify(analysis), {
    expirationTtl: ANALYSIS_CACHE_TTL_SECONDS,
  });
  return json(envelope(analysis, { sourceStatus: "ready" }));
}

async function secureTokenMatches(
  request: Request,
  expected?: string,
): Promise<boolean> {
  if (!expected) return false;
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const encoder = new TextEncoder();
  const [expectedHash, suppliedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
  ]);
  const left = new Uint8Array(expectedHash);
  const right = new Uint8Array(suppliedHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < left.length; index += 1)
    difference |= left[index] ^ (right[index] ?? 0);
  return difference === 0;
}

async function importLocal(request: Request, env: Env): Promise<Response> {
  if (!(await secureTokenMatches(request, env.LOCAL_IMPORT_TOKEN))) {
    return errorResponse(
      "authentication_error",
      "El token de importación no es válido.",
      401,
    );
  }
  const raw = await request.json().catch(() => null);
  const parsed = importBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      envelope(null, {
        errors: [
          {
            code: "invalid_import",
            message: "El lote de importación no cumple el contrato.",
          },
        ],
      }),
      400,
    );
  }

  await persistImport(parsed.data, env);
  return json(
    envelope(
      {
        runId: parsed.data.runId,
        imported: parsed.data.documents.length,
        skipped: parsed.data.skippedCount,
      },
      { sourceStatus: parsed.data.warningCount > 0 ? "partial" : "ready" },
    ),
    202,
  );
}

async function persistImport(
  batch: ValidatedImportBatch,
  env: Env,
): Promise<void> {
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO import_runs (
        id, source_alias, started_at, completed_at, status, discovered_count, processed_count,
        skipped_count, rejected_count, warning_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET
        completed_at = excluded.completed_at, status = excluded.status,
        discovered_count = excluded.discovered_count, processed_count = excluded.processed_count,
        skipped_count = excluded.skipped_count, rejected_count = excluded.rejected_count,
        warning_count = excluded.warning_count`,
    ).bind(
      batch.runId,
      batch.sourceAlias,
      batch.startedAt,
      batch.completedAt,
      batch.rejectedCount > 0 || batch.warningCount > 0
        ? "partial"
        : "completed",
      batch.discoveredCount,
      batch.documents.length,
      batch.skippedCount,
      batch.rejectedCount,
      batch.warningCount,
    ),
  ];

  for (const document of batch.documents) {
    let rawObjectKey: string | null = null;
    if (document.rawContentBase64 && env.RAW_BUCKET) {
      rawObjectKey = `local/${document.sha256}/${encodeURIComponent(document.fileName)}`;
      await env.RAW_BUCKET.put(
        rawObjectKey,
        Uint8Array.from(atob(document.rawContentBase64), (char) =>
          char.charCodeAt(0),
        ),
        {
          httpMetadata: { contentType: document.mimeType },
          customMetadata: { source: "local-library", sha256: document.sha256 },
        },
      );
    }
    statements.push(
      env.DB.prepare(
        `INSERT INTO local_documents (
          id, relative_path, file_name, extension, mime_type, size_bytes, modified_at, sha256,
          parser_name, parser_version, ingestion_status, ingested_at, last_error, detected_title,
          summary, extracted_text, tags_json, origin, source_alias, raw_object_key, is_relevant, in_watchlist
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(relative_path) DO UPDATE SET
          id = excluded.id, file_name = excluded.file_name, extension = excluded.extension,
          mime_type = excluded.mime_type, size_bytes = excluded.size_bytes, modified_at = excluded.modified_at,
          sha256 = excluded.sha256, parser_name = excluded.parser_name, parser_version = excluded.parser_version,
          ingestion_status = excluded.ingestion_status, ingested_at = excluded.ingested_at,
          last_error = excluded.last_error, detected_title = excluded.detected_title, summary = excluded.summary,
          extracted_text = excluded.extracted_text, tags_json = excluded.tags_json, origin = excluded.origin,
          source_alias = excluded.source_alias, raw_object_key = COALESCE(excluded.raw_object_key, local_documents.raw_object_key),
          updated_at = CURRENT_TIMESTAMP`,
      ).bind(
        document.id,
        document.relativePath,
        document.fileName,
        document.extension,
        document.mimeType,
        document.sizeBytes,
        document.modifiedAt,
        document.sha256,
        document.parserName,
        document.parserVersion,
        document.ingestionStatus,
        document.ingestedAt,
        document.lastError,
        document.detectedTitle,
        document.summary,
        document.extractedText ?? null,
        JSON.stringify(document.tags),
        document.origin,
        document.sourceAlias,
        rawObjectKey,
        Number(document.isRelevant),
        Number(document.inWatchlist),
      ),
    );
    statements.push(
      env.DB.prepare(
        "DELETE FROM local_documents_fts WHERE document_id = ?",
      ).bind(document.id),
    );
    statements.push(
      env.DB.prepare(
        "INSERT INTO local_documents_fts (document_id, file_name, detected_title, summary, extracted_text, tags) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(
        document.id,
        document.fileName,
        document.detectedTitle,
        document.summary,
        document.extractedText ?? null,
        document.tags.join(" "),
      ),
    );
  }
  for (let index = 0; index < statements.length; index += 75)
    await env.DB.batch(statements.slice(index, index + 75));
  await env.CACHE.delete("library:stats");
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  try {
    const parsed = JSON.parse(String(value ?? "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function mapExternalRecord(row: Record<string, unknown>): ObservatoryRecord {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    recordKind: String(row.record_kind),
    externalId: String(row.external_id),
    title: String(row.title),
    summary: row.summary ? String(row.summary) : null,
    originalUrl: String(row.original_url),
    sourceName: String(row.source_name),
    sourceType: String(row.source_type),
    publishedAt: row.published_at ? String(row.published_at) : null,
    detectedAt: String(row.detected_at),
    retrievedAt: String(row.retrieved_at),
    verificationStatus:
      row.verification_status as ObservatoryRecord["verificationStatus"],
    confidenceLevel:
      row.confidence_level as ObservatoryRecord["confidenceLevel"],
    language: row.language ? String(row.language) : null,
    countryRegion: row.country_region ? String(row.country_region) : null,
    lastSuccessfulSyncAt: String(row.last_successful_sync_at),
    providerId: row.provider_id ? String(row.provider_id) : null,
    isStale: Boolean(row.is_stale),
    data: parseJsonObject(row.data_json),
  };
}

async function listExternalRecords(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const cacheKey = `records:${url.searchParams.toString()}`;
  const cached = await env.CACHE.get<{
    records: ObservatoryRecord[];
    total: number;
  }>(cacheKey, "json");
  if (cached) {
    return json(
      envelope(cached.records, {
        total: cached.total,
        sourceStatus: "cached",
      }),
    );
  }
  const kinds = (url.searchParams.get("kind") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) =>
      [
        "model",
        "dataset",
        "space",
        "paper",
        "repository",
        "news",
        "filing",
        "economic_indicator",
      ].includes(value),
    );
  const sourceId = (url.searchParams.get("source") ?? "").replace(
    /[^a-z0-9-]/gi,
    "",
  );
  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  // El módulo Mercado necesita la serie completa por empresa y periodo, que ya
  // supera las 200 filas; el tope sigue acotado para no servir la tabla entera.
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? 50), 1),
    500,
  );
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
  const where: string[] = [];
  const bindings: unknown[] = [];
  if (kinds.length) {
    where.push(`record_kind IN (${kinds.map(() => "?").join(",")})`);
    bindings.push(...kinds);
  }
  if (sourceId) {
    where.push("source_id = ?");
    bindings.push(sourceId);
  }
  if (search) {
    where.push("(title LIKE ? OR summary LIKE ? OR external_id LIKE ?)");
    const pattern = `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    bindings.push(pattern, pattern, pattern);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count, rows] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) AS total FROM observatory_records ${clause}`,
    )
      .bind(...bindings)
      .first<{ total: number }>(),
    env.DB.prepare(
      `SELECT * FROM observatory_records ${clause}
       ORDER BY COALESCE(published_at, detected_at) DESC, title ASC LIMIT ? OFFSET ?`,
    )
      .bind(...bindings, limit, offset)
      .all<Record<string, unknown>>(),
  ]);
  const total = Number(count?.total ?? 0);
  const records = rows.results.map(mapExternalRecord);
  await env.CACHE.put(cacheKey, JSON.stringify({ records, total }), {
    expirationTtl: 120,
  });
  return json(
    envelope(records, {
      total,
      nextCursor:
        offset + rows.results.length < total
          ? String(offset + rows.results.length)
          : undefined,
      sourceStatus: total ? "ready" : "empty",
    }),
  );
}

async function listProviders(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(`
    SELECT p.*, sr.status AS integration_status, sr.last_success_at,
      sr.trust_level AS source_confidence,
      (SELECT COUNT(*) FROM observatory_records r
       WHERE r.record_kind = 'model' AND (r.provider_id = p.id OR (p.source_id IS NOT NULL AND r.source_id = p.source_id))) AS model_count
    FROM providers p LEFT JOIN source_registry sr ON sr.id = p.source_id
    ORDER BY model_count DESC, p.name ASC
  `).all<Record<string, unknown>>();
  const providers: ProviderRecord[] = rows.results.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    country: row.country ? String(row.country) : null,
    categories: parseTags(row.categories_json),
    apiAvailable: Boolean(row.api_available),
    freeTierStatus: row.free_tier_status ? String(row.free_tier_status) : null,
    localExecutionAvailable: Boolean(row.local_execution_available),
    modelCount: Number(row.model_count ?? 0),
    lastSuccessfulSync: row.last_success_at
      ? String(row.last_success_at)
      : null,
    sourceConfidence: row.source_confidence
      ? String(row.source_confidence)
      : null,
    integrationStatus: row.integration_status
      ? String(row.integration_status)
      : "registered",
    links: {
      documentation: row.documentation_url
        ? String(row.documentation_url)
        : null,
      models: row.models_url ? String(row.models_url) : null,
      pricing: row.pricing_url ? String(row.pricing_url) : null,
      apiKey: row.api_key_url ? String(row.api_key_url) : null,
      changelog: row.changelog_url ? String(row.changelog_url) : null,
      console: row.console_url ? String(row.console_url) : null,
      examples: row.examples_url ? String(row.examples_url) : null,
    },
  }));
  return json(envelope(providers, { total: providers.length }));
}

function hasCredential(source: Record<string, unknown>, env: Env): boolean {
  const authenticationType = String(source.authentication_type ?? "none");
  if (authenticationType === "none" || authenticationType === "optional_bearer")
    return true;
  const binding = source.secret_binding_name
    ? String(source.secret_binding_name)
    : "";
  return Boolean(
    binding && (env as unknown as Record<string, unknown>)[binding],
  );
}

async function listSources(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(`
    SELECT * FROM source_registry ORDER BY is_enabled DESC, category ASC, name ASC
  `).all<Record<string, unknown>>();
  const sources: SourceHealth[] = rows.results.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    category: row.category ? String(row.category) : null,
    endpoint: row.endpoint ? String(row.endpoint) : null,
    isOfficial: Boolean(row.is_official),
    enabled: Boolean(row.is_enabled),
    authenticationType: String(row.authentication_type ?? "none"),
    secretBindingName: row.secret_binding_name
      ? String(row.secret_binding_name)
      : null,
    credentialConfigured: hasCredential(row, env),
    status: String(row.status),
    lastRequestAt: row.last_request_at ? String(row.last_request_at) : null,
    lastSuccessAt: row.last_success_at ? String(row.last_success_at) : null,
    lastFailureAt: row.last_failure_at ? String(row.last_failure_at) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    lastHttpStatus:
      row.last_http_status === null ? null : Number(row.last_http_status),
    recordCount: Number(row.record_count ?? 0),
    dailyRequestEstimate:
      Number(row.daily_request_estimate ?? 0) ||
      Math.ceil(
        1440 / Math.max(Number(row.update_frequency_minutes ?? 1440), 1),
      ),
    rateLimitRemaining:
      row.rate_limit_remaining === null
        ? null
        : Number(row.rate_limit_remaining),
    trustLevel: String(row.trust_level ?? "medium"),
  }));
  return json(envelope(sources, { total: sources.length }));
}

async function getDashboard(env: Env): Promise<Response> {
  const cached = await env.CACHE.get<ObservatoryDashboard>(
    "observatory:dashboard",
    "json",
  );
  if (cached) {
    return json(
      envelope(cached, {
        sourceStatus: "cached",
      }),
    );
  }
  const [counts, sourceCounts, recent] = await Promise.all([
    env.DB.prepare(`
      SELECT
        SUM(CASE WHEN record_kind = 'model' THEN 1 ELSE 0 END) AS models,
        SUM(CASE WHEN record_kind = 'paper' THEN 1 ELSE 0 END) AS papers,
        SUM(CASE WHEN record_kind = 'repository' THEN 1 ELSE 0 END) AS repositories,
        SUM(CASE WHEN record_kind = 'news' THEN 1 ELSE 0 END) AS news,
        SUM(CASE WHEN record_kind = 'filing' THEN 1 ELSE 0 END) AS filings,
        SUM(CASE WHEN record_kind = 'economic_indicator' THEN 1 ELSE 0 END) AS economic_indicators,
        MAX(last_successful_sync_at) AS last_success
      FROM observatory_records
    `).first<Record<string, number | string | null>>(),
    env.DB.prepare(`
      SELECT
        SUM(CASE WHEN status IN ('failed','rate_limited') THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN authentication_type NOT IN ('none','optional_bearer') AND configured = 0 THEN 1 ELSE 0 END) AS credentials,
        SUM(CASE WHEN last_success_at IS NOT NULL AND datetime(last_success_at, '+' || (update_frequency_minutes * 2) || ' minutes') < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS stale
      FROM source_registry WHERE is_enabled = 1
    `).first<Record<string, number>>(),
    env.DB.prepare(`SELECT * FROM observatory_records
      ORDER BY COALESCE(published_at, detected_at) DESC LIMIT 12`).all<
      Record<string, unknown>
    >(),
  ]);
  const providerCount = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM providers",
  ).first<{ count: number }>();
  const dashboard: ObservatoryDashboard = {
    providers: Number(providerCount?.count ?? 0),
    models: Number(counts?.models ?? 0),
    papers: Number(counts?.papers ?? 0),
    repositories: Number(counts?.repositories ?? 0),
    news: Number(counts?.news ?? 0),
    filings: Number(counts?.filings ?? 0),
    economicIndicators: Number(counts?.economic_indicators ?? 0),
    failedSources: Number(sourceCounts?.failed ?? 0),
    sourcesRequiringCredentials: Number(sourceCounts?.credentials ?? 0),
    staleSources: Number(sourceCounts?.stale ?? 0),
    lastSuccessfulSyncAt: counts?.last_success
      ? String(counts.last_success)
      : null,
    recent: recent.results.map(mapExternalRecord),
  };
  await env.CACHE.put("observatory:dashboard", JSON.stringify(dashboard), {
    expirationTtl: 60,
  });
  return json(
    envelope(dashboard, {
      sourceStatus: dashboard.lastSuccessfulSyncAt ? "ready" : "empty",
    }),
  );
}

async function listLiveEvents(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    "SELECT * FROM live_events ORDER BY event_at DESC LIMIT 30",
  ).all<Record<string, unknown>>();
  const events: LiveEvent[] = rows.results.map((row) => ({
    id: String(row.id),
    eventType: String(row.event_type),
    recordId: row.record_id ? String(row.record_id) : null,
    title: String(row.title),
    eventAt: String(row.event_at),
    sourceName: String(row.source_name),
    targetPath: String(row.target_path),
  }));
  return json(envelope(events, { total: events.length }));
}

async function runSynchronization(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.headers.get("x-amaru-csrf") !== "local-ui") {
    return errorResponse(
      "csrf_failed",
      "La solicitud no incluye la protección requerida.",
      403,
    );
  }
  const body = (await request.json().catch(() => ({}))) as { scope?: unknown };
  const scope =
    typeof body.scope === "string" && body.scope.trim()
      ? body.scope.trim().slice(0, 50)
      : "public";
  const summaries = await synchronizeScope(scope, env as ExternalEnv);
  const failed = summaries.some((summary) =>
    ["failed", "rate_limited"].includes(summary.status),
  );
  return json(
    envelope(summaries, {
      sourceStatus: failed ? "partial" : "ready",
    }),
    failed ? 207 : 200,
  );
}

async function dispatchSynchronization(
  env: Env,
  sourceIds: string[],
  reason: "scheduled" | "manual",
): Promise<void> {
  if (sourceIds.length === 0) return;
  if (env.INDEX_QUEUE) {
    await env.INDEX_QUEUE.sendBatch(
      sourceIds.map((sourceId) => ({
        body: { sourceId, requestedAt: new Date().toISOString(), reason },
      })),
    );
    return;
  }
  // No Queues binding on this plan: synchronize inline so the data still lands.
  for (const sourceId of sourceIds) {
    try {
      await synchronizeSource(sourceId, env as ExternalEnv);
    } catch (error) {
      console.error("inline_sync_failed", {
        sourceId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

async function ensureInitialSynchronization(env: Env): Promise<void> {
  const state = await env.DB.prepare(
    "SELECT value FROM app_settings WHERE key = 'initial_public_sync'",
  ).first<{ value: string }>();
  if (state?.value) return;
  const sourceIds = await dueSourceIds(env as ExternalEnv);
  await dispatchSynchronization(env, sourceIds, "scheduled");
  await env.DB.prepare(
    "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('initial_public_sync', 'queued', CURRENT_TIMESTAMP)",
  ).run();
}

function csrfOk(request: Request): boolean {
  return request.headers.get("x-amaru-csrf") === "local-ui";
}

async function moduleRouter(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response | null> {
  const path = url.pathname;
  if (request.method === "GET" && path === "/api/map/global")
    return json(envelope(await getGlobalMap(env), { sourceStatus: "ready" }));
  if (request.method === "GET" && path === "/api/map/peru")
    return json(
      envelope(await getRegionalMap(env, ["PE"]), { sourceStatus: "ready" }),
    );
  if (request.method === "GET" && path === "/api/map/latam")
    return json(
      envelope(await getRegionalMap(env, LATAM_CODES), {
        sourceStatus: "ready",
      }),
    );
  const countryMatch = path.match(/^\/api\/map\/countries\/([A-Za-z]{2})$/);
  if (request.method === "GET" && countryMatch) {
    const panel = await getCountryPanel(env, countryMatch[1]);
    if (!panel)
      return errorResponse("not_found", "País fuera de la referencia.", 404);
    return json(envelope(panel, { sourceStatus: "ready" }));
  }
  if (request.method === "GET" && path === "/api/models/rankings") {
    const type = url.searchParams.get("type") ?? "category-programming";
    const rankings = await getModelRankings(env, type);
    if (!rankings)
      return errorResponse("not_found", "Tipo de ranking desconocido.", 404);
    return json(
      envelope(rankings, {
        sourceStatus: rankings.entries.length ? "ready" : "empty",
      }),
    );
  }
  if (request.method === "GET" && path === "/api/models/offerings") {
    const modelId = url.searchParams.get("model") ?? "";
    if (!modelId)
      return errorResponse("invalid_request", "Falta el parámetro model.", 400);
    const offerings = await getModelOfferings(env, modelId);
    return json(
      envelope(offerings, {
        total: offerings.length,
        sourceStatus: offerings.length ? "ready" : "empty",
      }),
    );
  }
  if (request.method === "GET" && path === "/api/models/detail") {
    const modelId = url.searchParams.get("model") ?? "";
    if (!modelId)
      return errorResponse("invalid_request", "Falta el parámetro model.", 400);
    const detail = await getModelDetail(env, modelId);
    return json(
      envelope(detail, {
        modelId,
        sourceStatus: detail.indexed ? "ready" : "empty",
      }),
    );
  }
  const providerModelsMatch = path.match(
    /^\/api\/providers\/([A-Za-z0-9-]{1,64})\/models$/,
  );
  if (request.method === "GET" && providerModelsMatch) {
    const detail = await getProviderModels(env, providerModelsMatch[1]);
    if (!detail)
      return errorResponse("not_found", "Proveedor no registrado.", 404);
    return json(
      envelope(detail, {
        providerId: detail.providerId,
        sourceStatus:
          detail.authored.length || detail.hosted.length ? "ready" : "empty",
      }),
    );
  }
  if (request.method === "GET" && path === "/api/dashboard/price-history") {
    const history = await getPriceHistory(env);
    return json(
      envelope(history, {
        sourceStatus: history.available ? "ready" : "empty",
        total: history.series.length,
      }),
    );
  }
  if (request.method === "GET" && path === "/api/github/rankings") {
    const view = url.searchParams.get("view") ?? "stars";
    const ranking = await getGithubRankings(env, view);
    if (!ranking)
      return errorResponse("not_found", "Vista de ranking desconocida.", 404);
    return json(
      envelope(ranking, {
        sourceStatus: ranking.entries.length ? "ready" : "empty",
      }),
    );
  }
  if (request.method === "GET" && path === "/api/videos") {
    // Las banderas reflejan la credencial efectiva (entorno o guardada cifrada).
    const resolved = await withStoredSecrets(env);
    const result = await listVideos(resolved, url.searchParams);
    return json(
      envelope(
        {
          ...result,
          integrations: {
            youtubeConfigured: Boolean(resolved.YOUTUBE_API_KEY),
            metaConfigured: Boolean(resolved.FACEBOOK_PAGE_ACCESS_TOKEN),
            xConfigured: Boolean(resolved.X_BEARER_TOKEN),
          },
        },
        {
          total: result.total,
          sourceStatus: result.items.length ? "ready" : "empty",
        },
      ),
    );
  }
  if (request.method === "GET" && path === "/api/market/quotes") {
    const quotes = await getMarketQuotes(
      env,
      url.searchParams.get("force") === "1" ? { force: true } : {},
    );
    return json(
      envelope(quotes, {
        total: quotes.quotes.length,
        sourceStatus: !quotes.configured
          ? "not_configured"
          : quotes.fromCache
            ? "cached"
            : quotes.quotes.length
              ? "ready"
              : "empty",
      }),
    );
  }
  if (path === "/api/laboratory/projects" && request.method === "GET")
    return json(envelope(await listLaboratoryProjects(env)));
  if (path === "/api/laboratory/projects" && request.method === "POST") {
    if (!csrfOk(request))
      return errorResponse("csrf_failed", "Solicitud sin protección.", 403);
    const body = (await request.json().catch(() => null)) as {
      id?: string;
      name?: string;
      inputs?: ProjectInputs;
      status?: string;
    } | null;
    if (!body?.name || !body.inputs)
      return errorResponse(
        "invalid_payload",
        "El proyecto requiere nombre y datos del asistente.",
        400,
      );
    const id = await saveLaboratoryProject(env, {
      id: body.id,
      name: body.name,
      inputs: body.inputs,
      status: body.status,
    });
    const project = await getLaboratoryProject(env, id);
    return json(envelope(project), 201);
  }
  const projectMatch = path.match(
    /^\/api\/laboratory\/projects\/([a-zA-Z0-9-]+)$/,
  );
  if (projectMatch && request.method === "GET") {
    const project = await getLaboratoryProject(env, projectMatch[1]);
    if (!project)
      return errorResponse("not_found", "Proyecto inexistente.", 404);
    return json(envelope(project));
  }
  if (projectMatch && request.method === "DELETE") {
    if (!csrfOk(request))
      return errorResponse("csrf_failed", "Solicitud sin protección.", 403);
    await deleteLaboratoryProject(env, projectMatch[1]);
    return json(envelope({ archived: true }));
  }
  const recommendMatch = path.match(
    /^\/api\/laboratory\/projects\/([a-zA-Z0-9-]+)\/recommend$/,
  );
  if (recommendMatch && request.method === "POST") {
    if (!csrfOk(request))
      return errorResponse("csrf_failed", "Solicitud sin protección.", 403);
    const result = await recommendForProject(env, recommendMatch[1]);
    if (!result)
      return errorResponse("not_found", "Proyecto inexistente.", 404);
    return json(envelope(result));
  }
  return null;
}

/**
 * Guardado, borrado y prueba de credenciales de integración. La credencial solo
 * viaja del navegador al Worker: nunca se devuelve, ni siquiera al autor de la
 * petición, y se almacena cifrada.
 */
async function integrationRouter(
  request: Request,
  env: Env,
  match: RegExpMatchArray,
): Promise<Response> {
  const binding = match[1];
  const isTest = Boolean(match[2]);
  if (!csrfOk(request))
    return errorResponse("csrf_failed", "Solicitud sin protección.", 403);
  try {
    if (isTest && request.method === "POST")
      return json(envelope(await testIntegration(env, binding)));
    if (!isTest && request.method === "PUT") {
      const body = (await request.json().catch(() => null)) as {
        credential?: unknown;
      } | null;
      if (typeof body?.credential !== "string")
        return errorResponse(
          "invalid_payload",
          "Falta la credencial a guardar.",
          400,
        );
      return json(
        envelope(await saveIntegration(env, binding, body.credential)),
      );
    }
    if (!isTest && request.method === "DELETE")
      return json(envelope(await deleteIntegration(env, binding)));
  } catch (error) {
    return errorResponse(
      "integration_error",
      error instanceof Error
        ? error.message
        : "No se pudo actualizar la integración.",
      400,
    );
  }
  return errorResponse("not_found", "La ruta solicitada no existe.", 404);
}

async function apiRouter(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (env.ENABLE_DEVELOPER_LAB !== "false") {
    const developerLabResponse = await developerLabRouter(request, env, url);
    if (developerLabResponse) return developerLabResponse;
  }
  for (const router of extraRouters) {
    const extraResponse = await router(
      request,
      env as unknown as ExtraEnv,
      url,
    );
    if (extraResponse) return extraResponse;
  }
  const moduleResponse = await moduleRouter(request, env, url);
  if (moduleResponse) return moduleResponse;
  if (request.method === "GET" && url.pathname === "/api/status")
    return getStatus(env);
  if (request.method === "GET" && url.pathname === "/api/local-library")
    return listDocuments(request, env);
  if (request.method === "GET" && url.pathname === "/api/records")
    return listExternalRecords(request, env);
  if (request.method === "GET" && url.pathname === "/api/providers")
    return listProviders(env);
  if (request.method === "GET" && url.pathname === "/api/sources")
    return listSources(await withStoredSecrets(env));
  if (request.method === "GET" && url.pathname === "/api/dashboard")
    return getDashboard(env);
  if (request.method === "GET" && url.pathname === "/api/live-events")
    return listLiveEvents(env);
  if (request.method === "POST" && url.pathname === "/api/sync")
    return runSynchronization(request, env);
  if (request.method === "GET" && url.pathname === "/api/integrations")
    return json(
      envelope(await listIntegrations(env), { sourceStatus: "ready" }),
    );
  const integrationMatch = url.pathname.match(
    /^\/api\/integrations\/([A-Z0-9_]{3,64})(\/test)?$/,
  );
  if (integrationMatch)
    return integrationRouter(request, env, integrationMatch);
  if (
    request.method === "POST" &&
    url.pathname === "/api/internal/import/local"
  )
    return importLocal(request, env);
  const analysisMatch = url.pathname.match(
    /^\/api\/local-library\/([a-zA-Z0-9_-]+)\/analysis$/,
  );
  if (analysisMatch && request.method === "GET")
    return getDocumentAnalysis(analysisMatch[1], env);
  if (analysisMatch && request.method === "POST")
    return analyzeDocument(request, analysisMatch[1], env);
  const documentMatch = url.pathname.match(
    /^\/api\/local-library\/([a-zA-Z0-9_-]+)$/,
  );
  if (documentMatch && request.method === "GET")
    return getDocument(documentMatch[1], env);
  if (documentMatch && request.method === "PATCH")
    return updateDocument(request, documentMatch[1], env);
  return errorResponse("not_found", "La ruta solicitada no existe.", 404);
}

async function withSecurity(response: Response): Promise<Response> {
  const secured = new Response(response.body, response);
  for (const [key, value] of Object.entries(SECURITY_HEADERS))
    secured.headers.set(key, value);
  return secured;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    context: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/status") {
        context.waitUntil(
          ensureInitialSynchronization(env).catch((error) =>
            console.error("initial_sync_queue_failed", {
              error: error instanceof Error ? error.message : "unknown",
            }),
          ),
        );
      }
      const response = url.pathname.startsWith("/api/")
        ? await apiRouter(request, env)
        : await env.ASSETS.fetch(request);
      return withSecurity(response);
    } catch (error) {
      console.error("request_failed", {
        path: url.pathname,
        error: error instanceof Error ? error.message : "unknown",
      });
      return withSecurity(
        errorResponse(
          "unexpected_error",
          "Ocurrió un error inesperado. Inténtalo nuevamente.",
          500,
        ),
      );
    }
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const sourceIds = await dueSourceIds(env as ExternalEnv);
    await dispatchSynchronization(env, sourceIds, "scheduled");
  },

  async queue(batch: MessageBatch<IndexJob>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const summary = await synchronizeSource(
        message.body.sourceId,
        env as ExternalEnv,
      );
      if (summary.status === "failed") message.retry();
      else message.ack();
    }
  },
} satisfies ExportedHandler<Env, IndexJob>;
