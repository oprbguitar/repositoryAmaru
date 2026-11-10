import type {
  FileResult,
  GithubStatus,
  PreviewCheck,
  RateLimitInfo,
  ReadmeResult,
  RepoDetail,
  SearchResult,
  SearchSort,
  TreeResult,
} from "../../../lib/github/types";
import type { ApiResponse } from "../../../types/api";

export class GithubApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly rateLimit: RateLimitInfo | null,
  ) {
    super(message);
  }
}

export type GithubMeta = {
  tokenConfigured?: boolean;
  tokenRejected?: boolean;
};

async function get<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<{ data: T; meta: GithubMeta }> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "") query.set(key, String(value));
  const response = await fetch(`/api/github/${path}?${query}`);
  const payload = (await response.json().catch(() => null)) as
    | (ApiResponse<T> & {
        meta: GithubMeta & { rateLimit?: RateLimitInfo | null };
      })
    | null;
  if (!response.ok || !payload || payload.data === null)
    throw new GithubApiError(
      payload?.errors?.[0]?.message ??
        "El explorador de GitHub no está disponible.",
      payload?.errors?.[0]?.code ?? "unavailable",
      payload?.meta?.rateLimit ?? null,
    );
  return { data: payload.data, meta: payload.meta };
}

export const githubApi = {
  status: () => get<GithubStatus>("status", {}),
  mine: (user: string) => get<SearchResult>("mine", { user }),
  search: (q: string, sort: SearchSort, page: number) =>
    get<SearchResult>("search", { q, sort, page, per_page: 25 }),
  repo: (owner: string, repo: string) =>
    get<RepoDetail>("repo", { owner, repo }),
  readme: (owner: string, repo: string, ref: string) =>
    get<ReadmeResult>("readme", { owner, repo, ref }),
  tree: (owner: string, repo: string, ref: string) =>
    get<TreeResult>("tree", { owner, repo, ref }),
  file: (owner: string, repo: string, ref: string, path: string) =>
    get<FileResult>("file", { owner, repo, ref, path }),
  previewCheck: (url: string) => get<PreviewCheck>("preview-check", { url }),
};

/** localStorage helpers that never throw (private mode, blocked storage). */
export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is a convenience only.
  }
}
