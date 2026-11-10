/**
 * Pure streaming helpers shared by the worker (upstream parsing) and the UI
 * (downstream parsing + live metrics). No I/O here so everything is testable
 * against recorded fixtures.
 */

export type StreamProtocol = "openai" | "anthropic" | "gemini" | "ollama";

/** Providers that speak the OpenAI `/chat/completions` streaming dialect. */
export const OPENAI_COMPATIBLE_PROVIDERS: ReadonlySet<string> = new Set([
  "openai",
  "openrouter",
  "groq",
  "mistral",
  "nvidia",
  "together",
  "fireworks",
  "cerebras",
  "xai",
  "deepseek",
  "deepinfra",
  "cohere",
  "sambanova",
  "dashscope-intl",
  "moonshot",
  "zai",
  "minimax",
  "perplexity",
  "huggingface-router",
  "novita",
  "nebius",
]);

export const LOCAL_OPENAI_PROVIDERS: ReadonlySet<string> = new Set([
  "lm-studio",
  "vllm",
  "localai",
]);

export function streamProtocolFor(providerId: string): StreamProtocol | null {
  if (providerId === "anthropic") return "anthropic";
  if (providerId === "google-gemini") return "gemini";
  if (providerId === "ollama") return "ollama";
  if (
    OPENAI_COMPATIBLE_PROVIDERS.has(providerId) ||
    LOCAL_OPENAI_PROVIDERS.has(providerId)
  )
    return "openai";
  return null;
}

export type UsageReport = {
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  /** Cost reported by the provider itself (OpenRouter), in USD. */
  providerCostUsd: number | null;
};

/** Normalized pieces extracted from one upstream chunk. */
export type UpstreamPiece =
  | { kind: "delta"; channel: "text" | "reasoning"; text: string }
  | { kind: "usage"; usage: UsageReport }
  | { kind: "finish"; reason: string }
  | { kind: "error"; message: string };

export type RunMetrics = {
  latencyMs: number;
  ttftMs: number | null;
  outputTokens: number | null;
  tokensPerSecond: number | null;
  /** True when token counts are a chars/4 estimate (no usage reported yet). */
  estimated: boolean;
};

/** Events on the normalized `text/event-stream` the worker emits. */
export type LabStreamEvent =
  | {
      type: "start";
      runId: string;
      providerId: string;
      modelId: string;
      protocol: StreamProtocol;
      startedAt: string;
    }
  | { type: "delta"; channel: "text" | "reasoning"; text: string }
  | ({ type: "usage" } & UsageReport)
  | {
      type: "done";
      runId: string;
      finishReason: string | null;
      status: "completed" | "cancelled";
      metrics: RunMetrics;
      usage: UsageReport;
      costUsd: number | null;
      costNote: string;
    }
  | { type: "error"; runId: string | null; message: string };

// ---------------------------------------------------------------------------
// Framing decoders
// ---------------------------------------------------------------------------

export type SseMessage = { event: string | null; data: string };

/** Incremental SSE decoder (WHATWG framing, tolerant of CRLF and split chunks). */
export class SseDecoder {
  private buffer = "";
  private event: string | null = null;
  private data: string[] = [];

  push(chunk: string): SseMessage[] {
    this.buffer += chunk;
    const out: SseMessage[] = [];
    let index = this.buffer.search(/\r\n|\r|\n/);
    while (index !== -1) {
      const line = this.buffer.slice(0, index);
      const newlineLength =
        this.buffer[index] === "\r" && this.buffer[index + 1] === "\n" ? 2 : 1;
      // A lone trailing "\r" might be the first half of "\r\n": wait for more.
      if (
        this.buffer[index] === "\r" &&
        index + 1 === this.buffer.length &&
        newlineLength === 1
      )
        break;
      this.buffer = this.buffer.slice(index + newlineLength);
      this.consumeLine(line, out);
      index = this.buffer.search(/\r\n|\r|\n/);
    }
    return out;
  }

