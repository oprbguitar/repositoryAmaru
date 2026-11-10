import {
  getDeveloperLabProvider,
  providerChatBaseUrl,
} from "../../lib/developer-lab/registry";
import {
  applyPiece,
  computeCost,
  computeMetrics,
  createAccumulator,
  encodeSseEvent,
  type LabStreamEvent,
  NdjsonDecoder,
  parseNdjsonLine,
  parseSseMessage,
  SseDecoder,
  type StreamProtocol,
  streamProtocolFor,
  type UpstreamPiece,
} from "../../lib/developer-lab/streaming";
import { ProviderCredentialService } from "./credential-service";
import {
  lookupIndexedPricing,
  stripVendorPrefix,
  type TestbenchEnv,
} from "./testbench";

export type StreamInput = {
  providerId: string;
  modelId: string;
  prompt: string;
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  compareGroupId?: string;
};

type UpstreamRequest = {
  protocol: StreamProtocol;
  url: string;
  init: RequestInit;
};

const UPSTREAM_TIMEOUT_MS = 180_000;

function openAiBody(input: StreamInput, modelId: string, withUsage: boolean) {
  const messages: Array<{ role: string; content: string }> = [];
  if (input.system) messages.push({ role: "system", content: input.system });
  messages.push({ role: "user", content: input.prompt });
  return {
    model: modelId,
    messages,
    temperature: input.temperature ?? 0.7,
    max_tokens: input.maxOutputTokens ?? 4096,
    stream: true,
    ...(withUsage ? { stream_options: { include_usage: true } } : {}),
  };
}

/** Builds the provider-specific streaming request. Never logs the credential. */
export async function buildUpstreamRequest(
  input: StreamInput,
  env: TestbenchEnv,
): Promise<UpstreamRequest> {
  const provider = getDeveloperLabProvider(input.providerId);
  if (!provider) throw new Error("Proveedor desconocido.");
  const protocol = streamProtocolFor(provider.id);
  if (!protocol)
    throw new Error(
      `${provider.name} no tiene streaming de texto implementado en el banco.`,
    );
  const json = { "content-type": "application/json" };

  if (provider.connection.kind === "local") {
    const base = env[provider.connection.url];
    if (typeof base !== "string" || !base)
      throw new Error(
        `Endpoint local no configurado (${provider.connection.url}).`,
      );
    const trimmed = base.replace(/\/$/, "");
    if (protocol === "ollama")
      return {
        protocol,
        url: `${trimmed}/api/chat`,
        init: {
          method: "POST",
          headers: json,
          body: JSON.stringify({
            model: input.modelId,
            stream: true,
            messages: [
              ...(input.system
                ? [{ role: "system", content: input.system }]
                : []),
              { role: "user", content: input.prompt },
            ],
            options: {
              temperature: input.temperature ?? 0.7,
              num_predict: input.maxOutputTokens ?? 4096,
            },
          }),
        },
      };
    return {
      protocol,
      url: `${trimmed}/chat/completions`,
      init: {
        method: "POST",
        headers: json,
        body: JSON.stringify(openAiBody(input, input.modelId, true)),
      },
    };
  }

  const credential = await new ProviderCredentialService(env).resolveCredential(
    provider.id,
  );

  if (protocol === "anthropic")
    return {
      protocol,
      url: "https://api.anthropic.com/v1/messages",
      init: {
        method: "POST",
        headers: {
          ...json,
          "x-api-key": credential,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: stripVendorPrefix(input.modelId),
          max_tokens: input.maxOutputTokens ?? 4096,
          temperature: Math.min(input.temperature ?? 0.7, 1),
          ...(input.system ? { system: input.system } : {}),
          messages: [{ role: "user", content: input.prompt }],
          stream: true,
        }),
      },
    };

  if (protocol === "gemini") {
    const model = encodeURIComponent(stripVendorPrefix(input.modelId));
    return {
      protocol,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      init: {
        method: "POST",
        // Header auth keeps the key out of URLs and logs.
        headers: { ...json, "x-goog-api-key": credential },
        body: JSON.stringify({
          ...(input.system
            ? { systemInstruction: { parts: [{ text: input.system }] } }
            : {}),
          contents: [{ role: "user", parts: [{ text: input.prompt }] }],
          generationConfig: {
            temperature: input.temperature ?? 0.7,
            maxOutputTokens: input.maxOutputTokens ?? 4096,
          },
        }),
      },
    };
  }

  const baseUrl = providerChatBaseUrl(provider);
  if (!baseUrl) throw new Error("Configuración de conexión inesperada.");
  // Model ids come from the provider's own list (native ids such as Groq's
  // "openai/gpt-oss-20b"), so they are sent untouched.
  const modelId = input.modelId;
  return {
    protocol,
    url: `${baseUrl}/chat/completions`,
    init: {
      method: "POST",
      headers: { ...json, authorization: `Bearer ${credential}` },
      body: JSON.stringify(openAiBody(input, modelId, true)),
    },
  };
}

