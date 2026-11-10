import {
  getIntegration,
  INTEGRATION_BINDINGS,
  INTEGRATION_CATEGORIES,
  INTEGRATIONS,
} from "../lib/integrations/catalog";
import type { IntegrationStatus, IntegrationsResponse } from "../types/api";
import { openSecret, sealSecret } from "./secret-box";

export type IntegrationsEnv = {
  DB: D1Database;
  CACHE: KVNamespace;
  DEVELOPER_LAB_ENCRYPTION_KEY?: string;
  [key: string]: unknown;
};

type CredentialRow = {
  binding_name: string;
  alias: string;
  last_four: string;
  encrypted_value: string;
  encryption_iv: string;
  last_tested_at: string | null;
  last_test_status: string | null;
  last_test_message: string | null;
  created_at: string;
  updated_at: string;
};

const OVERLAY_CACHE_KEY = "integrations:overlay-version";

function environmentValue(env: IntegrationsEnv, binding: string): string {
  const value = env[binding];
  return typeof value === "string" ? value.trim() : "";
}

async function storedRows(env: IntegrationsEnv): Promise<CredentialRow[]> {
  const rows = await env.DB.prepare(
    "SELECT * FROM integration_credentials",
  ).all<CredentialRow>();
  return rows.results.filter((row) =>
    INTEGRATION_BINDINGS.includes(row.binding_name),
  );
}

/**
 * Devuelve un entorno equivalente al del Worker donde cada binding del catálogo
 * toma el valor guardado y cifrado desde la interfaz, si existe. Las variables
 * de `.dev.vars` siguen funcionando y se usan cuando no hay valor guardado, de
 * modo que ninguna configuración previa deja de funcionar.
 *
 * Si falta DEVELOPER_LAB_ENCRYPTION_KEY las filas no se pueden descifrar: se
 * conserva el entorno tal cual en lugar de fallar la sincronización completa.
 */
export async function withStoredSecrets<
  T extends {
    DB: D1Database;
    CACHE: KVNamespace;
    DEVELOPER_LAB_ENCRYPTION_KEY?: string;
  },