  /** Flush a final message not terminated by a blank line. */
  flush(): SseMessage[] {
    const out: SseMessage[] = [];
    if (this.buffer) {
      this.consumeLine(this.buffer, out);
      this.buffer = "";
    }
    this.consumeLine("", out);
    return out;
  }

  private consumeLine(line: string, out: SseMessage[]) {
    if (line === "") {
      if (this.data.length)
        out.push({ event: this.event, data: this.data.join("\n") });
      this.event = null;
      this.data = [];
      return;
    }
    if (line.startsWith(":")) return;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") this.event = value;
    else if (field === "data") this.data.push(value);
  }
}

/** Incremental newline-delimited JSON decoder (Ollama). */
export class NdjsonDecoder {
  private buffer = "";

  push(chunk: string): string[] {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() ?? "";
    return lines.filter((line) => line.trim() !== "");
  }

  flush(): string[] {
    const rest = this.buffer.trim();
    this.buffer = "";
    return rest ? [rest] : [];
  }
}

// ---------------------------------------------------------------------------
// Protocol normalizers
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const obj = (value: unknown): Json | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : null;

function errorMessage(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  const record = obj(value);
  if (record && typeof record.message === "string") return record.message;
  return null;
}

/** OpenAI-compatible `chat.completion.chunk` (incl. Groq, OpenRouter, Cohere compat). */
export function parseOpenAiChunk(payload: Json): UpstreamPiece[] {
  const pieces: UpstreamPiece[] = [];
  const failure = errorMessage(payload.error);
  if (failure) return [{ kind: "error", message: failure }];
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const choice = obj(choices[0]);
  const delta = obj(choice?.delta);
  if (delta) {
    const reasoning =
      typeof delta.reasoning === "string"
        ? delta.reasoning
        : typeof delta.reasoning_content === "string"
          ? delta.reasoning_content
          : "";
    if (reasoning)
      pieces.push({ kind: "delta", channel: "reasoning", text: reasoning });
    const content = delta.content;
    if (typeof content === "string" && content)
      pieces.push({ kind: "delta", channel: "text", text: content });
  }
  if (typeof choice?.finish_reason === "string")
    pieces.push({ kind: "finish", reason: choice.finish_reason });
  const usage = obj(payload.usage);
  if (usage) {
    const details = obj(usage.completion_tokens_details);
    pieces.push({
      kind: "usage",
      usage: {
        inputTokens: num(usage.prompt_tokens),
        outputTokens: num(usage.completion_tokens),
        reasoningTokens: num(details?.reasoning_tokens),
        providerCostUsd: num(usage.cost),
      },
    });
  }
  return pieces;
}

/** Anthropic Messages streaming events (`message_start`, `content_block_delta`…). */
export function parseAnthropicEvent(
  eventName: string | null,
  payload: Json,
): UpstreamPiece[] {
  const type = eventName ?? (payload.type as string | undefined) ?? "";
  if (type === "error")
    return [
      {
        kind: "error",
        message: errorMessage(payload.error) ?? "Error de Anthropic.",
      },
    ];
  if (type === "message_start") {
    const usage = obj(obj(payload.message)?.usage);
    return usage
      ? [
          {
            kind: "usage",
            usage: {
              inputTokens:
                (num(usage.input_tokens) ?? 0) +
                (num(usage.cache_read_input_tokens) ?? 0) +
                (num(usage.cache_creation_input_tokens) ?? 0),
              outputTokens: num(usage.output_tokens),
              reasoningTokens: null,
              providerCostUsd: null,
            },
          },
        ]
      : [];
  }
  if (type === "content_block_delta") {
    const delta = obj(payload.delta);
    if (delta?.type === "text_delta" && typeof delta.text === "string")
      return [{ kind: "delta", channel: "text", text: delta.text }];
    if (delta?.type === "thinking_delta" && typeof delta.thinking === "string")
      return [{ kind: "delta", channel: "reasoning", text: delta.thinking }];
    return [];
  }
  if (type === "message_delta") {
    const pieces: UpstreamPiece[] = [];
    const usage = obj(payload.usage);
    if (usage)
      pieces.push({
        kind: "usage",
        usage: {
          inputTokens: num(usage.input_tokens),
          outputTokens: num(usage.output_tokens),
          reasoningTokens: null,
          providerCostUsd: null,
        },
      });
    const reason = obj(payload.delta)?.stop_reason;
    if (typeof reason === "string") pieces.push({ kind: "finish", reason });
    return pieces;
  }
  return [];
}

