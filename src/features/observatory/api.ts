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
