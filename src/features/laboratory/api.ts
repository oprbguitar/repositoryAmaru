import type {
  Alternative,
  ProjectInputs,
} from "../../../lib/laboratory/engine";
import type { ApiResponse } from "../../../types/api";

export type LaboratoryProjectSummary = {
  id: string;
  name: string;
  status: string;
  inputs: ProjectInputs | null;
  alternativeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type LaboratoryProjectDetail = {
  id: string;
  name: string;
  status: string;
  inputs: ProjectInputs | null;
  createdAt: string;
  updatedAt: string;
  alternatives: Array<{
    kind: string;
    engineVersion: string;
    calculatedAt: string;
    recommendation: Alternative | null;
  }>;
};

const HEADERS = {
  "content-type": "application/json",
  "x-amaru-csrf": "local-ui",
};

async function read<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo consultar ${url}.`);
  return response.json();
}

export function listProjects() {
  return read<LaboratoryProjectSummary[]>("/api/laboratory/projects");
}

export function getProject(id: string) {
  return read<LaboratoryProjectDetail>(`/api/laboratory/projects/${id}`);
}

export async function saveProject(payload: {
  id?: string;
  name: string;
  inputs: ProjectInputs;
  status?: string;
}): Promise<ApiResponse<LaboratoryProjectDetail>> {
  const response = await fetch("/api/laboratory/projects", {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("No se pudo guardar el proyecto.");
  return response.json();
}

export async function recommendProject(id: string): Promise<
  ApiResponse<{
    projectId: string;
    engineVersion: string;
    calculatedAt: string;
    alternatives: Alternative[];
  }>
> {
  const response = await fetch(`/api/laboratory/projects/${id}/recommend`, {
    method: "POST",
    headers: HEADERS,
  });
  if (!response.ok) throw new Error("No se pudo recalcular la recomendación.");
  return response.json();
}

export async function archiveProject(id: string): Promise<void> {
  const response = await fetch(`/api/laboratory/projects/${id}`, {
    method: "DELETE",
    headers: HEADERS,
  });
  if (!response.ok) throw new Error("No se pudo archivar el proyecto.");
}
