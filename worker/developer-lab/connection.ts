import {
  type CredentialState,
  getDeveloperLabProvider,
} from "../../lib/developer-lab/registry";
import type { ConnectionTestResult } from "../../lib/developer-lab/types";
import type { DeveloperLabCredentialEnv } from "./credential-service";
import { ProviderCredentialService } from "./credential-service";

type ConnectionEnv = DeveloperLabCredentialEnv & {
  AI?: Ai;
  OLLAMA_BASE_URL?: string;
  LM_STUDIO_BASE_URL?: string;
  VLLM_BASE_URL?: string;
  LOCALAI_BASE_URL?: string;
};

function classify(status: number): CredentialState {
  if (status === 401) return "invalid";
  if (status === 402) return "insufficient_permissions";
  if (status === 403) return "insufficient_permissions";
  if (status === 429) return "rate_limited";
  return status >= 500 ? "unavailable" : "invalid";
}

function modelCount(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  if (Array.isArray(value.data)) return value.data.length;
  if (Array.isArray(value.models)) return value.models.length;
  return null;
}

function localUrl(providerId: string, baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  if (providerId === "ollama") return `${trimmed}/api/tags`;
  return `${trimmed}/models`;
}

export async function testProviderConnection(
  providerId: string,
  env: ConnectionEnv,
): Promise<ConnectionTestResult> {
  const provider = getDeveloperLabProvider(providerId);
  if (!provider) throw new Error("Proveedor desconocido.");
  const testedAt = new Date().toISOString();
  const startedAt = performance.now();
  const resultBase = {
    providerId,
    requestId: crypto.randomUUID(),
    testedAt,
  };
  if (provider.connection.kind === "binding") {
    const ok = Boolean(env.AI);
    return {
      ...resultBase,
      ok,
      state: ok ? "connection_verified" : "not_configured",
      httpStatus: null,
      latencyMs: Math.round(performance.now() - startedAt),
      modelCount: null,
      message: ok
        ? "Binding local disponible."
        : "El binding de Workers AI no está configurado.",
    };
  }
  if (provider.connection.kind === "registered") {
    return {
      ...resultBase,
      ok: false,
      state: "unavailable",
      httpStatus: null,
      latencyMs: Math.round(performance.now() - startedAt),
      modelCount: null,
      message: "Prueba de conexión pendiente para este adaptador.",
    };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const headers = new Headers({ accept: "application/json" });
    let url: string;
    if (provider.connection.kind === "local") {
      const base = env[provider.connection.url];
      if (typeof base !== "string" || !base)
        throw new Error("Endpoint local no configurado.");
      url = localUrl(providerId, base);
    } else {
      const credential = await new ProviderCredentialService(
        env,
      ).resolveCredential(providerId);
      url = provider.connection.url;
      if (provider.connection.kind === "api-key-query") {
        const query = new URL(url);
        query.searchParams.set("key", credential);
        url = query.toString();
      } else if (providerId === "anthropic") {
        headers.set("x-api-key", credential);
        headers.set("anthropic-version", "2023-06-01");
      } else {
        headers.set("authorization", `Bearer ${credential}`);
      }
    }
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    const payload = await response.json().catch(() => null);
    const count = modelCount(payload);
    const state = response.ok
      ? "connection_verified"
      : classify(response.status);
    const message = response.ok
      ? count === null
        ? "Conexión verificada."
        : `Conexión verificada; ${count} modelos visibles.`
      : response.status === 429
        ? "El proveedor aplicó un límite temporal."
        : response.status === 401
          ? "La credencial fue rechazada."
          : response.status === 403
            ? "La credencial no tiene permisos suficientes."
            : "El proveedor no pudo verificar la conexión.";
    const result: ConnectionTestResult = {
      ...resultBase,
      ok: response.ok,
      state,
      httpStatus: response.status,
      latencyMs,
      modelCount: count,
      message,
    };
    await new ProviderCredentialService(env).updateTestState(
      providerId,
      state,
      testedAt,
      { httpStatus: response.status, latencyMs, modelCount: count, message },
    );
    console.info("developer_lab_connection_test", {
      providerId,
      state,
      httpStatus: response.status,
      latencyMs,
      requestId: result.requestId,
    });
    return result;
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startedAt);
    const timedOut =
      error instanceof DOMException && error.name === "AbortError";
    const state: CredentialState = timedOut ? "unavailable" : "unavailable";
    const message = timedOut
      ? "La conexión excedió 12 segundos."
      : error instanceof Error && error.message === "Credencial no configurada."
        ? error.message
        : provider.location === "local"
          ? "El servidor local no está disponible."
          : "No fue posible contactar al proveedor.";
    const result: ConnectionTestResult = {
      ...resultBase,
      ok: false,
      state:
        message === "Credencial no configurada." ? "not_configured" : state,
      httpStatus: null,
      latencyMs,
      modelCount: null,
      message,
    };
    await new ProviderCredentialService(env).updateTestState(
      providerId,
      result.state,
      testedAt,
      { httpStatus: null, latencyMs, modelCount: null, message },
    );
    return result;
  } finally {
    clearTimeout(timer);
  }
}
