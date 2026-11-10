import {
  getDeveloperLabProvider,
  providerChatBaseUrl,
} from "../../lib/developer-lab/registry";
import { OPENAI_COMPATIBLE_PROVIDERS } from "../../lib/developer-lab/streaming";
import type {
  TestbenchModel,
  TestbenchResult,
  TestType,
} from "../../lib/developer-lab/types";
import {
  type DeveloperLabCredentialEnv,
  ProviderCredentialService,
} from "./credential-service";

export type TestbenchEnv = DeveloperLabCredentialEnv & {
  AI?: Ai;
  OLLAMA_BASE_URL?: string;
  LM_STUDIO_BASE_URL?: string;
  VLLM_BASE_URL?: string;
  LOCALAI_BASE_URL?: string;
};

const OPENAI_COMPATIBLE = OPENAI_COMPATIBLE_PROVIDERS;

const LOCAL_PROVIDERS = new Set(["ollama", "lm-studio", "vllm", "localai"]);

const VEO_MODELS: TestbenchModel[] = [
  {
    id: "veo-3.0-generate-001",
    displayName: "Veo 3 (video con audio)",
    contextLength: null,
    inputPricePerMillion: null,
    outputPricePerMillion: null,
    pricingNote:
      "Se factura por segundo de video generado; el precio no está indexado localmente.",
    source: "curated",
    supportsImageInput: true,
    outputKind: "video",
  },
  {
    id: "veo-2.0-generate-001",
    displayName: "Veo 2",
    contextLength: null,
    inputPricePerMillion: null,
    outputPricePerMillion: null,
    pricingNote:
      "Se factura por segundo de video generado; el precio no está indexado localmente.",
    source: "curated",
    supportsImageInput: true,
    outputKind: "video",
  },
];

const WORKERS_AI_MODELS: TestbenchModel[] = [
  "@cf/meta/llama-3.1-8b-instruct",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/mistralai/mistral-small-3.1-24b-instruct",
].map((id) => ({
  id,
  displayName: id.replace("@cf/", ""),
  contextLength: null,
  inputPricePerMillion: null,
  outputPricePerMillion: null,
  pricingNote: "Precio por neuronas de Workers AI; no indexado por token.",
  source: "curated",
  supportsImageInput: false,
  outputKind: "text",
}));

function perMillion(perToken: unknown): number | null {
  const value = Number(perToken);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 1_000_000 * 10_000) / 10_000;
}

type IndexedModelRow = {
  external_id: string;
  title: string;
  data_json: string | null;
};

function parseIndexedModel(row: IndexedModelRow): TestbenchModel | null {
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(row.data_json ?? "{}") as Record<string, unknown>;
  } catch {
    return null;
  }
  const architecture = (data.architecture ?? {}) as Record<string, unknown>;
  const inputModalities = Array.isArray(architecture.input_modalities)
    ? (architecture.input_modalities as string[])
    : [];
  const outputModalities = Array.isArray(architecture.output_modalities)
    ? (architecture.output_modalities as string[])
    : [];
  if (outputModalities.length && !outputModalities.includes("text"))
    return null;
  const apiIdentifier =
    typeof data.apiIdentifier === "string"
      ? data.apiIdentifier
      : row.external_id;
  return {
    id: apiIdentifier,
    displayName: row.title,
    contextLength:
      typeof data.contextLength === "number" ? data.contextLength : null,
    inputPricePerMillion: perMillion(data.inputPricePerToken),
    outputPricePerMillion: perMillion(data.outputPricePerToken),
    pricingNote: null,
    source: "indexed",
    supportsImageInput: inputModalities.includes("image"),
    outputKind: "text",
  };
}

async function listLocalModels(
  providerId: string,
  env: TestbenchEnv,
): Promise<TestbenchModel[]> {
  const provider = getDeveloperLabProvider(providerId);
  if (provider?.connection.kind !== "local") return [];
  const base = env[provider.connection.url];
  if (typeof base !== "string" || !base) return [];
  const trimmed = base.replace(/\/$/, "");
  const url =
    providerId === "ollama" ? `${trimmed}/api/tags` : `${trimmed}/models`;
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);
  if (!response?.ok) return [];
  const payload = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const entries = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.models)
      ? payload.models
      : [];
  return entries
    .map((entry): TestbenchModel | null => {
      const item = entry as Record<string, unknown>;
      const id =
        typeof item.id === "string"
          ? item.id
          : typeof item.name === "string"
            ? item.name
            : null;
      if (!id) return null;
      return {
        id,
        displayName: id,
        contextLength: null,
        inputPricePerMillion: 0,
        outputPricePerMillion: 0,
        pricingNote: "Ejecución local sin costo por token.",
        source: "live",
        supportsImageInput: false,
        outputKind: "text",
      };
    })
    .filter((item): item is TestbenchModel => item !== null);
}

