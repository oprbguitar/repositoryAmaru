import { isAllowedAssetUrl } from "../../lib/github/assets";
import {
  buildSignals,
  derivePagesUrl,
  normalizeContributors,
  normalizeLanguages,
  normalizeOrg,
  normalizeReleases,
  normalizeRepo,
  parseRateLimit,
} from "../../lib/github/normalize";
import { isSafeSearchQuery } from "../../lib/github/query";
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
} from "../../lib/github/types";
import type { ApiResponse } from "../../types/api";
import type { ExtraRouter } from "../extra-routes";
import { type IntegrationsEnv, resolveSecret } from "../integrations";

const API = "https://api.github.com";
const NAME = /^[A-Za-z0-9_.-]{1,100}$/;
const REF = /^[A-Za-z0-9_./-]{1,200}$/;
const MAX_TREE_ENTRIES = 4000;
const MAX_FILE_BYTES = 200_000;
const MAX_ASSET_BYTES = 6_000_000;
const SORTS: SearchSort[] = ["stars", "updated", "forks", "best-match"];

class GithubError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly rate?: RateLimitInfo,
  ) {
    super(message);
  }
}

function envelope<T>(
  data: T | null,
  extra: Record<string, unknown> = {},
  errors?: Array<{ code: string; message: string }>,
): ApiResponse<T> {
  return {
    data,
    meta: {
      requestId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      ...extra,
    },
    ...(errors ? { errors } : {}),
  } as ApiResponse<T>;
}

function fail(error: GithubError): Response {
  return Response.json(
    envelope(null, { rateLimit: error.rate ?? null }, [
      { code: error.code, message: error.message },
    ]),
    { status: error.status },
  );
}

type Ctx = { token: string; tokenRejected: boolean; kv: KVNamespace };

async function ghFetch(
  ctx: Ctx,
  path: string,
  accept = "application/vnd.github+json",
): Promise<Response> {
  const build = (token: string) =>
    fetch(`${API}${path}`, {
      headers: {
        accept,
        "user-agent": "amaru-observatory",
        "x-github-api-version": "2022-11-28",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
  let response = await build(ctx.token);
  if (response.status === 401 && ctx.token) {
    ctx.tokenRejected = true;
    ctx.token = "";
    response = await build("");
  }
  const rate = parseRateLimit(response.headers);
  if (
    (response.status === 403 || response.status === 429) &&
    (rate.remaining === 0 || response.headers.has("retry-after"))
  )
    throw new GithubError(
      "rate_limited",
      "GitHub alcanzó el límite de peticiones. Espera a que se reinicie la ventana o configura GITHUB_TOKEN.",
      429,
      rate,
    );
  if (response.status === 404)
    throw new GithubError("not_found", "GitHub no encontró el recurso.", 404);
  if (response.status === 422)
    throw new GithubError("invalid_query", "GitHub rechazó la consulta.", 422);
  return response;
}

async function ghJson(ctx: Ctx, path: string): Promise<unknown> {
  const response = await ghFetch(ctx, path);
  if (!response.ok)
    throw new GithubError(
      "upstream_error",
      `GitHub respondió ${response.status}.`,
      502,
    );
  return response.json();
}

async function cached<T extends { stale?: boolean }>(
  ctx: Ctx,
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<T> {
  const hit = await ctx.kv
    .get<{ at: number; value: T }>(key, "json")
    .catch(() => null);
  if (hit && Date.now() - hit.at < ttlSeconds * 1000)
    return { ...hit.value, stale: false };
  try {
    const value = await load();
    await ctx.kv
      .put(key, JSON.stringify({ at: Date.now(), value }), {
        expirationTtl: 86_400,
      })
      .catch(() => undefined);
    return value;
  } catch (error) {
    if (hit && error instanceof GithubError && error.code === "rate_limited")
      return { ...hit.value, stale: true };
    throw error;
  }
}

async function searchRepos(
  ctx: Ctx,
  query: string,
  sort: SearchSort,
  page: number,
  perPage: number,
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    per_page: String(perPage),
    page: String(page),
  });
  if (sort !== "best-match") {
    params.set("sort", sort);
    params.set("order", "desc");
  }
  const raw = (await ghJson(ctx, `/search/repositories?${params}`)) as {
    total_count?: number;
    incomplete_results?: boolean;
    items?: unknown[];
  };
  return {
    query,
    sort,
    page,
    perPage,
    totalCount: raw.total_count ?? 0,
    incomplete: raw.incomplete_results === true,
    items: (raw.items ?? []).map(normalizeRepo),
    fetchedAt: new Date().toISOString(),
    stale: false,
  };
}

async function repoDetail(
  ctx: Ctx,
  owner: string,
  name: string,
): Promise<RepoDetail> {
  const base = `/repos/${owner}/${name}`;
  const rawRepo = (await ghJson(ctx, base)) as Record<string, unknown>;
  const repo = normalizeRepo(rawRepo);
  const [languages, releases, contributors, org] = await Promise.allSettled([
    ghJson(ctx, `${base}/languages`),
    ghJson(ctx, `${base}/releases?per_page=5`),
    ghJson(ctx, `${base}/contributors?per_page=8`),
    repo.ownerType === "Organization"
      ? ghJson(ctx, `/orgs/${owner}`)
      : Promise.resolve(null),
  ]);
  const missing: string[] = [];
  const pick = <T>(
    result: PromiseSettledResult<unknown>,
    label: string,
    map: (value: unknown) => T,
    fallback: T,
  ): T => {
    if (result.status === "fulfilled") return map(result.value);
    missing.push(label);
    return fallback;
  };
  const releaseList = pick(
    releases,
    "releases",
    (v) => normalizeReleases(v),
    [],
  );
  const orgInfo = pick(org, "organización", normalizeOrg, null);
  return {
    repo: {
      ...repo,
      subscribers:
        typeof rawRepo.subscribers_count === "number"
          ? rawRepo.subscribers_count
          : null,
      sizeKb: typeof rawRepo.size === "number" ? rawRepo.size : null,
      networkCount:
        typeof rawRepo.network_count === "number"
          ? rawRepo.network_count
          : null,
    },
    languages: pick(languages, "lenguajes", normalizeLanguages, []),
    releases: releaseList,
    contributors: pick(
      contributors,
      "contribuidores",
      (v) => normalizeContributors(v),
      [],
    ),
    org: orgInfo,
    signals: buildSignals({ repo, org: orgInfo, releases: releaseList }),
    preview: {
      homepage:
        repo.homepage && /^https:\/\//i.test(repo.homepage)
          ? repo.homepage
          : null,
      pagesUrl: derivePagesUrl(repo),
    },
    missing,
    fetchedAt: new Date().toISOString(),
    stale: false,
  };
}

function isBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, 4000);
  return sample.includes(0);
}

