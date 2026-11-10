/**
 * Public, rate-limited AI trial on Cloudflare Workers AI.
 *
 * Visitors get a small number of free questions per day (default 3) on a
 * small open model that runs inside Cloudflare's free daily allocation. The
 * administrator changes the limits from «Administración → IA pública»; no
 * third-party API key is ever used here.
 */
import { type AdminEnv, isAdmin, visitorId } from "./admin";

export type PublicAiEnv = AdminEnv & { AI?: Ai };

export const PUBLIC_AI_MODELS = [
  {
    id: "@cf/meta/llama-3.2-3b-instruct",
    label: "Llama 3.2 3B (muy liviano)",
  },
  {
    id: "@cf/meta/llama-3.1-8b-instruct-fast",
    label: "Llama 3.1 8B rápido",
  },
  {
    id: "@cf/mistral/mistral-7b-instruct-v0.1",
    label: "Mistral 7B",
  },
] as const;

export type PublicAiSettings = {
  enabled: boolean;
  /** Questions per visitor per day. */
  dailyLimit: number;
  /** Questions per day for the whole site — the free-tier safety net. */
  globalDailyCap: number;
  model: string;
  maxOutputTokens: number;
};

const DEFAULTS: PublicAiSettings = {
  enabled: true,
  dailyLimit: 3,
  globalDailyCap: 150,
  model: PUBLIC_AI_MODELS[0].id,
  maxOutputTokens: 700,
};

const SETTINGS_KEY = "settings:public-ai:v1";
const DAY_SECONDS = 36 * 60 * 60;

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const number = Math.round(Number(value));
  return Number.isFinite(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
}

export function sanitizeSettings(input: unknown): PublicAiSettings {
  const raw = (input ?? {}) as Partial<Record<keyof PublicAiSettings, unknown>>;
  const model = PUBLIC_AI_MODELS.some((item) => item.id === raw.model)
    ? String(raw.model)
    : DEFAULTS.model;
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULTS.enabled,
    dailyLimit: clampInt(raw.dailyLimit, 0, 20, DEFAULTS.dailyLimit),
    globalDailyCap: clampInt(
      raw.globalDailyCap,
      0,
      2000,
      DEFAULTS.globalDailyCap,
    ),
    model,
    maxOutputTokens: clampInt(
      raw.maxOutputTokens,
      128,
      1500,
      DEFAULTS.maxOutputTokens,
    ),
  };
}