async function listLiveCloudModels(
  providerId: string,
  env: TestbenchEnv,
): Promise<Array<{ id: string; displayName: string }> | null> {
  const provider = getDeveloperLabProvider(providerId);
  if (!provider?.supportsModelDiscovery) return null;
  const connection = provider.connection;
  if (connection.kind !== "bearer" && connection.kind !== "api-key-query")
    return null;
  let credential: string;
  try {
    credential = await new ProviderCredentialService(env).resolveCredential(
      providerId,
    );
  } catch {
    return null;
  }
  const headers = new Headers({ accept: "application/json" });
  let url = connection.url;
  if (connection.kind === "api-key-query") {
    const query = new URL(url);
    query.searchParams.set("key", credential);
    query.searchParams.set("pageSize", "1000");
    url = query.toString();
  } else if (providerId === "anthropic") {
    headers.set("x-api-key", credential);
    headers.set("anthropic-version", "2023-06-01");
    url = `${url}?limit=1000`;
  } else {
    headers.set("authorization", `Bearer ${credential}`);
  }
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(12_000),
  }).catch(() => null);
  if (!response?.ok) return null;
  const payload = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const entries = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.models)
      ? payload.models
      : null;
  if (!entries) return null;
  const models: Array<{ id: string; displayName: string }> = [];
  for (const entry of entries) {
    const item = entry as Record<string, unknown>;
    if (providerId === "google-gemini") {
      const methods = Array.isArray(item.supportedGenerationMethods)
        ? (item.supportedGenerationMethods as string[])
        : [];
      if (!methods.includes("generateContent")) continue;
    }
    const rawId =
      typeof item.id === "string"
        ? item.id
        : typeof item.name === "string"
          ? item.name
          : null;
    if (!rawId) continue;
    const id = rawId.replace(/^models\//, "");
    const displayName =
      typeof item.display_name === "string"
        ? item.display_name
        : typeof item.displayName === "string"
          ? item.displayName
          : id;
    models.push({ id, displayName });
  }
  const unique = [
    ...new Map(models.map((model) => [model.id, model])).values(),
  ];
  return unique.length ? unique : null;
}

async function listIndexedModels(
  providerId: string,
  env: TestbenchEnv,
): Promise<TestbenchModel[]> {
  const rows = await env.DB.prepare(`
    SELECT external_id, title, data_json FROM observatory_records
    WHERE record_kind = 'model'
      AND (provider_id = ?1 OR (?1 = 'openrouter' AND source_id = 'openrouter'))
    ORDER BY title COLLATE NOCASE LIMIT 300
  `)
    .bind(providerId)
    .all<IndexedModelRow>();
  const models = rows.results
    .map(parseIndexedModel)
    .filter((model): model is TestbenchModel => model !== null);
  return [...new Map(models.map((model) => [model.id, model])).values()];
}