async function upstreamError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  let detail = "";
  try {
    const payload = JSON.parse(text) as Record<string, unknown>;
    const error = payload.error ?? payload;
    if (typeof error === "string") detail = error;
    else if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string") detail = message;
    }
  } catch {
    detail = text.slice(0, 200);
  }
  return `El proveedor rechazó la solicitud (HTTP ${response.status})${detail ? `: ${detail}` : "."}`;
}

type PersistRow = {
  id: string;
  input: StreamInput;
  protocol: StreamProtocol;
  status: "completed" | "failed" | "cancelled";
  event: Extract<LabStreamEvent, { type: "done" }> | null;
  error: string | null;
  metrics: ReturnType<typeof computeMetrics>;
};

async function persistRun(env: TestbenchEnv, row: PersistRow) {
  const usage = row.event?.usage;
  await env.DB.prepare(`
    INSERT INTO developer_lab_stream_runs (
      id, provider_id, model_id, protocol, status, compare_group_id, temperature,
      max_output_tokens, prompt_chars, system_chars, input_tokens, output_tokens,
      reasoning_tokens, tokens_estimated, cost_usd, cost_note, latency_ms, ttft_ms,
      tokens_per_second, finish_reason, error_message
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)
  `)
    .bind(
      row.id,
      row.input.providerId,
      row.input.modelId,
      row.protocol,
      row.status,
      row.input.compareGroupId ?? null,
      row.input.temperature ?? 0.7,
      row.input.maxOutputTokens ?? 4096,
      row.input.prompt.length,
      row.input.system?.length ?? 0,
      usage?.inputTokens ?? null,
      row.metrics.outputTokens,
      usage?.reasoningTokens ?? null,
      row.metrics.estimated ? 1 : 0,
      row.event?.costUsd ?? null,
      row.event?.costNote ?? null,
      row.metrics.latencyMs,
      row.metrics.ttftMs,
      row.metrics.tokensPerSecond,
      row.event?.finishReason ?? null,
      row.error,
    )
    .run()
    .catch((error: unknown) => {
      console.warn("developer_lab_stream_persist_failed", {
        runId: row.id,
        message: error instanceof Error ? error.message : "unknown",
      });
    });
}

/**
 * Returns a normalized `text/event-stream` (start → delta* → usage* → done|error).
 * Aborting the client request (Detener) cancels the upstream fetch.
 */