function isPublicHttpsHost(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || /\.(local|internal|localhost|test)$/.test(host))
    return false;
  if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("["))
    return false;
  return host.includes(".");
}

async function checkPreview(rawUrl: string): Promise<PreviewCheck> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      url: rawUrl,
      embeddable: false,
      status: null,
      reason: "URL inválida.",
    };
  }
  if (!isPublicHttpsHost(url))
    return {
      url: rawUrl,
      embeddable: false,
      status: null,
      reason: "Solo se permiten sitios públicos por HTTPS.",
    };
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": "amaru-observatory" },
      signal: AbortSignal.timeout(6000),
    });
    response.body?.cancel().catch(() => undefined);
    const xfo = (response.headers.get("x-frame-options") ?? "").toLowerCase();
    const csp = response.headers.get("content-security-policy") ?? "";
    const ancestors =
      /frame-ancestors\s+([^;]+)/i.exec(csp)?.[1]?.trim() ?? null;
    if (!response.ok)
      return {
        url: rawUrl,
        embeddable: false,
        status: response.status,
        reason: `El sitio respondió ${response.status}.`,
      };
    if (xfo.includes("deny") || xfo.includes("sameorigin"))
      return {
        url: rawUrl,
        embeddable: false,
        status: response.status,
        reason: `El sitio prohíbe incrustarse (X-Frame-Options: ${xfo}).`,
      };
    if (ancestors && !ancestors.includes("*") && !/^https?:$/.test(ancestors))
      return {
        url: rawUrl,
        embeddable: false,
        status: response.status,
        reason: `El sitio limita quién puede incrustarlo (frame-ancestors ${ancestors}).`,
      };
    return {
      url: response.url,
      embeddable: true,
      status: response.status,
      reason: null,
    };
  } catch {
    return {
      url: rawUrl,
      embeddable: false,
      status: null,
      reason: "No se pudo contactar al sitio.",
    };
  }
}

