import type {
  ApiResponse,
  LiveEvent,
  ObservatoryDashboard,
  ObservatoryRecord,
  ProviderRecord,
  SourceHealth,
  SynchronizationSummary,
} from "../../../types/api";

async function read<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo consultar ${url}.`);
  return response.json();
}

export function getDashboard() {
  return read<ObservatoryDashboard>("/api/dashboard");
}

export function getProviders() {
  return read<ProviderRecord[]>("/api/providers");
}

export function getSources() {
  return read<SourceHealth[]>("/api/sources");
}

export function getLiveEvents() {
  return read<LiveEvent[]>("/api/live-events");
}

export function getRecords(filters: {
  kind?: string;
  source?: string;
  q?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.source) params.set("source", filters.source);
  if (filters.q) params.set("q", filters.q);
  params.set("limit", String(filters.limit ?? 100));
  return read<ObservatoryRecord[]>(`/api/records?${params.toString()}`);
}

export function getGlobalMap() {
  return read<import("../../../types/api").MapResponse>("/api/map/global");
}

export function getRegionalMap(region: "peru" | "latam") {
  return read<import("../../../types/api").MapResponse>(`/api/map/${region}`);
}

export function getCountryPanel(code: string) {
  return read<import("../../../types/api").CountryPanelData>(
    `/api/map/countries/${code}`,
  );
}

export function getModelRankings(type: string) {
  return read<import("../../../types/api").ModelRankingResponse>(
    `/api/models/rankings?type=${encodeURIComponent(type)}`,
  );
}

export function getModelOfferings(modelId: string) {
  return read<import("../../../types/api").ModelOffering[]>(
    `/api/models/offerings?model=${encodeURIComponent(modelId)}`,
  );
}

export function getModelDetail(modelId: string) {
  return read<import("../../../types/api").ModelDetail>(
    `/api/models/detail?model=${encodeURIComponent(modelId)}`,
  );
}

export function getProviderModels(providerId: string) {
  return read<import("../../../types/api").ProviderModelsResponse>(
    `/api/providers/${encodeURIComponent(providerId)}/models`,
  );
}

export function getPriceHistory(limit?: number) {
  return read<import("../../../types/api").PriceHistoryResponse>(
    `/api/dashboard/price-history${limit ? `?limit=${limit}` : ""}`,
  );
}

export function getGithubRankings(view: string) {
  return read<import("../../../types/api").GithubRankingResponse>(
    `/api/github/rankings?view=${encodeURIComponent(view)}`,
  );
}

export function getVideos(params: URLSearchParams) {
  return read<import("../../../types/api").VideoListResponse>(
    `/api/videos?${params.toString()}`,
  );
}

export function getIntegrations() {
  return read<import("../../../types/api").IntegrationsResponse>(
    "/api/integrations",
  );
}

export function getMarketQuotes(force = false) {
  return read<import("../../../types/api").MarketQuotesResponse>(
    `/api/market/quotes${force ? "?force=1" : ""}`,
  );
}

async function mutateIntegration<T>(
  path: string,
  method: "PUT" | "DELETE" | "POST",
  body?: unknown,
): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    method,
    headers: { "content-type": "application/json", "x-amaru-csrf": "local-ui" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok)
    throw new Error(
      payload?.errors?.[0]?.message ?? "No se pudo actualizar la integración.",
    );
  if (!payload) throw new Error("Respuesta vacía del Worker.");
  return payload;
}

export function saveIntegration(binding: string, credential: string) {
  return mutateIntegration<import("../../../types/api").IntegrationStatus>(
    `/api/integrations/${binding}`,
    "PUT",
    { credential },
  );
}

export function deleteIntegration(binding: string) {
  return mutateIntegration<import("../../../types/api").IntegrationStatus>(
    `/api/integrations/${binding}`,
    "DELETE",
  );
}

export function testIntegration(binding: string) {
  return mutateIntegration<{
    binding: string;
    status: "ok" | "failed" | "not_configured";
    httpStatus: number | null;
    latencyMs: number;
    message: string;
    testedAt: string;
  }>(`/api/integrations/${binding}/test`, "POST");
}

export async function synchronize(
  scope: string,
): Promise<ApiResponse<SynchronizationSummary[]>> {
  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json", "x-amaru-csrf": "local-ui" },
    body: JSON.stringify({ scope }),
  });
  if (!response.ok && response.status !== 207)
    throw new Error("No se pudo iniciar la sincronización.");
  return response.json();
}
