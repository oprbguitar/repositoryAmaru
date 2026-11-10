import type { ExtraRouter } from "../extra-routes";

/** Same prefix as `analysisCacheKey` in worker/index.ts (cache version v1). */
const PREFIX = "analysis:v1:";

/**
 * GET /api/local-library-analyses — ids of documents that already have a saved
 * NVIDIA analysis, so the library can filter by analysis state without one
 * request per document.
 */
export const libraryAnalysesRouter: ExtraRouter = async (request, env, url) => {
  if (
    request.method !== "GET" ||
    url.pathname !== "/api/local-library-analyses"
  )
    return null;
  const ids = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await env.CACHE.list({ prefix: PREFIX, cursor });
    for (const key of page.keys) {
      const id = key.name.slice(PREFIX.length).split(":")[0];
      if (id) ids.add(id);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return Response.json({
    data: [...ids],
    meta: {
      requestId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
    },
  });
};