export async function listTestbenchModels(
  providerId: string,
  testType: TestType,
  env: TestbenchEnv,
): Promise<TestbenchModel[]> {
  const provider = getDeveloperLabProvider(providerId);
  if (!provider) return [];
  if (testType === "video")
    return providerId === "google-gemini" ? VEO_MODELS : [];
  if (providerId === "cloudflare-workers-ai")
    return testType === "image" ? [] : WORKERS_AI_MODELS;
  if (LOCAL_PROVIDERS.has(providerId))
    return testType === "image" ? [] : listLocalModels(providerId, env);
  const indexed = await listIndexedModels(providerId, env);
  if (providerId === "openrouter")
    return indexed.filter((model) =>
      testType === "image" ? model.supportsImageInput : true,
    );
  // The catalog is indexed from OpenRouter, whose ids ("mistralai/mistral-large")
  // are not valid against native provider APIs. Prefer the provider's live model
  // list (exact native ids) and enrich it with indexed pricing.
  const live = await listLiveCloudModels(providerId, env);
  const byNativeId = new Map(
    indexed.map((model) => [stripVendorPrefix(model.id), model]),
  );
  if (!live) {
    return indexed
      .map((model) => ({ ...model, id: stripVendorPrefix(model.id) }))
      .filter(
        (model, index, all) =>
          all.findIndex((entry) => entry.id === model.id) === index,
      )
      .filter((model) =>
        testType === "image" ? model.supportsImageInput : true,
      );
  }
  return live
    .map(({ id, displayName }): TestbenchModel => {
      const match =
        byNativeId.get(id) ??
        byNativeId.get(id.replace(/-latest$/, "")) ??
        null;
      return {
        id,
        displayName: match?.displayName ?? displayName,
        contextLength: match?.contextLength ?? null,
        inputPricePerMillion: match?.inputPricePerMillion ?? null,
        outputPricePerMillion: match?.outputPricePerMillion ?? null,
        pricingNote: match ? null : "Precio no indexado para este modelo.",
        source: "live",
        supportsImageInput:
          match?.supportsImageInput ??
          (providerId === "google-gemini" && id.startsWith("gemini-")),
        outputKind: "text",
      };
    })
    .filter((model) => (testType === "image" ? model.supportsImageInput : true))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function lookupIndexedPricing(
  providerId: string,
  modelId: string,
  env: TestbenchEnv,
): Promise<{ input: number | null; output: number | null }> {
  const models = await listTestbenchModels(providerId, "text", env).catch(
    () => [] as TestbenchModel[],
  );
  const match = models.find(
    (model) => model.id === modelId || model.id.endsWith(`/${modelId}`),
  );
  return {
    input: match?.inputPricePerMillion ?? null,
    output: match?.outputPricePerMillion ?? null,
  };
}

export type ExecuteInput = {
  providerId: string;
  modelId: string;
  testType: TestType;
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

type Usage = { inputTokens: number | null; outputTokens: number | null };

export function stripVendorPrefix(modelId: string): string {
  return modelId.replace(/^[a-z0-9-]+\//i, "").replace(/:free$/, "");
}

function apiErrorDetail(
  payload: Record<string, unknown> | null,
  status: number,
): string {
  const error = payload?.error;
  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string" && message)
      return `${message} (HTTP ${status})`;
  }
  if (typeof error === "string" && error) return `${error} (HTTP ${status})`;
  if (typeof payload?.message === "string" && payload.message)
    return `${payload.message} (HTTP ${status})`;
  if (typeof payload?.detail === "string" && payload.detail)
    return `${payload.detail} (HTTP ${status})`;
  return `HTTP ${status}`;
}

function extractText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value))
    return value
      .map((entry) =>
        typeof entry === "object" && entry !== null
          ? String((entry as Record<string, unknown>).text ?? "")
          : String(entry ?? ""),
      )
      .join("");
  return "";
}

