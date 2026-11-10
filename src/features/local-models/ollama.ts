/** Browser client for the worker's Ollama proxy plus pure metric helpers. */

export type OllamaModel = {
  name: string;
  size: number | null;
  digest: string | null;
  modifiedAt: string | null;
  parameterSize: string | null;
  quantization: string | null;
};

export type OllamaStatus = {
  available: boolean;
  baseUrl: string;
  version: string | null;
  models: OllamaModel[];
  error: string | null;
};

export type RunMetrics = {
  /** Time to first token measured in the browser, ms (includes proxy hop). */
  ttftMs: number | null;
  /** Generation speed from Ollama's eval_count / eval_duration. */
  tokensPerSecond: number | null;
  promptTokensPerSecond: number | null;
  evalCount: number | null;
  loadMs: number | null;
  totalMs: number | null;
};

const NS_PER_MS = 1e6;

function n(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Converts Ollama's final `done: true` chunk (durations in ns) to metrics. */
export function computeMetrics(
  final: Record<string, unknown>,
  ttftMs: number | null,
): RunMetrics {
  const evalCount = n(final.eval_count);
  const evalDuration = n(final.eval_duration);
  const promptCount = n(final.prompt_eval_count);
  const promptDuration = n(final.prompt_eval_duration);
  const load = n(final.load_duration);
  const total = n(final.total_duration);
  return {
    ttftMs,
    tokensPerSecond:
      evalCount !== null && evalDuration
        ? evalCount / (evalDuration / 1e9)
        : null,
    promptTokensPerSecond:
      promptCount !== null && promptDuration
        ? promptCount / (promptDuration / 1e9)
        : null,
    evalCount,
    loadMs: load !== null ? load / NS_PER_MS : null,
    totalMs: total !== null ? total / NS_PER_MS : null,
  };
}

/** Pull progress line → 0..1, or null when the line has no byte counts. */
export function pullFraction(line: Record<string, unknown>): number | null {
  const total = n(line.total);
  const completed = n(line.completed);
  if (!total || completed === null) return null;
  return Math.min(1, completed / total);
}

/** Ollama can pull GGUF repos straight from Hugging Face. */
export function hfPullName(repo: string, variant: string | null): string {
  return variant ? `hf.co/${repo}:${variant}` : `hf.co/${repo}`;
}

const BASE = "/api/local-models/ollama";

export async function getOllamaStatus(): Promise<OllamaStatus> {
  const response = await fetch(`${BASE}/status`);
  const body = (await response.json()) as {
    data: Omit<OllamaStatus, "error">;
    errors?: Array<{ message: string }>;
  };
  return { ...body.data, error: body.errors?.[0]?.message ?? null };
}

async function* ndjson(
  path: string,
  payload: unknown,
  signal: AbortSignal,
): AsyncGenerator<Record<string, unknown>> {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-amaru-csrf": "local-ui" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    let message = `Ollama respondió ${response.status}.`;
    try {
      const parsed = JSON.parse(text) as {
        error?: string;
        errors?: Array<{ message: string }>;
      };
      message = parsed.errors?.[0]?.message ?? parsed.error ?? message;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    let index = buffer.indexOf("\n");
    while (index >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (line) {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        if (typeof parsed.error === "string") throw new Error(parsed.error);
        yield parsed;
      }
      index = buffer.indexOf("\n");
    }
  }
  if (buffer.trim()) yield JSON.parse(buffer) as Record<string, unknown>;
}

export function pullModel(name: string, signal: AbortSignal) {
  return ndjson("/pull", { name }, signal);
}

export function generate(model: string, prompt: string, signal: AbortSignal) {
  return ndjson("/generate", { model, prompt }, signal);
}

export const TEST_PROMPTS = [
  {
    id: "summary",
    label: "Resumen",
    prompt:
      "Resume en tres viñetas qué es un modelo de lenguaje cuantizado y por qué ocupa menos memoria.",
  },
  {
    id: "reasoning",
    label: "Razonamiento",
    prompt:
      "Un tren sale a las 8:40 y tarda 2 h 35 min. Otro sale a las 9:15 y tarda 1 h 50 min. ¿Cuál llega primero y con cuántos minutos de diferencia? Explica en dos pasos.",
  },
  {
    id: "code",
    label: "Código",
    prompt:
      "Escribe una función en TypeScript que devuelva la mediana de un arreglo de números, sin mutarlo.",
  },
  {
    id: "spanish",
    label: "Español de Perú",
    prompt:
      "Redacta un mensaje formal y breve para pedir una prórroga de tres días en la entrega de un informe.",
  },
] as const;
