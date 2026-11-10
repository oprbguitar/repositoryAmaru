import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Local-only control endpoints for the Vite dev server.
 *
 * `GET  /__amaru/health`   → `{ ok, pid, startedAt }` so the UI knows a local
 *                            dev server (not Cloudflare) is answering.
 * `POST /__amaru/shutdown` → closes the dev server cleanly.
 *
 * The checks live in pure functions so they can be unit-tested without
 * starting a server.
 */

export const CONTROL_PREFIX = "/__amaru/";
export const HEALTH_PATH = "/__amaru/health";
export const SHUTDOWN_PATH = "/__amaru/shutdown";
export const CSRF_HEADER = "x-amaru-csrf";
export const CSRF_VALUE = "local-ui";
/** Set by scripts/web-share-proxy.mjs on every request it forwards. */
export const SHARE_PROXY_HEADER = "x-amaru-via-share";

const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function isLoopbackAddress(address: string | null | undefined) {
  return typeof address === "string" && LOOPBACK_ADDRESSES.has(address);
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isLoopbackOrigin(origin: string) {
  try {
    return LOOPBACK_HOSTNAMES.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export type ShutdownRequest = {
  method: string | undefined;
  remoteAddress: string | null | undefined;
  headers: Record<string, string | string[] | undefined>;
};

export type ShutdownDecision =
  | { allowed: true }
  | { allowed: false; status: 403 | 405; reason: string };

/**
 * A shutdown is honoured only when every condition holds:
 * - POST;
 * - the TCP peer is loopback (the dev server binds 127.0.0.1, but a proxy on
 *   the same machine is also loopback, hence the next checks);
 * - it was not forwarded by the share proxy or any other proxy;
 * - it carries the same CSRF header the UI sends on every mutation;
 * - if the browser sent an Origin, that origin is loopback too.
 */
export function evaluateShutdownRequest(
  request: ShutdownRequest,
): ShutdownDecision {
  if (request.method !== "POST")
    return { allowed: false, status: 405, reason: "method_not_allowed" };
  if (!isLoopbackAddress(request.remoteAddress))
    return { allowed: false, status: 403, reason: "not_loopback" };
  const headers = request.headers;
  if (
    headerValue(headers[SHARE_PROXY_HEADER]) !== undefined ||
    headerValue(headers["x-forwarded-for"]) !== undefined ||
    headerValue(headers.forwarded) !== undefined
  )
    return { allowed: false, status: 403, reason: "proxied_request" };
  if (headerValue(headers[CSRF_HEADER]) !== CSRF_VALUE)
    return { allowed: false, status: 403, reason: "missing_csrf_header" };
  const origin = headerValue(headers.origin);
  if (origin !== undefined && !isLoopbackOrigin(origin))
    return { allowed: false, status: 403, reason: "foreign_origin" };
  return { allowed: true };
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

type MinimalServer = {
  middlewares: {
    use: (
      handler: (
        request: IncomingMessage,
        response: ServerResponse,
        next: () => void,
      ) => void,
    ) => void;
  };
  close: () => Promise<void>;
};

/** Vite plugin. Keep it before `cloudflare()` so it answers first. */
export function amaruDevControl() {
  const startedAt = new Date().toISOString();
  return {
    name: "amaru-dev-control",
    apply: "serve" as const,
    configureServer(server: MinimalServer) {
      server.middlewares.use((request, response, next) => {
        const path = (request.url ?? "").split("?")[0] ?? "";
        if (!path.startsWith(CONTROL_PREFIX)) return next();

        if (path === HEALTH_PATH) {
          if (request.method !== "GET" && request.method !== "HEAD") {
            sendJson(response, 405, { ok: false, error: "method_not_allowed" });
            return;
          }
          sendJson(response, 200, { ok: true, pid: process.pid, startedAt });
          return;
        }

        if (path === SHUTDOWN_PATH) {
          const decision = evaluateShutdownRequest({
            method: request.method,
            remoteAddress: request.socket.remoteAddress,
            headers: request.headers,
          });
          if (!decision.allowed) {
            sendJson(response, decision.status, {
              ok: false,
              error: decision.reason,
            });
            return;
          }
          sendJson(response, 200, { ok: true, shuttingDown: true });
          console.info("[amaru] Apagado solicitado desde la interfaz local.");
          setTimeout(() => {
            // Keep-alive sockets can stall close(); never hang the shutdown.
            setTimeout(() => process.exit(0), 3000).unref();
            server
              .close()
              .catch(() => undefined)
              .finally(() => process.exit(0));
          }, 250);
          return;
        }

        sendJson(response, 404, { ok: false, error: "not_found" });
      });
    },
  };
}
