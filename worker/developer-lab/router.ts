import { z } from "zod";
import {
  DEVELOPER_LAB_PROVIDERS,
  getDeveloperLabProvider,
} from "../../lib/developer-lab/registry";
import type {
  CredentialMetadata,
  DeveloperLabProvider,
} from "../../lib/developer-lab/types";
import type { ApiResponse } from "../../types/api";
import { testProviderConnection } from "./connection";
import {
  type DeveloperLabCredentialEnv,
  ProviderCredentialService,
} from "./credential-service";
import {
  executeTestbench,
  listTestbenchModels,
  type TestbenchEnv,
} from "./testbench";

type DeveloperLabEnv = DeveloperLabCredentialEnv & { AI?: Ai };

const configureSchema = z.object({
  credential: z.string().min(8).max(500),
  alias: z.string().trim().min(1).max(80).optional(),
  storage: z.enum(["temporary", "local"]),
});

const sessionSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

const testTypeSchema = z.enum(["text", "reasoning", "code", "image", "video"]);

const executeSchema = z.object({
  providerId: z.string().regex(/^[a-z0-9-]+$/),
  modelId: z.string().trim().min(1).max(200),
  testType: testTypeSchema,
  prompt: z.string().trim().min(1).max(20_000),
  imageBase64: z
    .string()
    .regex(/^[A-Za-z0-9+/=]+$/)
    .max(14_000_000)
    .optional(),
  imageMimeType: z
    .enum(["image/png", "image/jpeg", "image/webp", "image/gif"])
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().int().min(1).max(65_536).optional(),
});

function envelope<T>(
  data: T,
  options: Partial<ApiResponse<T>["meta"]> & {
    errors?: ApiResponse<T>["errors"];
  } = {},
): ApiResponse<T> {
  const { errors, ...meta } = options;
  return {
    data,
    meta: {
      requestId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      ...meta,
    },
    ...(errors?.length ? { errors } : {}),
  };
}

function json<T>(payload: ApiResponse<T>, status = 200): Response {
  return Response.json(payload, { status });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
): Response {
  return json(envelope(null, { errors: [{ code, message }] }), status);
}

