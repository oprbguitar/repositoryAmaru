/**
 * Single-administrator access for the public deployment.
 *
 * - Credentials live only in Worker secrets (`ADMIN_PASSWORD`) and a plain
 *   var (`ADMIN_USER`); nothing is versioned. If the secret is missing the
 *   login fails closed.
 * - The session is a signed, HttpOnly, SameSite=Strict cookie
 *   (`<expiry>.<hmac>`), so no session table is needed.
 * - Local development (`APP_ENV !== "production"`) keeps its old behaviour:
 *   the person at the keyboard is the administrator.
 */

export type AdminEnv = {
  APP_ENV: string;
  CACHE: KVNamespace;
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  DEVELOPER_LAB_ENCRYPTION_KEY?: string;
};

const COOKIE = "amaru_admin";
const SESSION_SECONDS = 8 * 60 * 60;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;

const encoder = new TextEncoder();

export function isProduction(env: AdminEnv) {
  return env.APP_ENV === "production";
}

function sessionSecret(env: AdminEnv) {
  return env.ADMIN_SESSION_SECRET || env.DEVELOPER_LAB_ENCRYPTION_KEY || "";
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value)),
  );
}

/** Constant-time comparison over fixed-length digests. */
async function safeEqual(a: string, b: string) {
  const [left, right] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let index = 0; index < left.length; index += 1)
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  return diff === 0;
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export async function isAdmin(request: Request, env: AdminEnv) {
  if (!isProduction(env)) return true;
  const secret = sessionSecret(env);
  const cookie = readCookie(request, COOKIE);
  if (!secret || !cookie) return false;
  const [expiry, signature] = cookie.split(".");
  if (!expiry || !signature || Number(expiry) < Date.now() / 1000) return false;
  return safeEqual(signature, await hmac(secret, `admin:${expiry}`));
}

/** Pseudonymous, salted visitor id — the raw IP is never stored. */
export async function visitorId(request: Request, env: AdminEnv) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "local";
  const digest = await sha256(`${sessionSecret(env)}:${ip}`);
  return [...digest.slice(0, 12)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
  for (const [key, value] of new Headers(headers)) {
    response.headers.append(key, value);
  }
  return response;
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

export function adminRequired() {
  return jsonResponse(
    envelope(null, [
      {
        code: "admin_required",
        message:
          "Esta acción es solo para el administrador. Inicia sesión en «Administración».",
      },
    ]),
    401,
  );
}

/**
 * Decides which requests need the administrator in production. Reading the
 * observatory stays public; anything that writes, syncs, spends API credit or
 * reveals stored credentials does not.
 */
export function needsAdmin(request: Request, url: URL) {
  const path = url.pathname;
  if (path.startsWith("/api/admin/session") || path === "/api/admin/login")
    return false;
  if (path.startsWith("/api/public-ai/")) return false;
  if (path.startsWith("/api/admin/")) return true;
  if (path.startsWith("/api/developer-lab")) return true;
  if (path.startsWith("/api/integrations")) return true;
  if (path.startsWith("/api/local-models")) return true;
  return request.method !== "GET" && request.method !== "HEAD";
}

async function login(request: Request, env: AdminEnv) {
  if (request.headers.get("x-amaru-csrf") !== "local-ui")
    return jsonResponse(
      envelope(null, [{ code: "csrf_failed", message: "Solicitud inválida." }]),
      403,
    );
  const expectedUser = env.ADMIN_USER || "oprbguitar";
  const expectedPassword = env.ADMIN_PASSWORD ?? "";
  const secret = sessionSecret(env);
  if (!expectedPassword || !secret)
    return jsonResponse(
      envelope(null, [
        {
          code: "admin_not_configured",
          message:
            "El acceso de administrador aún no está configurado en el servidor (falta el secreto ADMIN_PASSWORD).",
        },
      ]),
      503,
    );
  const lockKey = `admin:fail:${await visitorId(request, env)}`;
  const failures = Number((await env.CACHE.get(lockKey)) ?? 0);
  if (failures >= MAX_FAILED_ATTEMPTS)
    return jsonResponse(
      envelope(null, [
        {
          code: "locked",
          message:
            "Demasiados intentos fallidos. Espera 15 minutos e inténtalo otra vez.",
        },
      ]),
      429,
    );
  const body = (await request.json().catch(() => null)) as {
    user?: unknown;
    password?: unknown;
  } | null;
  const user = typeof body?.user === "string" ? body.user.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const [userOk, passwordOk] = await Promise.all([
    safeEqual(user.toLowerCase(), expectedUser.toLowerCase()),
    safeEqual(password, expectedPassword),
  ]);
  if (!userOk || !passwordOk) {
    await env.CACHE.put(lockKey, String(failures + 1), {
      expirationTtl: LOCKOUT_SECONDS,
    });
    return jsonResponse(
      envelope(null, [
        { code: "invalid_login", message: "Usuario o clave incorrectos." },
      ]),
      401,
    );
  }
  await env.CACHE.delete(lockKey);
  const expiry = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const value = `${expiry}.${await hmac(secret, `admin:${expiry}`)}`;
  return jsonResponse(envelope({ authenticated: true }), 200, {
    "set-cookie": `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`,
  });
}

export async function adminRouter(
  request: Request,
  env: AdminEnv,
  url: URL,
): Promise<Response | null> {
  if (url.pathname === "/api/admin/session" && request.method === "GET") {
    return jsonResponse(
      envelope({
        authenticated: await isAdmin(request, env),
        mode: isProduction(env) ? "production" : "local",
        configured: !isProduction(env) || Boolean(env.ADMIN_PASSWORD),
      }),
    );
  }
  if (url.pathname === "/api/admin/login" && request.method === "POST")
    return login(request, env);
  if (url.pathname === "/api/admin/logout" && request.method === "POST")
    return jsonResponse(envelope({ authenticated: false }), 200, {
      "set-cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    });
  return null;
}
