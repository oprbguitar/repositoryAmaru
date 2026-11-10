import type {
  ApiResponse,
  DocumentAnalysis,
  LibraryStats,
  LocalDocument,
} from "../../../types/api";

export async function getLibraryStats(): Promise<ApiResponse<LibraryStats>> {
  const response = await fetch("/api/status");
  if (!response.ok)
    throw new Error("No se pudo leer el estado de la biblioteca.");
  return response.json();
}

export async function getDocuments(filters: {
  q: string;
  type: string;
  status: string;
}): Promise<ApiResponse<LocalDocument[]>> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  params.set("limit", "100");
  const response = await fetch(`/api/local-library?${params.toString()}`);
  if (!response.ok)
    throw new Error("No se pudieron leer los archivos indexados.");
  return response.json();
}

export async function getDocument(
  id: string,
): Promise<ApiResponse<LocalDocument>> {
  const response = await fetch(`/api/local-library/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error("No se pudo abrir la previsualización.");
  return response.json();
}

export async function getDocumentAnalysis(
  id: string,
): Promise<ApiResponse<DocumentAnalysis | null>> {
  const response = await fetch(
    `/api/local-library/${encodeURIComponent(id)}/analysis`,
  );
  if (!response.ok) throw new Error("No se pudo leer el análisis guardado.");
  return response.json();
}

export async function analyzeDocument(
  id: string,
  force = false,
): Promise<ApiResponse<DocumentAnalysis>> {
  const response = await fetch(
    `/api/local-library/${encodeURIComponent(id)}/analysis${force ? "?force=1" : ""}`,
    {
      method: "POST",
      headers: { "x-amaru-csrf": "local-ui" },
    },
  );
  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<DocumentAnalysis> | null;
  if (!response.ok || !payload) {
    throw new Error(
      payload?.errors?.[0]?.message ?? "No se pudo generar el análisis.",
    );
  }
  return payload;
}

export async function updateDocument(
  id: string,
  update: { isRelevant?: boolean; inWatchlist?: boolean },
): Promise<ApiResponse<LocalDocument>> {
  const response = await fetch(`/api/local-library/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", "x-amaru-csrf": "local-ui" },
    body: JSON.stringify(update),
  });
  if (!response.ok) throw new Error("No se pudo guardar el cambio.");
  return response.json();
}

/** Ids de documentos con análisis guardado; si falla, la biblioteca sigue funcionando. */
export async function getAnalyzedIds(): Promise<string[]> {
  const response = await fetch("/api/local-library-analyses");
  if (!response.ok) return [];
  const payload = (await response.json()) as ApiResponse<string[]>;
  return Array.isArray(payload.data) ? payload.data : [];
}