/** Gemini `streamGenerateContent?alt=sse` chunk. usageMetadata is cumulative. */
export function parseGeminiChunk(payload: Json): UpstreamPiece[] {
  const failure = errorMessage(payload.error);
  if (failure) return [{ kind: "error", message: failure }];
  const pieces: UpstreamPiece[] = [];
  const candidates = Array.isArray(payload.candidates)
    ? payload.candidates
    : [];
  const candidate = obj(candidates[0]);
  const parts = obj(candidate?.content)?.parts;
  if (Array.isArray(parts))
    for (const raw of parts) {
      const part = obj(raw);
      if (typeof part?.text === "string" && part.text)
        pieces.push({
          kind: "delta",
          channel: part.thought === true ? "reasoning" : "text",
          text: part.text,
        });
    }
  if (typeof candidate?.finishReason === "string")
    pieces.push({ kind: "finish", reason: candidate.finishReason });
  const usage = obj(payload.usageMetadata);
  if (usage) {
    const candidatesTokens = num(usage.candidatesTokenCount);
    const thoughts = num(usage.thoughtsTokenCount);
    pieces.push({
      kind: "usage",
      usage: {
        inputTokens: num(usage.promptTokenCount),
        outputTokens:
          candidatesTokens === null && thoughts === null
            ? null
            : (candidatesTokens ?? 0) + (thoughts ?? 0),
        reasoningTokens: thoughts,
        providerCostUsd: null,
      },
    });
  }
  return pieces;
}

/** Ollama native `/api/chat` NDJSON line. */
export function parseOllamaLine(payload: Json): UpstreamPiece[] {
  const failure = errorMessage(payload.error);
  if (failure) return [{ kind: "error", message: failure }];
  const pieces: UpstreamPiece[] = [];
  const message = obj(payload.message);
  if (typeof message?.thinking === "string" && message.thinking)
    pieces.push({
      kind: "delta",
      channel: "reasoning",
      text: message.thinking,
    });
  if (typeof message?.content === "string" && message.content)
    pieces.push({ kind: "delta", channel: "text", text: message.content });
  if (payload.done === true) {
    pieces.push({
      kind: "usage",
      usage: {
        inputTokens: num(payload.prompt_eval_count),
        outputTokens: num(payload.eval_count),
        reasoningTokens: null,
        providerCostUsd: 0,
      },
    });
    pieces.push({
      kind: "finish",
      reason:
        typeof payload.done_reason === "string" ? payload.done_reason : "stop",
    });
  }
  return pieces;
}

/** Runs an SSE `data:` payload through the right normalizer. */
export function parseSseMessage(
  protocol: Exclude<StreamProtocol, "ollama">,
  message: SseMessage,
): UpstreamPiece[] {
  const data = message.data.trim();
  if (!data || data === "[DONE]") return [];
  let payload: Json;
  try {
    payload = JSON.parse(data) as Json;
  } catch {
    return [];
  }
  if (protocol === "anthropic")
    return parseAnthropicEvent(message.event, payload);
  if (protocol === "gemini") return parseGeminiChunk(payload);
  return parseOpenAiChunk(payload);
}