export function streamRun(
  input: StreamInput,
  env: TestbenchEnv,
  clientSignal?: AbortSignal,
): Response {
  const runId = crypto.randomUUID();
  const upstreamAbort = new AbortController();
  const timeout = setTimeout(
    () => upstreamAbort.abort(new Error("timeout")),
    UPSTREAM_TIMEOUT_MS,
  );
  clientSignal?.addEventListener("abort", () => upstreamAbort.abort(), {
    once: true,
  });
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: LabStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeSseEvent(event)));
        } catch {
          closed = true;
        }
      };
      const startedAtMs = performance.now();
      const acc = createAccumulator(startedAtMs);
      let protocol: StreamProtocol =
        streamProtocolFor(input.providerId) ?? "openai";
      let status: PersistRow["status"] = "completed";
      let doneEvent: PersistRow["event"] = null;
      try {
        const upstream = await buildUpstreamRequest(input, env);
        protocol = upstream.protocol;
        send({
          type: "start",
          runId,
          providerId: input.providerId,
          modelId: input.modelId,
          protocol,
          startedAt: new Date().toISOString(),
        });
        const response = await fetch(upstream.url, {
          ...upstream.init,
          signal: upstreamAbort.signal,
        });
        if (!response.ok || !response.body)
          throw new Error(await upstreamError(response));
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();
        const sse = new SseDecoder();
        const ndjson = new NdjsonDecoder();
        const handle = (pieces: UpstreamPiece[]) => {
          for (const piece of pieces) {
            applyPiece(acc, piece, performance.now());
            if (piece.kind === "delta")
              send({ type: "delta", channel: piece.channel, text: piece.text });
            else if (piece.kind === "usage")
              send({ type: "usage", ...acc.usage });
          }
        };
        const decode = (chunk: string | null) => {
          if (protocol === "ollama") {
            const lines = chunk === null ? ndjson.flush() : ndjson.push(chunk);
            for (const line of lines) handle(parseNdjsonLine(line));
          } else {
            const kind = protocol;
            const messages = chunk === null ? sse.flush() : sse.push(chunk);
            for (const message of messages)
              handle(parseSseMessage(kind, message));
          }
        };
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          decode(value);
          if (acc.error) break;
        }
        decode(null);
        if (acc.error) throw new Error(acc.error);
      } catch (error) {
        if (upstreamAbort.signal.aborted && !acc.error) {
          const reason = upstreamAbort.signal.reason;
          status =
            reason instanceof Error && reason.message === "timeout"
              ? "failed"
              : "cancelled";
          if (status === "failed")
            acc.error = "La ejecución excedió 3 minutos.";
        } else {
          status = "failed";
          acc.error =
            error instanceof Error ? error.message : "Error desconocido.";
        }
      }
      const metrics = computeMetrics(acc, performance.now());
      if (status === "failed") {
        send({ type: "error", runId, message: acc.error ?? "Error." });
      } else {
        const isLocal =
          getDeveloperLabProvider(input.providerId)?.location === "local";
        const pricing = isLocal
          ? { input: 0, output: 0 }
          : await lookupIndexedPricing(input.providerId, input.modelId, env);
        const { costUsd, costNote } = computeCost(acc.usage, pricing, isLocal);
        doneEvent = {
          type: "done",
          runId,
          finishReason: acc.finishReason,
          status,
          metrics,
          usage: acc.usage,
          costUsd,
          costNote,
        };
        send(doneEvent);
      }
      clearTimeout(timeout);
      await persistRun(env, {
        id: runId,
        input,
        protocol,
        status,
        event: doneEvent,
        error: status === "failed" ? acc.error : null,
        metrics,
      });
      if (!closed) {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed by the client */
        }
      }
    },
    cancel() {
      closed = true;
      upstreamAbort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      "x-run-id": runId,
    },
  });
}

export type ModelRunStats = {
  providerId: string;
  modelId: string;
  runs: number;
  completed: number;
  failed: number;
  cancelled: number;
  avgCostUsd: number | null;
  totalCostUsd: number | null;
  avgLatencyMs: number | null;
  avgTtftMs: number | null;
  avgTokensPerSecond: number | null;
  lastRunAt: string;
};

export async function listModelStats(
  env: TestbenchEnv,
): Promise<ModelRunStats[]> {
  const rows = await env.DB.prepare(`
    SELECT provider_id, model_id, COUNT(*) AS runs,
      SUM(status = 'completed') AS completed,
      SUM(status = 'failed') AS failed,
      SUM(status = 'cancelled') AS cancelled,
      AVG(cost_usd) AS avg_cost, SUM(cost_usd) AS total_cost,
      AVG(CASE WHEN status = 'completed' THEN latency_ms END) AS avg_latency,
      AVG(ttft_ms) AS avg_ttft,
      AVG(CASE WHEN status = 'completed' THEN tokens_per_second END) AS avg_tps,
      MAX(created_at) AS last_run
    FROM developer_lab_stream_runs
    GROUP BY provider_id, model_id
    ORDER BY last_run DESC LIMIT 200
  `).all<Record<string, number | string | null>>();
  const n = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? value : null;
  return rows.results.map((row) => ({
    providerId: String(row.provider_id),
    modelId: String(row.model_id),
    runs: Number(row.runs),
    completed: Number(row.completed ?? 0),
    failed: Number(row.failed ?? 0),
    cancelled: Number(row.cancelled ?? 0),
    avgCostUsd: n(row.avg_cost),
    totalCostUsd: n(row.total_cost),
    avgLatencyMs: n(row.avg_latency),
    avgTtftMs: n(row.avg_ttft),
    avgTokensPerSecond: n(row.avg_tps),
    lastRunAt: String(row.last_run),
  }));
}

export async function saveRunOutput(
  env: TestbenchEnv,
  runId: string,
  output: string,
  prompt: string | null,
): Promise<boolean> {
  const result = await env.DB.prepare(`
    UPDATE developer_lab_stream_runs
    SET saved_output = ?2, saved_prompt = ?3, saved_at = ?4 WHERE id = ?1
  `)
    .bind(runId, output, prompt, new Date().toISOString())
    .run();
  return (result.meta.changes ?? 0) > 0;
}