async function executeOpenAiCompatible(
  input: ExecuteInput,
  baseUrl: string,
  credential: string | null,
): Promise<{ outputText: string; usage: Usage }> {
  const content: unknown = input.imageBase64
    ? [
        { type: "text", text: input.prompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${input.imageMimeType ?? "image/png"};base64,${input.imageBase64}`,
          },
        },
      ]
    : input.prompt;
  const headers = new Headers({ "content-type": "application/json" });
  if (credential) headers.set("authorization", `Bearer ${credential}`);
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: input.modelId,
      messages: [{ role: "user", content }],
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxOutputTokens ?? 1024,
      stream: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!response.ok || !payload)
    throw new Error(
      `El proveedor rechazó la solicitud: ${apiErrorDetail(payload, response.status)}`,
    );
  const choice = (payload.choices as Array<Record<string, unknown>>)?.[0];
  const message = choice?.message as Record<string, unknown> | undefined;
  const usage = (payload.usage ?? {}) as Record<string, unknown>;
  return {
    outputText: extractText(message?.content),
    usage: {
      inputTokens:
        typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : null,
      outputTokens:
        typeof usage.completion_tokens === "number"
          ? usage.completion_tokens
          : null,
    },
  };
}

async function executeAnthropic(
  input: ExecuteInput,
  credential: string,
): Promise<{ outputText: string; usage: Usage }> {
  const content: unknown[] = [{ type: "text", text: input.prompt }];
  if (input.imageBase64)
    content.unshift({
      type: "image",
      source: {
        type: "base64",
        media_type: input.imageMimeType ?? "image/png",
        data: input.imageBase64,
      },
    });
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": credential,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: stripVendorPrefix(input.modelId),
      max_tokens: input.maxOutputTokens ?? 1024,
      temperature: input.temperature ?? 0.7,
      messages: [{ role: "user", content }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!response.ok || !payload) {
    const detail =
      (payload?.error as Record<string, unknown> | undefined)?.message ??
      `HTTP ${response.status}`;
    throw new Error(`Anthropic rechazó la solicitud: ${String(detail)}`);
  }
  const usage = (payload.usage ?? {}) as Record<string, unknown>;
  return {
    outputText: extractText(payload.content),
    usage: {
      inputTokens:
        typeof usage.input_tokens === "number" ? usage.input_tokens : null,
      outputTokens:
        typeof usage.output_tokens === "number" ? usage.output_tokens : null,
    },
  };
}

async function executeGeminiText(
  input: ExecuteInput,
  credential: string,
): Promise<{ outputText: string; usage: Usage }> {
  const model = stripVendorPrefix(input.modelId);
  const parts: unknown[] = [{ text: input.prompt }];
  if (input.imageBase64)
    parts.push({
      inline_data: {
        mime_type: input.imageMimeType ?? "image/png",
        data: input.imageBase64,
      },
    });
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  );
  url.searchParams.set("key", credential);
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: input.temperature ?? 0.7,
        maxOutputTokens: input.maxOutputTokens ?? 1024,
      },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!response.ok || !payload) {
    const detail =
      (payload?.error as Record<string, unknown> | undefined)?.message ??
      `HTTP ${response.status}`;
    throw new Error(`Gemini rechazó la solicitud: ${String(detail)}`);
  }
  const candidate = (payload.candidates as Array<Record<string, unknown>>)?.[0];
  const contentParts = ((
    candidate?.content as Record<string, unknown> | undefined
  )?.parts ?? []) as Array<Record<string, unknown>>;
  const usage = (payload.usageMetadata ?? {}) as Record<string, unknown>;
  return {
    outputText: contentParts
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join(""),
    usage: {
      inputTokens:
        typeof usage.promptTokenCount === "number"
          ? usage.promptTokenCount
          : null,
      outputTokens:
        typeof usage.candidatesTokenCount === "number"
          ? usage.candidatesTokenCount
          : null,
    },
  };
}

function findVideoUri(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.uri === "string" && record.uri.startsWith("http"))
    return record.uri;
  for (const entry of Object.values(record)) {
    const found = findVideoUri(entry);
    if (found) return found;
  }
  return null;
}

async function executeGeminiVideo(
  input: ExecuteInput,
  credential: string,
): Promise<{ base64: string; mimeType: string }> {
  const model = stripVendorPrefix(input.modelId);
  const instance: Record<string, unknown> = { prompt: input.prompt };
  if (input.imageBase64)
    instance.image = {
      bytesBase64Encoded: input.imageBase64,
      mimeType: input.imageMimeType ?? "image/png",
    };
  const startUrl = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning`,
  );
  startUrl.searchParams.set("key", credential);
  const started = await fetch(startUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ instances: [instance] }),
    signal: AbortSignal.timeout(30_000),
  });
  const startPayload = (await started.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!started.ok || typeof startPayload?.name !== "string") {
    const detail =
      (startPayload?.error as Record<string, unknown> | undefined)?.message ??
      `HTTP ${started.status}`;
    throw new Error(
      `Gemini no aceptó la generación de video: ${String(detail)}`,
    );
  }
  const operationName = startPayload.name;
  const deadline = Date.now() + 4 * 60_000;
  let operation: Record<string, unknown> | null = null;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 8_000));
    const pollUrl = new URL(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
    );
    pollUrl.searchParams.set("key", credential);
    const poll = await fetch(pollUrl, { signal: AbortSignal.timeout(30_000) });
    operation = (await poll.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (operation?.done === true) break;
  }
  if (operation?.done !== true)
    throw new Error(
      "La generación de video excedió el tiempo de espera (4 minutos). Intenta de nuevo.",
    );
  const error = operation.error as Record<string, unknown> | undefined;
  if (error)
    throw new Error(
      `La generación de video falló: ${String(error.message ?? "error desconocido")}`,
    );
  const uri = findVideoUri(operation.response);
  if (!uri)
    throw new Error(
      "Gemini finalizó la operación pero no entregó un video descargable.",
    );
  const downloadUrl = new URL(uri);
  downloadUrl.searchParams.set("key", credential);
  const video = await fetch(downloadUrl, {
    signal: AbortSignal.timeout(120_000),
  });
  if (!video.ok)
    throw new Error(`No se pudo descargar el video (HTTP ${video.status}).`);
  const bytes = new Uint8Array(await video.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk)
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return {
    base64: btoa(binary),
    mimeType: video.headers.get("content-type") ?? "video/mp4",
  };
}