function protectedRequest(request: Request): boolean {
  if (request.headers.get("x-amaru-csrf") !== "local-ui") return false;
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function listProviders(
  env: DeveloperLabEnv,
): Promise<DeveloperLabProvider[]> {
  const service = new ProviderCredentialService(env);
  const credentials = new Map(
    (await service.listCredentialMetadata()).map((item) => [
      item.providerId,
      item,
    ]),
  );
  const [counts, statuses] = await Promise.all([
    env.DB.prepare(`
      SELECT COALESCE(provider_id, source_id) AS provider_id, COUNT(*) AS model_count
      FROM observatory_records WHERE record_kind = 'model'
      GROUP BY COALESCE(provider_id, source_id)
    `).all<{ provider_id: string; model_count: number }>(),
    env.DB.prepare("SELECT * FROM developer_lab_provider_status").all<{
      provider_id: string;
      credential_state: CredentialMetadata["state"];
      last_tested_at: string;
      last_success_at: string | null;
      discovered_model_count: number | null;
    }>(),
  ]);
  const modelCounts = new Map(
    counts.results.map((row) => [
      row.provider_id.replace(/-api$/, ""),
      Number(row.model_count),
    ]),
  );
  const statusByProvider = new Map(
    statuses.results.map((row) => [row.provider_id, row]),
  );
  return DEVELOPER_LAB_PROVIDERS.map((provider) => {
    const status = statusByProvider.get(provider.id);
    const configured = credentials.get(provider.id) ?? null;
    const credential = configured
      ? {
          ...configured,
          state: status?.credential_state ?? configured.state,
          lastTestedAt: status?.last_tested_at ?? configured.lastTestedAt,
          verifiedAt:
            status?.credential_state === "connection_verified"
              ? status.last_tested_at
              : configured.verifiedAt,
        }
      : null;
    return {
      id: provider.id,
      name: provider.name,
      location: provider.location,
      categories: [...provider.categories],
      credentialBinding: provider.credentialBinding,
      credential,
      modelCount:
        status?.discovered_model_count ?? modelCounts.get(provider.id) ?? 0,
      lastSuccessfulTest: status?.last_success_at ?? null,
      supports: {
        modelDiscovery: provider.supportsModelDiscovery,
        streaming: provider.supportsStreaming,
        usageMetadata: provider.supportsUsageMetadata,
        quotaInspection: provider.supportsQuotaInspection,
        fileUpload: provider.supportsFileUpload,
        asyncJobs: provider.supportsAsyncJobs,
      },
      links: {
        documentation: provider.documentationUrl,
        pricing: provider.pricingUrl,
        apiKey: provider.apiKeyUrl,
      },
    };
  });
}

export async function developerLabRouter(
  request: Request,
  env: DeveloperLabEnv,
  url: URL,
): Promise<Response | null> {
  const path = url.pathname;
  if (!path.startsWith("/api/developer-lab/")) return null;
  if (request.method === "GET" && path === "/api/developer-lab/providers") {
    const providers = await listProviders(env);
    return json(envelope(providers, { total: providers.length }));
  }
  const providerMatch = path.match(
    /^\/api\/developer-lab\/providers\/([a-z0-9-]+)$/,
  );
  if (request.method === "GET" && providerMatch) {
    const provider = (await listProviders(env)).find(
      (item) => item.id === providerMatch[1],
    );
    return provider
      ? json(envelope(provider))
      : errorResponse("not_found", "Proveedor inexistente.", 404);
  }
  const configureMatch = path.match(
    /^\/api\/developer-lab\/providers\/([a-z0-9-]+)\/configure$/,
  );
  if (request.method === "POST" && configureMatch) {
    if (!protectedRequest(request))
      return errorResponse("csrf_failed", "Solicitud sin protección.", 403);
    if (!getDeveloperLabProvider(configureMatch[1]))
      return errorResponse("not_found", "Proveedor inexistente.", 404);
    const parsed = configureSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return errorResponse(
        "invalid_payload",
        "La credencial no es válida.",
        400,
      );
    try {
      const metadata = await new ProviderCredentialService(
        env,
      ).configureCredential({
        providerId: configureMatch[1],
        ...parsed.data,
      });
      return json(envelope(metadata), 201);
    } catch (error) {
      return errorResponse(
        "credential_configuration_failed",
        error instanceof Error
          ? error.message
          : "No se pudo guardar la credencial.",
        400,
      );
    }
  }
  const modelsMatch = path.match(
    /^\/api\/developer-lab\/providers\/([a-z0-9-]+)\/models$/,
  );
  if (request.method === "GET" && modelsMatch) {
    if (!getDeveloperLabProvider(modelsMatch[1]))
      return errorResponse("not_found", "Proveedor inexistente.", 404);
    const parsedType = testTypeSchema.safeParse(
      url.searchParams.get("type") ?? "text",
    );
    if (!parsedType.success)
      return errorResponse(
        "invalid_test_type",
        "El tipo de prueba no es válido.",
        400,
      );
    const models = await listTestbenchModels(
      modelsMatch[1],
      parsedType.data,
      env as TestbenchEnv,
    );
    return json(
      envelope(models, { total: models.length, providerId: modelsMatch[1] }),
    );
  }
  if (request.method === "POST" && path === "/api/developer-lab/execute") {
    if (!protectedRequest(request))
      return errorResponse("csrf_failed", "Solicitud sin protección.", 403);
    const parsed = executeSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return errorResponse(
        "invalid_payload",
        "La solicitud de ejecución no es válida.",
        400,
      );
    try {
      const result = await executeTestbench(parsed.data, env as TestbenchEnv);
      return json(envelope(result));
    } catch (error) {
      return errorResponse(
        "execution_failed",
        error instanceof Error
          ? error.message
          : "La ejecución falló por un error desconocido.",
        502,
      );
    }
  }
  const testMatch = path.match(
    /^\/api\/developer-lab\/providers\/([a-z0-9-]+)\/test$/,
  );
  if (request.method === "POST" && testMatch) {
    if (!protectedRequest(request))
      return errorResponse("csrf_failed", "Solicitud sin protección.", 403);
    if (!getDeveloperLabProvider(testMatch[1]))
      return errorResponse("not_found", "Proveedor inexistente.", 404);
    return json(envelope(await testProviderConnection(testMatch[1], env)));
  }
  const credentialMatch = path.match(
    /^\/api\/developer-lab\/providers\/([a-z0-9-]+)\/credential$/,
  );
  if (request.method === "DELETE" && credentialMatch) {
    if (!protectedRequest(request))
      return errorResponse("csrf_failed", "Solicitud sin protección.", 403);
    const storage = await new ProviderCredentialService(env).deleteCredential(
      credentialMatch[1],
    );
    if (storage === "environment")
      return errorResponse(
        "environment_credential",
        "Elimina esta clave de .dev.vars y reinicia el servidor.",
        409,
      );
    return json(envelope({ deleted: Boolean(storage) }));
  }
  if (request.method === "GET" && path === "/api/developer-lab/models") {
    const rows = await env.DB.prepare(`
      SELECT id, provider_id, external_id, title, summary, data_json, retrieved_at,
        verification_status, is_stale FROM observatory_records
      WHERE record_kind = 'model' ORDER BY retrieved_at DESC LIMIT 500
    `).all<Record<string, unknown>>();
    const models = rows.results.map((row) => ({
      id: String(row.id),
      providerId: row.provider_id ? String(row.provider_id) : null,
      providerModelIdentifier: String(row.external_id),
      displayName: String(row.title),
      description: row.summary ? String(row.summary) : null,
      capabilities: JSON.parse(String(row.data_json ?? "{}")),
      discoveredAt: String(row.retrieved_at),
      verificationStatus: String(row.verification_status),
      stale: Boolean(row.is_stale),
    }));
    return json(envelope(models, { total: models.length }));
  }
  if (request.method === "GET" && path === "/api/developer-lab/sessions") {
    const rows = await env.DB.prepare(
      "SELECT id, name, status, tags_json, notes, created_at, updated_at FROM developer_lab_sessions ORDER BY updated_at DESC LIMIT 100",
    ).all<Record<string, unknown>>();
    return json(envelope(rows.results, { total: rows.results.length }));
  }
  if (request.method === "POST" && path === "/api/developer-lab/sessions") {
    if (!protectedRequest(request))
      return errorResponse("csrf_failed", "Solicitud sin protección.", 403);
    const parsed = sessionSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return errorResponse(
        "invalid_payload",
        "La sesión requiere un nombre.",
        400,
      );
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO developer_lab_sessions (id, name) VALUES (?, ?)",
    )
      .bind(id, parsed.data.name)
      .run();
    return json(
      envelope({ id, name: parsed.data.name, status: "active" }),
      201,
    );
  }
  return errorResponse("not_found", "La ruta del laboratorio no existe.", 404);
}
