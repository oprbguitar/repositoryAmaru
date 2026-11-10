/**
 * Local models lab: a thin proxy to the user's Ollama instance so the browser
 * can detect it, pull models with streamed progress and run test prompts
 * without CORS changes in Ollama. Only the configured base URL is contacted.
 *
 *   GET  /api/local-models/ollama/status
 *   POST /api/local-models/ollama/pull      { name }            → NDJSON stream
 *   POST /api/local-models/ollama/generate  { model, prompt }   → NDJSON stream
 */
import type { ExtraRouter } from "../extra-routes";

const PREFIX = "/api/local-models/ollama";
const DEFAULT_BASE = "http://127.0.0.1:11434";
const MODEL_NAME = /^[\w.\-/:]{1,200}$/;

function json(data: unknown, status = 200, errors: string[] = []): Response {
  return new Response(
    JSON.stringify({
      data,
      meta: { generatedAt: new Date().toISOString(), source: "ollama" },
      ...(errors.length
        ? { errors: errors.map((message) => ({ code: "ollama", message })) }
        : {}),
    }),
    { status, headers: { "content-type": "application/json; charset=utf-8" } },
  );
}

function baseUrl(env: Record<string, unknown>): string {
  const value = env.OLLAMA_BASE_URL;
  return (typeof value === "string" && value ? value : DEFAULT_BASE).replace(
    /\/+$/,
    "",
  );
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function stream(upstream: Response): Response {
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function status(base: string): Promise<Response> {
  try {
    const signal = AbortSignal.timeout(2500);
    const [version, tags] = await Promise.all([
      fetch(`${base}/api/version`, { signal }),
      fetch(`${base}/api/tags`, { signal }),
    ]);
    if (!version.ok || !tags.ok) throw new Error(`HTTP ${version.status}`);
    const v = (await version.json()) as { version?: string };
    const t = (await tags.json()) as {
      models?: Array<{
        name: string;
        size?: number;
        digest?: string;
        modified_at?: string;
        details?: { parameter_size?: string; quantization_level?: string };
      }>;
    };
    return json({
      available: true,
      baseUrl: base,
      version: v.version ?? null,
      models: (t.models ?? []).map((model) => ({
        name: model.name,
        size: model.size ?? null,
        digest: model.digest ?? null,
        modifiedAt: model.modified_at ?? null,
        parameterSize: model.details?.parameter_size ?? null,
        quantization: model.details?.quantization_level ?? null,
      })),
    });
  } catch (error) {
    return json(
      { available: false, baseUrl: base, version: null, models: [] },
      200,
      [
        `Ollama no responde en ${base}: ${error instanceof Error ? error.message : "sin detalle"}`,
      ],
    );
  }
}

export const localModelsRouter: ExtraRouter = async (request, env, url) => {
  if (!url.pathname.startsWith(PREFIX)) return null;
  const base = baseUrl(env);
  const route = url.pathname.slice(PREFIX.length);

  if (route === "/status" && request.method === "GET") return status(base);

  if (request.method !== "POST")
    return json(null, 405, ["Método no permitido."]);
  if (request.headers.get("x-amaru-csrf") !== "local-ui")
    return json(null, 403, ["Falta la cabecera CSRF de la interfaz local."]);
  const body = await readBody(request);

  try {
    if (route === "/pull") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!MODEL_NAME.test(name))
        return json(null, 400, ["Nombre de modelo no válido."]);
      const upstream = await fetch(`${base}/api/pull`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: name, stream: true }),
        signal: request.signal,
      });
      return stream(upstream);
    }
    if (route === "/generate") {
      const model = typeof body.model === "string" ? body.model.trim() : "";
      const prompt = typeof body.prompt === "string" ? body.prompt : "";
      if (!MODEL_NAME.test(model) || !prompt.trim() || prompt.length > 8000)
        return json(null, 400, ["Modelo o prompt no válidos."]);
      const upstream = await fetch(`${base}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          stream: true,
          options: { num_ctx: 2048 },
        }),
        signal: request.signal,
      });
      return stream(upstream);
    }
  } catch (error) {
    return json(null, 502, [
      `Ollama no responde en ${base}: ${error instanceof Error ? error.message : "sin detalle"}`,
    ]);
  }
  return json(null, 404, ["Ruta no encontrada."]);
};