async function executeWorkersAi(
  input: ExecuteInput,
  env: TestbenchEnv,
): Promise<{ outputText: string; usage: Usage }> {
  if (!env.AI) throw new Error("El binding de Workers AI no está configurado.");
  const result = (await env.AI.run(input.modelId as Parameters<Ai["run"]>[0], {
    messages: [{ role: "user", content: input.prompt }],
    temperature: input.temperature ?? 0.7,
    max_tokens: input.maxOutputTokens ?? 1024,
  })) as Record<string, unknown>;
  const usage = (result.usage ?? {}) as Record<string, unknown>;
  return {
    outputText:
      typeof result.response === "string"
        ? result.response
        : JSON.stringify(result),
    usage: {
      inputTokens:
        typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : null,
      outputTokens:
        typeof usage.completion_tokens === "number"
          ? usage.completion_tokens
          : null,
    },
  };
}

export async function executeTestbench(
  input: ExecuteInput,
  env: TestbenchEnv,
): Promise<TestbenchResult> {
  const provider = getDeveloperLabProvider(input.providerId);
  if (!provider) throw new Error("Proveedor desconocido.");
  const startedAt = performance.now();
  const service = new ProviderCredentialService(env);
  let outputText: string | null = null;
  let outputFile: TestbenchResult["outputFile"] = null;
  let usage: Usage = { inputTokens: null, outputTokens: null };

  if (input.testType === "video") {
    if (input.providerId !== "google-gemini")
      throw new Error(
        "La generación de video solo está implementada para Google Gemini (Veo).",
      );
    const credential = await service.resolveCredential(input.providerId);
    const video = await executeGeminiVideo(input, credential);
    outputFile = { base64: video.base64, mimeType: video.mimeType };
  } else if (input.providerId === "cloudflare-workers-ai") {
    const result = await executeWorkersAi(input, env);
    outputText = result.outputText;
    usage = result.usage;
  } else if (input.providerId === "anthropic") {
    const credential = await service.resolveCredential(input.providerId);
    const result = await executeAnthropic(input, credential);
    outputText = result.outputText;
    usage = result.usage;
  } else if (input.providerId === "google-gemini") {
    const credential = await service.resolveCredential(input.providerId);
    const result = await executeGeminiText(input, credential);
    outputText = result.outputText;
    usage = result.usage;
  } else if (OPENAI_COMPATIBLE.has(input.providerId)) {
    const baseUrl = providerChatBaseUrl(provider);
    if (!baseUrl) throw new Error("Configuración de conexión inesperada.");
    const credential = await service.resolveCredential(input.providerId);
    // OpenRouter uses "vendor/model" ids; native APIs expect the bare model id.
    const result = await executeOpenAiCompatible(
      input.providerId === "openrouter"
        ? input
        : { ...input, modelId: stripVendorPrefix(input.modelId) },
      baseUrl,
      credential,
    );
    outputText = result.outputText;
    usage = result.usage;
  } else if (LOCAL_PROVIDERS.has(input.providerId)) {
    if (provider.connection.kind !== "local")
      throw new Error("Configuración de conexión inesperada.");
    const base = env[provider.connection.url];
    if (typeof base !== "string" || !base)
      throw new Error("Endpoint local no configurado.");
    const trimmed = base.replace(/\/$/, "");
    const baseUrl = input.providerId === "ollama" ? `${trimmed}/v1` : trimmed;
    const result = await executeOpenAiCompatible(input, baseUrl, null);
    outputText = result.outputText;
    usage = result.usage;
  } else {
    throw new Error(
      `La ejecución para ${provider.name} aún no está implementada en el banco de pruebas.`,
    );
  }

  const latencyMs = Math.round(performance.now() - startedAt);
  let costUsd: number | null = null;
  let costNote = "Precio no indexado para este modelo.";
  if (LOCAL_PROVIDERS.has(input.providerId)) {
    costUsd = 0;
    costNote = "Ejecución local sin costo por token.";
  } else if (input.testType === "video") {
    costNote =
      "Costo por segundo de video según el proveedor; no calculable con datos indexados.";
  } else if (usage.inputTokens !== null && usage.outputTokens !== null) {
    const pricing = await lookupIndexedPricing(
      input.providerId,
      input.modelId,
      env,
    );
    if (pricing.input !== null && pricing.output !== null) {
      costUsd =
        Math.round(
          ((usage.inputTokens * pricing.input) / 1_000_000 +
            (usage.outputTokens * pricing.output) / 1_000_000) *
            1_000_000,
        ) / 1_000_000;
      costNote = "Calculado con precios indexados (OpenRouter).";
    }
  } else {
    costNote = "El proveedor no informó el uso de tokens.";
  }

  return {
    providerId: input.providerId,
    modelId: input.modelId,
    testType: input.testType,
    outputText,
    outputFile,
    usage,
    costUsd,
    costNote,
    latencyMs,
    requestId: crypto.randomUUID(),
    finishedAt: new Date().toISOString(),
  };
}