export const githubRouter: ExtraRouter = async (request, env, url) => {
  if (!url.pathname.startsWith("/api/github/")) return null;
  if (request.method !== "GET")
    return Response.json(
      envelope(null, {}, [
        { code: "method_not_allowed", message: "Solo GET." },
      ]),
      { status: 405 },
    );
  const path = url.pathname.slice("/api/github/".length);
  const ctx: Ctx = {
    token: await resolveSecret(
      env as unknown as IntegrationsEnv,
      "GITHUB_TOKEN",
    ).catch(() => ""),
    tokenRejected: false,
    kv: env.CACHE,
  };
  const tokenConfigured = ctx.token !== "";
  const owner = url.searchParams.get("owner") ?? "";
  const repo = url.searchParams.get("repo") ?? "";
  const needsRepo = ["repo", "readme", "tree", "file"].includes(path);
  if (needsRepo && (!NAME.test(owner) || !NAME.test(repo)))
    return fail(
      new GithubError(
        "invalid_params",
        "Propietario o repositorio inválido.",
        400,
      ),
    );
  const ref = url.searchParams.get("ref") ?? "";
  if (ref && !REF.test(ref))
    return fail(new GithubError("invalid_params", "Referencia inválida.", 400));
  const meta = () => ({ tokenConfigured, tokenRejected: ctx.tokenRejected });
  const ok = <T>(data: T, extra: Record<string, unknown> = {}) =>
    Response.json(envelope(data, { ...meta(), ...extra }));

  try {
    switch (path) {
      case "status": {
        let core: RateLimitInfo | null = null;
        let search: RateLimitInfo | null = null;
        let reachable = false;
        try {
          const response = await ghFetch(ctx, "/rate_limit");
          reachable = response.ok;
          const body = (await response.json()) as {
            resources?: Record<
              string,
              { limit: number; remaining: number; reset: number }
            >;
          };
          const map = (key: string): RateLimitInfo | null => {
            const item = body.resources?.[key];
            return item
              ? {
                  limit: item.limit,
                  remaining: item.remaining,
                  resetAt: new Date(item.reset * 1000).toISOString(),
                  resource: key,
                }
              : null;
          };
          core = map("core");
          search = map("search");
        } catch {
          reachable = false;
        }
        const status: GithubStatus = {
          tokenConfigured,
          core,
          search,
          checkedAt: new Date().toISOString(),
          reachable,
        };
        return ok(status);
      }
      case "mine": {
        // Personal repos: with a token, every repo the token owns (public and
        // private, administrator only); otherwise the public repos of `user`.
        const user = (url.searchParams.get("user") ?? "").trim();
        if (!/^[A-Za-z0-9-]{1,39}$/.test(user))
          return fail(
            new GithubError("invalid_query", "Usuario no válido.", 400),
          );
        const key = `github:mine:${user}:${ctx.token && env.VIEWER_IS_ADMIN !== "false" ? "auth" : "anon"}`;
        const result = await cached(
          ctx,
          key,
          300,
          async (): Promise<
            SearchResult & { stale?: boolean; includesPrivate: boolean }
          > => {
            let raw: unknown = null;
            // Private repos are only listed to the administrator.
            if (ctx.token && env.VIEWER_IS_ADMIN !== "false") {
              const me = (await ghJson(ctx, "/user")) as { login?: string };
              if (me?.login?.toLowerCase() === user.toLowerCase())
                raw = await ghJson(
                  ctx,
                  "/user/repos?affiliation=owner&per_page=100&sort=pushed",
                );
            }
            if (!Array.isArray(raw))
              raw = await ghJson(
                ctx,
                `/users/${user}/repos?per_page=100&sort=pushed`,
              );
            const items = (Array.isArray(raw) ? raw : []).map(normalizeRepo);
            return {
              query: `user:${user}`,
              sort: "updated" as SearchSort,
              page: 1,
              perPage: 100,
              totalCount: items.length,
              incomplete: false,
              items,
              fetchedAt: new Date().toISOString(),
              includesPrivate: items.some((item) => item.isPrivate),
              stale: false,
            };
          },
        );
        return ok(result);
      }
      case "search": {
        const query = (url.searchParams.get("q") ?? "").trim();
        if (!isSafeSearchQuery(query))
          return fail(
            new GithubError("invalid_query", "La consulta no es válida.", 400),
          );
        const sortParam = url.searchParams.get("sort") as SearchSort;
        const sort = SORTS.includes(sortParam) ? sortParam : "stars";
        const page = Math.min(
          10,
          Math.max(1, Number(url.searchParams.get("page")) || 1),
        );
        const perPage = Math.min(
          50,
          Math.max(5, Number(url.searchParams.get("per_page")) || 25),
        );
        const key = `github:search:${query}|${sort}|${page}|${perPage}`;
        const result = await cached(ctx, key, 600, () =>
          searchRepos(ctx, query, sort, page, perPage),
        );
        return ok(result);
      }
      case "repo":
        return ok(
          await cached(ctx, `github:repo:${owner}/${repo}`, 900, () =>
            repoDetail(ctx, owner, repo),
          ),
        );
      case "readme": {
        const key = `github:readme:${owner}/${repo}:${ref}`;
        const result = await cached(
          ctx,
          key,
          1800,
          async (): Promise<ReadmeResult & { stale?: boolean }> => {
            const response = await ghFetch(
              ctx,
              `/repos/${owner}/${repo}/readme${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`,
              "application/vnd.github.html+json",
            ).catch((error) => {
              if (error instanceof GithubError && error.code === "not_found")
                return null;
              throw error;
            });
            const html = response?.ok ? await response.text() : null;
            return {
              path: html ? "README" : null,
              html:
                html && html.length > 1_500_000
                  ? html.slice(0, 1_500_000)
                  : html,
              ref,
              fetchedAt: new Date().toISOString(),
            };
          },
        );
        return ok(result);
      }
      case "tree": {
        if (!ref)
          return fail(new GithubError("invalid_params", "Falta la rama.", 400));
        const key = `github:tree:${owner}/${repo}:${ref}`;
        const result = await cached(
          ctx,
          key,
          900,
          async (): Promise<TreeResult & { stale?: boolean }> => {
            const raw = (await ghJson(
              ctx,
              `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
            )) as {
              tree?: Array<{ path: string; type: string; size?: number }>;
              truncated?: boolean;
            };
            const all = (raw.tree ?? []).filter(
              (e) => e.type === "blob" || e.type === "tree",
            );
            return {
              ref,
              total: all.length,
              truncated:
                raw.truncated === true || all.length > MAX_TREE_ENTRIES,
              entries: all.slice(0, MAX_TREE_ENTRIES).map((e) => ({
                path: e.path,
                type: e.type as "blob" | "tree",
                size: typeof e.size === "number" ? e.size : null,
              })),
              fetchedAt: new Date().toISOString(),
            };
          },
        );
        return ok(result);
      }
      case "file": {
        const filePath = url.searchParams.get("path") ?? "";
        if (!filePath || filePath.length > 500 || filePath.includes(".."))
          return fail(new GithubError("invalid_params", "Ruta inválida.", 400));
        const render = /\.(md|markdown)$/i.test(filePath);
        const encoded = filePath.split("/").map(encodeURIComponent).join("/");
        const response = await ghFetch(
          ctx,
          `/repos/${owner}/${repo}/contents/${encoded}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`,
          render
            ? "application/vnd.github.html+json"
            : "application/vnd.github.raw+json",
        );
        if (!response.ok)
          return fail(
            new GithubError(
              "upstream_error",
              `GitHub respondió ${response.status}.`,
              502,
            ),
          );
        const declared = Number(response.headers.get("content-length")) || 0;
        const result: FileResult = {
          path: filePath,
          ref,
          size: declared,
          kind: "text",
          text: null,
          html: null,
          truncated: false,
          fetchedAt: new Date().toISOString(),
        };
        if (!render && declared > MAX_FILE_BYTES * 5) {
          result.kind = "too-large";
          response.body?.cancel().catch(() => undefined);
          return ok(result);
        }
        const bytes = new Uint8Array(await response.arrayBuffer());
        result.size = bytes.length;
        if (!render && isBinary(bytes)) {
          result.kind = "binary";
          return ok(result);
        }
        const slice = bytes.subarray(0, MAX_FILE_BYTES);
        result.truncated = bytes.length > MAX_FILE_BYTES;
        const text = new TextDecoder().decode(slice);
        if (render) result.html = text;
        else result.text = text;
        return ok(result);
      }
      case "asset": {
        const target = url.searchParams.get("u") ?? "";
        if (!isAllowedAssetUrl(target))
          return fail(
            new GithubError(
              "forbidden_host",
              "Origen de imagen no permitido.",
              403,
            ),
          );
        const upstream = await fetch(target, {
          headers: { "user-agent": "amaru-observatory", accept: "image/*" },
          redirect: "follow",
        });
        const type = upstream.headers.get("content-type") ?? "";
        if (
          !isAllowedAssetUrl(upstream.url) ||
          !upstream.ok ||
          !/^image\//i.test(type)
        )
          return fail(
            new GithubError("not_image", "El recurso no es una imagen.", 415),
          );
        const length = Number(upstream.headers.get("content-length")) || 0;
        if (length > MAX_ASSET_BYTES)
          return fail(
            new GithubError("too_large", "Imagen demasiado grande.", 413),
          );
        return new Response(upstream.body, {
          headers: {
            "content-type": type,
            "cache-control": "public, max-age=86400",
            "x-content-type-options": "nosniff",
          },
        });
      }
      case "preview-check": {
        const target = url.searchParams.get("url") ?? "";
        return ok(await checkPreview(target));
      }
      default:
        return fail(
          new GithubError("not_found", "La ruta solicitada no existe.", 404),
        );
    }
  } catch (error) {
    if (error instanceof GithubError) return fail(error);
    return fail(
      new GithubError(
        "upstream_error",
        "No se pudo contactar con GitHub.",
        502,
      ),
    );
  }
};