export function parseNdjsonLine(line: string): UpstreamPiece[] {
  try {
    return parseOllamaLine(JSON.parse(line) as Json);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Accumulation + metrics
// ---------------------------------------------------------------------------

export const emptyUsage = (): UsageReport => ({
  inputTokens: null,
  outputTokens: null,
  reasoningTokens: null,
  providerCostUsd: null,
});

/** Later reports win field-by-field; nulls never erase known values. */
export function mergeUsage(base: UsageReport, next: UsageReport): UsageReport {
  return {
    inputTokens: next.inputTokens ?? base.inputTokens,
    outputTokens: next.outputTokens ?? base.outputTokens,
    reasoningTokens: next.reasoningTokens ?? base.reasoningTokens,
    providerCostUsd: next.providerCostUsd ?? base.providerCostUsd,
  };
}

export type RunAccumulator = {
  startedAtMs: number;
  firstTokenAtMs: number | null;
  text: string;
  reasoning: string;
  usage: UsageReport;
  finishReason: string | null;
  error: string | null;
};

export function createAccumulator(startedAtMs: number): RunAccumulator {
  return {
    startedAtMs,
    firstTokenAtMs: null,
    text: "",
    reasoning: "",
    usage: emptyUsage(),
    finishReason: null,
    error: null,
  };
}

/** Mutates and returns the accumulator. */
export function applyPiece(
  acc: RunAccumulator,
  piece: UpstreamPiece,
  nowMs: number,
): RunAccumulator {
  if (piece.kind === "delta") {
    if (acc.firstTokenAtMs === null) acc.firstTokenAtMs = nowMs;
    if (piece.channel === "text") acc.text += piece.text;
    else acc.reasoning += piece.text;
  } else if (piece.kind === "usage") {
    acc.usage = mergeUsage(acc.usage, piece.usage);
  } else if (piece.kind === "finish") {
    acc.finishReason = piece.reason;
  } else {
    acc.error = piece.message;
  }
  return acc;
}

/** Rough chars→tokens estimate used only while the provider has not reported usage. */
export const estimateTokens = (chars: number) => Math.ceil(chars / 4);

export function computeMetrics(
  acc: Pick<
    RunAccumulator,
    "startedAtMs" | "firstTokenAtMs" | "text" | "reasoning" | "usage"
  >,
  nowMs: number,
): RunMetrics {
  const reported = acc.usage.outputTokens;
  const outputTokens =
    reported ??
    (acc.text || acc.reasoning
      ? estimateTokens(acc.text.length + acc.reasoning.length)
      : null);
  const ttftMs =
    acc.firstTokenAtMs === null
      ? null
      : Math.max(0, Math.round(acc.firstTokenAtMs - acc.startedAtMs));
  const generationMs =
    acc.firstTokenAtMs === null ? 0 : nowMs - acc.firstTokenAtMs;
  const tokensPerSecond =
    outputTokens !== null && generationMs >= 50
      ? Math.round((outputTokens / (generationMs / 1000)) * 10) / 10
      : null;
  return {
    latencyMs: Math.max(0, Math.round(nowMs - acc.startedAtMs)),
    ttftMs,
    outputTokens,
    tokensPerSecond,
    estimated: reported === null && outputTokens !== null,
  };
}

export type PricePerMillion = { input: number | null; output: number | null };

/** USD cost; provider-reported cost wins, otherwise indexed per-million prices. */
export function computeCost(
  usage: UsageReport,
  pricing: PricePerMillion,
  isLocal = false,
): { costUsd: number | null; costNote: string } {
  if (isLocal)
    return { costUsd: 0, costNote: "Ejecución local sin costo por token." };
  if (usage.providerCostUsd !== null)
    return {
      costUsd: usage.providerCostUsd,
      costNote: "Costo informado por el proveedor.",
    };
  if (usage.inputTokens === null || usage.outputTokens === null)
    return {
      costUsd: null,
      costNote: "El proveedor no informó el uso de tokens.",
    };
  if (pricing.input === null || pricing.output === null)
    return { costUsd: null, costNote: "Precio no indexado para este modelo." };
  const raw =
    (usage.inputTokens * pricing.input + usage.outputTokens * pricing.output) /
    1_000_000;
  return {
    costUsd: Math.round(raw * 1e8) / 1e8,
    costNote: "Calculado con precios indexados (OpenRouter).",
  };
}

export function encodeSseEvent(event: LabStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/** Client side: decode the normalized stream back into events. */
export function decodeLabEvent(message: SseMessage): LabStreamEvent | null {
  try {
    const parsed = JSON.parse(message.data) as LabStreamEvent;
    return parsed && typeof parsed.type === "string" ? parsed : null;
  } catch {
    return null;
  }
}
