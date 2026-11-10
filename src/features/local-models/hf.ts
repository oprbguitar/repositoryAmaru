/**
 * Hugging Face Hub client used straight from the browser (the Hub answers
 * with CORS headers). Parsers are pure and tested; fetchers are thin.
 */
import { type ModelMetadata, metadataFromTags } from "./alignment";
import { parseTree, type RepoFile } from "./selection";

export const HF = "https://huggingface.co";

export type HubModelSummary = {
  id: string;
  downloads: number | null;
  likes: number | null;
  pipeline: string | null;
  updatedAt: string | null;
  tags: string[];
};

export type HubModelInfo = HubModelSummary & {
  sha: string;
  meta: ModelMetadata;
};

export type HubCommit = { id: string; title: string; date: string | null };

/** Repo ids accepted from the URL and the search box. */
export function isRepoId(value: string): boolean {
  return /^[A-Za-z0-9][\w.-]{0,95}\/[\w.-]{1,96}$/.test(value);
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export function parseSummary(value: unknown): HubModelSummary | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = str(raw.id) ?? str(raw.modelId);
  if (!id) return null;
  return {
    id,
    downloads: num(raw.downloads),
    likes: num(raw.likes),
    pipeline: str(raw.pipeline_tag),
    updatedAt: str(raw.lastModified) ?? str(raw.createdAt),
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
}

export function parseModelInfo(value: unknown): HubModelInfo | null {
  const summary = parseSummary(value);
  const raw = value as Record<string, unknown>;
  const sha = str(raw?.sha);
  if (!summary || !sha) return null;
  const card =
    raw.cardData && typeof raw.cardData === "object"
      ? (raw.cardData as Record<string, unknown>)
      : {};
  const base = Array.isArray(card.base_model)
    ? str(card.base_model[0])
    : str(card.base_model);
  return {
    ...summary,
    sha,
    meta: metadataFromTags(summary.id, summary.tags, {
      license: str(card.license),
      baseModel: base,
      gated: raw.gated !== false && raw.gated !== undefined,
    }),
  };
}

export function parseCommits(value: unknown): HubCommit[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const raw = entry as Record<string, unknown>;
    const id = str(raw?.id);
    return id ? [{ id, title: str(raw.title) ?? "", date: str(raw.date) }] : [];
  });
}

export type RevisionStatus = "current" | "update-available" | "unknown";

/** Installed revision vs. the sha Hugging Face publishes for `main`. */
export function compareRevision(
  installed: string,
  published: string | null,
): RevisionStatus {
  if (!published || !installed) return "unknown";
  return installed.toLowerCase() === published.toLowerCase()
    ? "current"
    : "update-available";
}

export function resolveUrl(repo: string, revision: string, path: string) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${HF}/${repo}/resolve/${revision}/${encoded}`;
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (response.status === 401 || response.status === 403)
    throw new Error(
      "Modelo restringido: acepta sus condiciones en Hugging Face antes de descargarlo.",
    );
  if (response.status === 404)
    throw new Error("El repositorio no existe en Hugging Face.");
  if (!response.ok)
    throw new Error(`Hugging Face respondió ${response.status}.`);
  return response.json();
}

export async function searchModels(
  query: string,
  filter: "gguf" | "safetensors" | "modified",
  signal?: AbortSignal,
): Promise<HubModelSummary[]> {
  const params = new URLSearchParams({
    sort: "downloads",
    direction: "-1",
    limit: "40",
  });
  if (filter === "modified") {
    params.set("search", query.trim() || "abliterated");
  } else {
    params.set("filter", filter);
    if (query.trim()) params.set("search", query.trim());
  }
  const data = await getJson(`${HF}/api/models?${params}`, signal);
  return Array.isArray(data)
    ? data.flatMap((entry) => parseSummary(entry) ?? [])
    : [];
}

export async function getModelInfo(
  repo: string,
  signal?: AbortSignal,
): Promise<HubModelInfo> {
  const info = parseModelInfo(
    await getJson(`${HF}/api/models/${repo}`, signal),
  );
  if (!info) throw new Error("Respuesta de Hugging Face no reconocida.");
  return info;
}

export async function getTree(
  repo: string,
  revision: string,
  signal?: AbortSignal,
): Promise<RepoFile[]> {
  return parseTree(
    await getJson(
      `${HF}/api/models/${repo}/tree/${revision}?recursive=true&expand=false`,
      signal,
    ),
  );
}

export async function getCommits(
  repo: string,
  signal?: AbortSignal,
): Promise<HubCommit[]> {
  return parseCommits(
    await getJson(`${HF}/api/models/${repo}/commits/main`, signal),
  );
}
