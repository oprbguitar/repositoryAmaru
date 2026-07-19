import type { ApiResponse, LibraryStats, SourceHealth } from "../types/api";

const baseUrl = "http://127.0.0.1:5174";
const [response, sourcesResponse] = await Promise.all([
  fetch(`${baseUrl}/api/status`, { signal: AbortSignal.timeout(5000) }),
  fetch(`${baseUrl}/api/sources`, { signal: AbortSignal.timeout(5000) }),
]);
if (!response.ok) throw new Error(`AMARU respondió ${response.status}.`);
if (!sourcesResponse.ok)
  throw new Error(`Fuentes respondió ${sourcesResponse.status}.`);
const body = (await response.json()) as ApiResponse<LibraryStats>;
const sources = (await sourcesResponse.json()) as ApiResponse<SourceHealth[]>;
console.table({
  database: body.data.databaseStatus,
  objectStorage: body.data.objectStorageStatus,
  cache: body.data.cacheStatus,
  documents: body.data.discovered,
  lastScan: body.data.lastScanAt ?? "sin escaneo",
});
console.table(
  sources.data.map((source) => ({
    source: source.name,
    status: source.status,
    http: source.lastHttpStatus ?? "—",
    records: source.recordCount,
    lastSuccess: source.lastSuccessAt ?? "sin éxito",
    credential: source.credentialConfigured
      ? "configurada o pública"
      : `falta ${source.secretBindingName}`,
  })),
);