export async function readSettings(env: PublicAiEnv) {
  const stored = await env.CACHE.get(SETTINGS_KEY, "json").catch(() => null);
  return sanitizeSettings(stored ?? DEFAULTS);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function envelope(data: unknown, errors?: { code: string; message: string }[]) {
  return {
    data,
    meta: {
      requestId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
    },
    ...(errors ? { errors } : {}),
  };
}

function failure(code: string, message: string, status: number) {
  return reply(envelope(null, [{ code, message }]), status);
}

async function usage(request: Request, env: PublicAiEnv) {
  const day = today();
  const visitor = await visitorId(request, env);
  const visitorKey = `public-ai:${day}:${visitor}`;
  const globalKey = `public-ai:${day}:all`;
  const [mine, all] = await Promise.all([
    env.CACHE.get(visitorKey),
    env.CACHE.get(globalKey),
  ]);
  return {
    visitorKey,
    globalKey,
    used: Number(mine ?? 0),
    globalUsed: Number(all ?? 0),
  };
}

async function status(request: Request, env: PublicAiEnv) {
  const [settings, current, admin] = await Promise.all([
    readSettings(env),
    usage(request, env),
    isAdmin(request, env),
  ]);
  return {
    enabled: settings.enabled && Boolean(env.AI),
    aiBinding: Boolean(env.AI),
    model: settings.model,
    modelLabel:
      PUBLIC_AI_MODELS.find((item) => item.id === settings.model)?.label ??
      settings.model,
    dailyLimit: settings.dailyLimit,
    used: current.used,
    remaining: admin ? null : Math.max(0, settings.dailyLimit - current.used),
    unlimited: admin,
    globalRemaining: Math.max(0, settings.globalDailyCap - current.globalUsed),
  };
}

type ChatBody = { prompt?: unknown; system?: unknown };

async function chat(request: Request, env: PublicAiEnv) {
  if (request.headers.get("x-amaru-csrf") !== "local-ui")
    return failure("csrf_failed", "Solicitud inválida.", 403);
  if (!env.AI)
    return failure(
      "not_configured",
      "Workers AI no está disponible en este servidor.",
      503,
    );
  const settings = await readSettings(env);
  const admin = await isAdmin(request, env);
  if (!settings.enabled && !admin)
    return failure(
      "disabled",
      "La prueba gratuita de IA está desactivada por el administrador.",
      403,
    );
  const body = (await request.json().catch(() => null)) as ChatBody | null;
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const system =
    typeof body?.system === "string" ? body.system.trim().slice(0, 4000) : "";
  if (prompt.length < 2 || prompt.length > 6000)
    return failure(
      "invalid_prompt",
      "Escribe una consulta de entre 2 y 6000 caracteres.",
      400,
    );
  const current = await usage(request, env);
  if (!admin) {
    if (current.used >= settings.dailyLimit)
      return failure(
        "limit_reached",
        `Usaste tus ${settings.dailyLimit} consultas gratuitas de hoy. Vuelve mañana.`,
        429,
      );
    if (current.globalUsed >= settings.globalDailyCap)
      return failure(
        "global_limit_reached",
        "Se agotó el cupo gratuito del sitio por hoy. Vuelve mañana.",
        429,
      );
  }
  // Count before running so parallel requests cannot exceed the quota.
  await Promise.all([
    env.CACHE.put(current.visitorKey, String(current.used + 1), {
      expirationTtl: DAY_SECONDS,
    }),
    env.CACHE.put(current.globalKey, String(current.globalUsed + 1), {
      expirationTtl: DAY_SECONDS,
    }),
  ]);
  const messages = [
    {
      role: "system",
      content:
        system ||
        "Eres un asistente útil y claro. Responde en español de Perú, de forma breve y ordenada.",
    },
    { role: "user", content: prompt },
  ];
  try {
    const result = (await env.AI.run(
      settings.model as Parameters<Ai["run"]>[0],
      { messages, max_tokens: settings.maxOutputTokens } as never,
    )) as { response?: string };
    return reply(
      envelope({
        text: String(result?.response ?? "").trim(),
        model: settings.model,
        remaining: admin
          ? null
          : Math.max(0, settings.dailyLimit - current.used - 1),
      }),
    );
  } catch (error) {
    console.error("public_ai_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return failure(
      "ai_failed",
      "El modelo no respondió. Inténtalo otra vez en unos minutos.",
      502,
    );
  }
}

export async function publicAiRouter(
  request: Request,
  env: PublicAiEnv,
  url: URL,
): Promise<Response | null> {
  const path = url.pathname;
  if (path === "/api/public-ai/status" && request.method === "GET")
    return reply(envelope(await status(request, env)));
  if (path === "/api/public-ai/chat" && request.method === "POST")
    return chat(request, env);
  // Admin-only (the gate in index.ts enforces it for /api/admin/*).
  if (path === "/api/admin/public-ai") {
    if (request.method === "GET")
      return reply(
        envelope({
          settings: await readSettings(env),
          models: PUBLIC_AI_MODELS,
        }),
      );
    if (request.method === "PUT") {
      if (request.headers.get("x-amaru-csrf") !== "local-ui")
        return failure("csrf_failed", "Solicitud inválida.", 403);
      const settings = sanitizeSettings(await request.json().catch(() => null));
      await env.CACHE.put(SETTINGS_KEY, JSON.stringify(settings));
      return reply(envelope({ settings, models: PUBLIC_AI_MODELS }));
    }
  }
  return null;
}