>(env: T): Promise<T> {
  let rows: CredentialRow[];
  try {
    rows = await storedRows(env as unknown as IntegrationsEnv);
  } catch {
    return env;
  }
  if (!rows.length) return env;
  const overlay: Record<string, string> = {};
  for (const row of rows) {
    try {
      overlay[row.binding_name] = await openSecret(
        { encryptedValue: row.encrypted_value, iv: row.encryption_iv },
        env.DEVELOPER_LAB_ENCRYPTION_KEY,
      );
    } catch (error) {
      console.error("integration_secret_unreadable", {
        binding: row.binding_name,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return { ...env, ...overlay };
}

/** Valor efectivo de un binding: primero lo guardado, luego el entorno. */
export async function resolveSecret(
  env: IntegrationsEnv,
  binding: string,
): Promise<string> {
  const row = await env.DB.prepare(
    "SELECT * FROM integration_credentials WHERE binding_name = ?",
  )
    .bind(binding)
    .first<CredentialRow>()
    .catch(() => null);
  if (row) {
    try {
      return await openSecret(
        { encryptedValue: row.encrypted_value, iv: row.encryption_iv },
        env.DEVELOPER_LAB_ENCRYPTION_KEY,
      );
    } catch {
      // Credencial ilegible: se cae al valor del entorno.
    }
  }
  return environmentValue(env, binding);
}

export async function listIntegrations(
  env: IntegrationsEnv,
): Promise<IntegrationsResponse> {
  const rows = await storedRows(env);
  const stored = new Map(rows.map((row) => [row.binding_name, row]));
  const sourceRows = await env.DB.prepare(
    "SELECT id, secret_binding_name, status, last_success_at, record_count FROM source_registry WHERE secret_binding_name IS NOT NULL",
  )
    .all<{
      id: string;
      secret_binding_name: string;
      status: string;
      last_success_at: string | null;
      record_count: number | null;
    }>()
    .catch(() => ({ results: [] }));
  const items: IntegrationStatus[] = INTEGRATIONS.map((definition) => {
    const row = stored.get(definition.binding);
    const fromEnvironment = environmentValue(env, definition.binding);
    const sources = sourceRows.results
      .filter((source) => definition.sourceIds.includes(source.id))
      .map((source) => ({
        id: source.id,
        status: source.status,
        lastSuccessAt: source.last_success_at,
        recordCount: Number(source.record_count ?? 0),
      }));
    return {
      binding: definition.binding,
      name: definition.name,
      category: definition.category,
      unlocks: definition.unlocks,
      apiKeyUrl: definition.apiKeyUrl,
      documentationUrl: definition.documentationUrl,
      freeTierNote: definition.freeTierNote,
      configured: Boolean(row) || fromEnvironment.length > 0,
      storage: row
        ? "local_encrypted"
        : fromEnvironment
          ? "environment"
          : "none",
      lastFour: row
        ? row.last_four
        : fromEnvironment
          ? fromEnvironment.slice(-4)
          : null,
      updatedAt: row?.updated_at ?? null,
      lastTestedAt: row?.last_tested_at ?? null,
      lastTestStatus:
        row?.last_test_status === "ok" || row?.last_test_status === "failed"
          ? row.last_test_status
          : null,
      lastTestMessage: row?.last_test_message ?? null,
      testable: definition.probe !== null,
      verified: definition.verified ?? null,
      probeNote: definition.probeNote ?? null,
      needs: definition.probe?.needs ?? [],
      minLength: definition.minLength ?? 8,
      sources,
    };
  });
  return {
    categories: INTEGRATION_CATEGORIES,
    items,
    encryptionConfigured: Boolean(env.DEVELOPER_LAB_ENCRYPTION_KEY?.trim()),
  };
}

/**
 * `source_registry.configured` se usa para decidir si una fuente puede
 * sincronizarse. Se refleja aquí para que la tabla de salud diga la verdad
 * inmediatamente después de guardar o borrar una credencial.
 */
async function markSourcesConfigured(
  env: IntegrationsEnv,
  binding: string,
  configured: boolean,
): Promise<void> {
  const definition = getIntegration(binding);
  if (!definition?.sourceIds.length) return;
  const placeholders = definition.sourceIds.map(() => "?").join(",");
  await env.DB.prepare(
    `UPDATE source_registry SET configured = ?,
       status = CASE WHEN ? = 0 THEN 'not_configured'
                     WHEN status = 'not_configured' THEN 'ready' ELSE status END,
       updated_at = CURRENT_TIMESTAMP
     WHERE id IN (${placeholders})`,
  )
    .bind(Number(configured), Number(configured), ...definition.sourceIds)
    .run();
  await env.CACHE.put(OVERLAY_CACHE_KEY, new Date().toISOString(), {
    expirationTtl: 86_400,
  });
}

export async function saveIntegration(
  env: IntegrationsEnv,
  binding: string,
  credential: string,
): Promise<IntegrationStatus> {
  const definition = getIntegration(binding);
  if (!definition) throw new Error("Integración desconocida.");
  const value = credential.trim();
  if (value.length < (definition.minLength ?? 8))
    throw new Error("La credencial no tiene una longitud válida.");
  const sealed = await sealSecret(value, env.DEVELOPER_LAB_ENCRYPTION_KEY);
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO integration_credentials
      (binding_name, alias, last_four, encrypted_value, encryption_iv, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(binding_name) DO UPDATE SET
      alias = excluded.alias, last_four = excluded.last_four,
      encrypted_value = excluded.encrypted_value, encryption_iv = excluded.encryption_iv,
      last_tested_at = NULL, last_test_status = NULL, last_test_message = NULL,
      updated_at = excluded.updated_at
  `)
    .bind(
      binding,
      definition.name,
      value.slice(-4),
      sealed.encryptedValue,
      sealed.iv,
      now,
      now,
    )
    .run();
  await markSourcesConfigured(env, binding, true);
  const listed = await listIntegrations(env);
  return listed.items.find(
    (item) => item.binding === binding,
  ) as IntegrationStatus;
}

export async function deleteIntegration(
  env: IntegrationsEnv,
  binding: string,
): Promise<IntegrationStatus> {
  if (!getIntegration(binding)) throw new Error("Integración desconocida.");
  await env.DB.prepare(
    "DELETE FROM integration_credentials WHERE binding_name = ?",
  )
    .bind(binding)
    .run();
  await markSourcesConfigured(
    env,
    binding,
    environmentValue(env, binding).length > 0,
  );
  const listed = await listIntegrations(env);
  return listed.items.find(
    (item) => item.binding === binding,
  ) as IntegrationStatus;
}

export type IntegrationTestResult = {
  binding: string;
  status: "ok" | "failed" | "not_configured";
  httpStatus: number | null;
  latencyMs: number;
  message: string;
  testedAt: string;
};

export async function testIntegration(
  env: IntegrationsEnv,
  binding: string,
): Promise<IntegrationTestResult> {
  const definition = getIntegration(binding);
  const testedAt = new Date().toISOString();
  if (!definition) throw new Error("Integración desconocida.");
  const credential = await resolveSecret(env, binding);
  if (!credential) {
    return {
      binding,
      status: "not_configured",
      httpStatus: null,
      latencyMs: 0,
      message: "No hay credencial guardada ni variable de entorno.",
      testedAt,
    };
  }
  if (!definition.probe) {
    return {
      binding,
      status: "not_configured",
      httpStatus: null,
      latencyMs: 0,
      message: "Esta integración no expone una prueba de conexión.",
      testedAt,
    };
  }
  const started = Date.now();
  let httpStatus: number | null = null;
  let status: "ok" | "failed" = "failed";
  let message: string;
  try {
    const probe = definition.probe;
    const secrets: Record<string, string> = {};
    for (const other of probe.needs ?? [])
      secrets[other] = await resolveSecret(env, other);
    const missing = (probe.needs ?? []).filter((other) => !secrets[other]);
    if (missing.length) {
      return {
        binding,
        status: "not_configured",
        httpStatus: null,
        latencyMs: 0,
        message: `Falta también ${missing.join(", ")}.`,
        testedAt,
      };
    }
    let ok: boolean;
    let detail = "";
    if (probe.run) {
      const result = await probe.run(credential, secrets);
      httpStatus = result.httpStatus;
      ok = result.ok;
      detail = result.detail;
    } else {
      const response = await fetch(probe.url?.(credential) ?? "", {
        headers: {
          accept: "application/json",
          "user-agent":
            "AMARU-AI-Observatory/0.1 (local-first research application)",
          ...(probe.headers?.(credential) ?? {}),
        },
        signal: AbortSignal.timeout(15_000),
      });
      httpStatus = response.status;
      detail = await response.text().catch(() => "");
      ok = response.ok && !(probe.rejectBody?.test(detail) ?? false);
    }
    if (ok) {
      status = "ok";
      message = `Conexión verificada (HTTP ${httpStatus}).`;
    } else {
      message =
        `La API respondió HTTP ${httpStatus}. ${detail.slice(0, 160)}`.trim();
    }
  } catch (error) {
    message =
      error instanceof Error
        ? `No se pudo contactar la API: ${error.message}`
        : "No se pudo contactar la API.";
  }
  const latencyMs = Date.now() - started;
  await env.DB.prepare(
    `UPDATE integration_credentials SET last_tested_at = ?, last_test_status = ?,
       last_test_message = ?, updated_at = ? WHERE binding_name = ?`,
  )
    .bind(testedAt, status, message.slice(0, 240), testedAt, binding)
    .run();
  return { binding, status, httpStatus, latencyMs, message, testedAt };
}
