import type {
  HubDetailPayload,
  HubPoolPayload,
} from "../../../lib/models/hub-payloads";
import type { SpecialtyId } from "../../../lib/models/specialties";
import type { ApiResponse } from "../../../types/api";

export type { HubDetailPayload, HubPoolPayload };

async function read<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  const body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !body) {
    throw new Error(
      body?.errors?.[0]?.message ?? `No se pudo consultar ${url}.`,
    );
  }
  return body;
}

export function getSpecialtyPool(id: SpecialtyId) {
  return read<HubPoolPayload>(
    `/api/model-hub/specialty?id=${encodeURIComponent(id)}`,
  );
}

export function searchHub(q: string) {
  return read<HubPoolPayload>(
    `/api/model-hub/search?q=${encodeURIComponent(q)}`,
  );
}

export function getHubOverview() {
  return read<HubPoolPayload>("/api/model-hub/overview");
}

export function getHubModel(id: string) {
  return read<HubDetailPayload>(
    `/api/model-hub/model?id=${encodeURIComponent(id)}`,
  );
}
