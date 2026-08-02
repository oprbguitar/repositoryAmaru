import {
  FACEBOOK_GRAPH_VERSION,
  FACEBOOK_VIDEO_FIELDS,
  type NormalizedFacebookVideo,
  normalizeFacebookVideos,
  pageSchema,
} from "../lib/external/facebook-videos";
import {
  CATALOG_RANKING_TYPES,
  CATEGORY_RANKING_TYPES,
  categoryRanking,
  computeCatalogRankings,
  parseCatalogModels,
  parseModelOfferings,
  type RankingEntry,
  UNAVAILABLE_RANKING_TYPES,
} from "../lib/external/rankings";
import {
  enrichVideoDetails,
  type NormalizedVideo,
  normalizeYouTubePlaylist,
  normalizeYouTubeSearch,
  OFFICIAL_CHANNEL_HANDLES,
  VIDEO_QUERY_GROUPS,
} from "../lib/external/videos";
import {
  aggregateCountries,
  buildGlobalGeoJson,
  type InstitutionPoint,
} from "../lib/geo/aggregate";
import { COUNTRIES, countryName, LATAM_CODES } from "../lib/geo/countries";
import {
  ENGINE_VERSION,
  type EngineContext,
  type ProjectInputs,
  recommend,
} from "../lib/laboratory/engine";
import {
  type CapabilityInput,
  deriveCapabilityTags,
  describePrimaryUse,
} from "../lib/models/capabilities";
import {
  authorPrefixesFor,
  hostNamesFor,
  isAggregator,
} from "../lib/models/provider-identity";

export type ModulesEnv = {
  DB: D1Database;
  CACHE: KVNamespace;
  YOUTUBE_API_KEY?: string;
  GITHUB_TOKEN?: string;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
};

export type ModuleSyncResult = {
  discovered: number;
  stored: number;
  changed: number;
  httpStatus: number;
  rateLimitRemaining: number | null;
};

const USER_AGENT =
  "AMARU-AI-Observatory/0.1 (local-first research application)";

async function fetchJson(
  url: string,
): Promise<{ payload: unknown; status: number }> {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(
      `La fuente respondió HTTP ${response.status} (${new URL(url).pathname}).`,
    );
  return { payload: await response.json(), status: response.status };
}

async function batchStatements(
  env: ModulesEnv,
  statements: D1PreparedStatement[],
): Promise<void> {
  for (let index = 0; index < statements.length; index += 60)
    await env.DB.batch(statements.slice(index, index + 60));
}

// ---------------------------------------------------------------------------
// OpenRouter: rankings y ofertas por proveedor
// ---------------------------------------------------------------------------

export async function syncOpenRouterRankings(
  env: ModulesEnv,
  now: string,
): Promise<ModuleSyncResult> {
  const rankingDate = now.slice(0, 10);
  const catalog = await fetchJson("https://openrouter.ai/api/v1/models");
  const models = parseCatalogModels(catalog.payload);
  const allEntries: RankingEntry[] = computeCatalogRankings(models);

  for (const type of CATEGORY_RANKING_TYPES) {
    const category = type.replace("category-", "");
    try {
      const response = await fetchJson(
        `https://openrouter.ai/api/v1/models?category=${encodeURIComponent(category)}`,
      );
      allEntries.push(...categoryRanking(response.payload, type));
    } catch {
      // Sin datos para la categoría: no se inventa ranking.
    }
  }

  const statements: D1PreparedStatement[] = [];
  for (const entry of allEntries) {
    statements.push(
      env.DB.prepare(`
        INSERT INTO model_rankings (id, model_external_id, model_title, ranking_type, ranking_position,
          score, score_unit, source_id, source_name, ranking_date, period_start, period_end,
          methodology, methodology_url, confidence, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'openrouter', 'OpenRouter', ?, NULL, NULL, ?, ?, 'high', CURRENT_TIMESTAMP)
        ON CONFLICT(ranking_type, model_external_id, ranking_date) DO UPDATE SET
          ranking_position = excluded.ranking_position, score = excluded.score,
          model_title = excluded.model_title, updated_at = CURRENT_TIMESTAMP
      `).bind(
        crypto.randomUUID(),
        entry.modelExternalId,
        entry.modelTitle,
        entry.rankingType,
        entry.rankingPosition,
        entry.score,
        entry.scoreUnit,
        rankingDate,
        entry.methodology,
        entry.methodologyUrl,
      ),
    );
  }
  await batchStatements(env, statements);

  // Ofertas por proveedor para los modelos mejor posicionados (limitado por cuota)
  const offeringTargets = [
    ...new Set(
      allEntries
        .filter(
          (entry) =>
            (entry.rankingType === "category-programming" &&
              entry.rankingPosition <= 10) ||
            (entry.rankingType === "newest" && entry.rankingPosition <= 8),
        )
        .map((entry) => entry.modelExternalId),
    ),
  ].slice(0, 16);

  let offeringsStored = 0;
  const offeringStatements: D1PreparedStatement[] = [];
  for (const modelId of offeringTargets) {
    try {
      const response = await fetchJson(
        `https://openrouter.ai/api/v1/models/${modelId}/endpoints`,
      );
      for (const offering of parseModelOfferings(response.payload)) {
        offeringsStored += 1;
        offeringStatements.push(
          env.DB.prepare(`
            INSERT INTO model_offerings (id, model_external_id, model_title, provider_name,
              provider_model_identifier, input_price_per_million, output_price_per_million,
              cached_input_price_per_million, request_price, image_price, original_pricing_json,
              context_length, max_completion_tokens, quantization, status, supported_parameters_json,
              pricing_source_id, pricing_source_name, verified_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'openrouter', 'OpenRouter', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(model_external_id, provider_name) DO UPDATE SET
              input_price_per_million = excluded.input_price_per_million,
              output_price_per_million = excluded.output_price_per_million,
              cached_input_price_per_million = excluded.cached_input_price_per_million,
              request_price = excluded.request_price, image_price = excluded.image_price,
              original_pricing_json = excluded.original_pricing_json,
              context_length = excluded.context_length,
              max_completion_tokens = excluded.max_completion_tokens,
              quantization = excluded.quantization, status = excluded.status,
              supported_parameters_json = excluded.supported_parameters_json,
              verified_at = excluded.verified_at, updated_at = CURRENT_TIMESTAMP
          `).bind(
            crypto.randomUUID(),
            offering.modelExternalId,
            offering.modelTitle,
            offering.providerName,
            offering.providerModelIdentifier,
            offering.inputPricePerMillion,
            offering.outputPricePerMillion,
            offering.cachedInputPricePerMillion,
            offering.requestPrice,
            offering.imagePrice,
            JSON.stringify(offering.originalPricing),
            offering.contextLength,
            offering.maxCompletionTokens,
            offering.quantization,
            offering.status,
            JSON.stringify(offering.supportedParameters),
            now,
          ),
        );
      }
    } catch {
      // El modelo puede no exponer endpoints; se omite sin inventar precios.
    }
  }
  await batchStatements(env, offeringStatements);
  await env.CACHE.delete("models:rankings-meta");
  return {
    discovered: allEntries.length + offeringsStored,
    stored: allEntries.length + offeringsStored,
    changed: 0,
    httpStatus: catalog.status,
    rateLimitRemaining: null,
  };
}

// ---------------------------------------------------------------------------
// OpenAlex Institutions (coordenadas provistas por la fuente)
// ---------------------------------------------------------------------------

export async function syncOpenAlexInstitutions(
  env: ModulesEnv,
  now: string,
): Promise<ModuleSyncResult> {
  const latamFilter = LATAM_CODES.map((code) => code.toLowerCase()).join("|");
  const urls = [
    // Instituciones LATAM con más producción registrada
    `https://api.openalex.org/institutions?filter=country_code:${latamFilter}&sort=works_count:desc&per-page=100`,
  ];
  // Instituciones globales con más obras del concepto "Artificial intelligence"
  // (C154945302): agrupación de works por institución (x_concepts sobre
  // /institutions está deprecado y devuelve 0), luego lookup por lotes de IDs.
  try {
    const grouped = await fetchJson(
      "https://api.openalex.org/works?filter=concepts.id:C154945302&group_by=authorships.institutions.lineage&per-page=200",
    );
    const groups = Array.isArray(
      (grouped.payload as Record<string, unknown>).group_by,
    )
      ? ((grouped.payload as Record<string, unknown>).group_by as Array<
          Record<string, unknown>
        >)
      : [];
    const institutionIds = groups
      .map((group) => (typeof group.key === "string" ? group.key : null))
      .filter((key): key is string => Boolean(key?.includes("openalex.org/I")))
      .slice(0, 150);
    for (let index = 0; index < institutionIds.length; index += 50) {
      const batch = institutionIds
        .slice(index, index + 50)
        .map((id) => id.split("/").pop())
        .join("|");
      urls.push(
        `https://api.openalex.org/institutions?filter=ids.openalex:${batch}&per-page=50`,
      );
    }
  } catch {
    // Sin agrupación disponible: se conserva la cobertura LATAM.
  }
  let discovered = 0;
  let stored = 0;
  let lastStatus = 200;
  const statements: D1PreparedStatement[] = [];
  for (const url of urls) {
    const { payload, status } = await fetchJson(url);
    lastStatus = status;
    const results = Array.isArray((payload as Record<string, unknown>).results)
      ? ((payload as Record<string, unknown>).results as Array<
          Record<string, unknown>
        >)
      : [];
    discovered += results.length;
    for (const institution of results) {
      const geo = (institution.geo ?? {}) as Record<string, unknown>;
      const latitude = Number(geo.latitude);
      const longitude = Number(geo.longitude);
      const id = typeof institution.id === "string" ? institution.id : null;
      const name =
        typeof institution.display_name === "string"
          ? institution.display_name
          : null;
      if (!id || !name) continue;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      stored += 1;
      statements.push(
        env.DB.prepare(`
          INSERT INTO map_locations (id, entity_kind, entity_name, country_code, country_name, city,
            latitude, longitude, works_count, homepage_url, external_id, source_id, source_name,
            data_json, verified_at, updated_at)
          VALUES (?, 'institution', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'openalex-institutions', 'OpenAlex', ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(source_id, external_id) DO UPDATE SET
            entity_name = excluded.entity_name, country_code = excluded.country_code,
            country_name = excluded.country_name, city = excluded.city,
            latitude = excluded.latitude, longitude = excluded.longitude,
            works_count = excluded.works_count, homepage_url = excluded.homepage_url,
            data_json = excluded.data_json, verified_at = excluded.verified_at,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          crypto.randomUUID(),
          name,
          typeof institution.country_code === "string"
            ? institution.country_code.toUpperCase()
            : null,
          typeof institution.country_code === "string"
            ? countryName(institution.country_code.toUpperCase())
            : null,
          typeof geo.city === "string" ? geo.city : null,
          latitude,
          longitude,
          Number(institution.works_count) || null,
          typeof institution.homepage_url === "string"
            ? institution.homepage_url
            : null,
          id,
          JSON.stringify({
            type: institution.type ?? null,
            citedByCount: institution.cited_by_count ?? null,
          }),
          now,
        ),
      );
    }
  }
  await batchStatements(env, statements);
  await env.CACHE.delete("map:global");
  return {
    discovered,
    stored,
    changed: 0,
    httpStatus: lastStatus,
    rateLimitRemaining: null,
  };
}

// ---------------------------------------------------------------------------
// YouTube Data API v3 (cuota-eficiente)
// ---------------------------------------------------------------------------

async function resolveChannelIds(env: ModulesEnv, key: string): Promise<void> {
  const pending = await env.DB.prepare(
    "SELECT id FROM video_sources WHERE platform = 'youtube' AND channel_id IS NULL",
  ).all<{ id: string }>();
  for (const row of pending.results) {
    const handle = OFFICIAL_CHANNEL_HANDLES[row.id];
    if (!handle) continue;
    try {
      const { payload } = await fetchJson(
        `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${key}`,
      );
      const items = (payload as Record<string, unknown>).items;
      const first = Array.isArray(items)
        ? (items[0] as Record<string, unknown>)
        : null;
      if (first && typeof first.id === "string") {
        await env.DB.prepare(
          "UPDATE video_sources SET channel_id = ?, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
          .bind(first.id, row.id)
          .run();
      }
    } catch {
      // El canal se resuelve en un intento posterior; no se guardan IDs no verificados.
    }
  }
}

async function persistVideos(
  env: ModulesEnv,
  videos: NormalizedVideo[],
  officialChannelIds: Set<string>,
  now: string,
): Promise<number> {
  const statements: D1PreparedStatement[] = [];
  const existing = await env.DB.prepare(
    "SELECT external_id FROM video_items WHERE platform = 'youtube'",
  ).all<{ external_id: string }>();
  const known = new Set(existing.results.map((row) => row.external_id));
  for (const video of videos) {
    const isNew = !known.has(video.externalId);
    statements.push(
      env.DB.prepare(`
        INSERT INTO video_items (id, platform, external_id, title, description, channel_id, channel_title,
          is_official_channel, published_at, thumbnail_url, watch_url, language, topic, query_group,
          duration_seconds, view_count, source_id, source_name, retrieved_at, updated_at)
        VALUES (?, 'youtube', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'youtube', 'YouTube Data API', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(platform, external_id) DO UPDATE SET
          title = excluded.title, description = excluded.description,
          view_count = excluded.view_count, duration_seconds = excluded.duration_seconds,
          language = COALESCE(excluded.language, video_items.language),
          retrieved_at = excluded.retrieved_at, updated_at = CURRENT_TIMESTAMP
      `).bind(
        crypto.randomUUID(),
        video.externalId,
        video.title,
        video.description?.slice(0, 600) ?? null,
        video.channelId,
        video.channelTitle,
        video.channelId && officialChannelIds.has(video.channelId) ? 1 : 0,
        video.publishedAt,
        video.thumbnailUrl,
        video.watchUrl,
        video.language,
        video.topic,
        video.queryGroup,
        video.durationSeconds,
        video.viewCount,
        now,
      ),
    );
    if (isNew && video.channelId && officialChannelIds.has(video.channelId)) {
      statements.push(
        env.DB.prepare(`
          INSERT INTO live_events (id, event_type, record_id, title, event_at, source_name, target_path)
          VALUES (?, 'new_video', NULL, ?, ?, ?, '/videos')
        `).bind(crypto.randomUUID(), video.title, now, video.channelTitle),
      );
    }
  }
  await batchStatements(env, statements);
  return videos.length;
}

export async function syncYouTube(
  env: ModulesEnv,
  now: string,
): Promise<ModuleSyncResult> {
  const key = env.YOUTUBE_API_KEY;
  if (!key) throw new Error("Falta YOUTUBE_API_KEY");
  await resolveChannelIds(env, key);

  const channels = await env.DB.prepare(
    "SELECT id, channel_id, channel_title, category FROM video_sources WHERE platform = 'youtube' AND channel_id IS NOT NULL",
  ).all<{
    id: string;
    channel_id: string;
    channel_title: string;
    category: string;
  }>();
  const officialChannelIds = new Set(
    channels.results.map((row) => row.channel_id),
  );

  const collected: NormalizedVideo[] = [];
  // Subidas recientes de canales oficiales vía playlist de uploads (1 unidad c/u)
  for (const channel of channels.results) {
    const uploadsPlaylist = channel.channel_id.replace(/^UC/, "UU");
    try {
      const { payload } = await fetchJson(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylist}&maxResults=8&key=${key}`,
      );
      collected.push(
        ...normalizeYouTubePlaylist(
          payload,
          channel.category === "university" ? "Investigación" : "Canal oficial",
          `channel-${channel.id}`,
        ),
      );
    } catch {
      // Canal sin uploads accesibles; continuar.
    }
  }
  // Consultas temáticas configurables (search = 100 unidades c/u)
  for (const group of VIDEO_QUERY_GROUPS) {
    for (const query of group.queries) {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("q", query);
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", "8");
      url.searchParams.set("order", "relevance");
      url.searchParams.set("videoEmbeddable", "true");
      if (group.language)
        url.searchParams.set("relevanceLanguage", group.language);
      url.searchParams.set("key", key);
      try {
        const { payload } = await fetchJson(url.toString());
        collected.push(
          ...normalizeYouTubeSearch(
            payload,
            group.topic,
            group.group,
            group.language,
          ),
        );
      } catch {
        // Se preserva el resto de grupos ante fallos puntuales de cuota.
      }
    }
  }

  const unique = [
    ...new Map(collected.map((video) => [video.externalId, video])).values(),
  ];
  // Duración y vistas en lotes de 50 (1 unidad por lote)
  let enriched: NormalizedVideo[] = [];
  for (let index = 0; index < unique.length; index += 50) {
    const slice = unique.slice(index, index + 50);
    try {
      const { payload } = await fetchJson(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${slice
          .map((video) => video.externalId)
          .join(",")}&key=${key}`,
      );
      enriched = enriched.concat(enrichVideoDetails(slice, payload));
    } catch {
      enriched = enriched.concat(slice);
    }
  }
  const stored = await persistVideos(env, enriched, officialChannelIds, now);
  return {
    discovered: unique.length,
    stored,
    changed: 0,
    httpStatus: 200,
    rateLimitRemaining: null,
  };
}

// ---------------------------------------------------------------------------
// Videos de Meta (Facebook)
// ---------------------------------------------------------------------------

type FacebookPage = {
  id: string;
  name: string;
  token: string;
  /** Falso cuando la identidad es un perfil personal, no una página. */
  isPage: boolean;
};

/**
 * Un token puede ser de usuario (da acceso a varias páginas vía /me/accounts)
 * o directamente de página. Se resuelven ambos casos consultando la API: no se
 * asume la forma del token ni se codifican identificadores de página.
 */
async function resolveFacebookPages(token: string): Promise<FacebookPage[]> {
  let listedAccounts = false;
  try {
    const { payload } = await fetchJson(
      `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me/accounts?fields=id,name,access_token&limit=25&access_token=${encodeURIComponent(token)}`,
    );
    const parsed = pageSchema.safeParse(payload);
    listedAccounts = parsed.success;
    const pages = (parsed.success ? parsed.data.data : [])
      .filter((page) => page.access_token)
      .map((page) => ({
        id: page.id,
        name: page.name ?? page.id,
        token: page.access_token as string,
        isPage: true,
      }));
    if (pages.length) return pages;
  } catch {
    // Token de página: no expone /me/accounts. Se intenta como identidad única.
  }
  const { payload } = await fetchJson(
    `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me?fields=id,name&access_token=${encodeURIComponent(token)}`,
  );
  const identity = payload as { id?: string; name?: string };
  if (!identity?.id)
    throw new Error("El token de Meta no identifica ninguna cuenta.");
  return [
    {
      id: identity.id,
      name: identity.name ?? identity.id,
      token,
      // Si /me/accounts respondió con una lista vacía, la identidad es un
      // perfil personal: Graph no expone sus videos a la API.
      isPage: !listedAccounts,
    },
  ];
}

async function persistFacebookVideos(
  env: ModulesEnv,
  videos: NormalizedFacebookVideo[],
  now: string,
): Promise<number> {
  const existing = await env.DB.prepare(
    "SELECT external_id FROM video_items WHERE platform = 'facebook'",
  ).all<{ external_id: string }>();
  const known = new Set(existing.results.map((row) => row.external_id));
  const statements: D1PreparedStatement[] = [];
  for (const video of videos) {
    statements.push(
      env.DB.prepare(`
        INSERT INTO video_items (id, platform, external_id, title, description, channel_id, channel_title,
          is_official_channel, published_at, thumbnail_url, watch_url, language, topic, query_group,
          duration_seconds, view_count, source_id, source_name, retrieved_at, updated_at)
        VALUES (?, 'facebook', ?, ?, ?, ?, ?, 1, ?, ?, ?, NULL, 'Página oficial', ?, ?, ?, 'facebook-videos', 'Meta Graph API', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(platform, external_id) DO UPDATE SET
          title = excluded.title, description = excluded.description,
          channel_title = excluded.channel_title, thumbnail_url = excluded.thumbnail_url,
          view_count = excluded.view_count, duration_seconds = excluded.duration_seconds,
          retrieved_at = excluded.retrieved_at, updated_at = CURRENT_TIMESTAMP
      `).bind(
        crypto.randomUUID(),
        video.externalId,
        video.title,
        video.description,
        video.pageId,
        video.pageName,
        video.publishedAt,
        video.thumbnailUrl,
        video.watchUrl,
        `page-${video.pageId}`,
        video.durationSeconds,
        video.viewCount,
        now,
      ),
    );
    if (!known.has(video.externalId)) {
      statements.push(
        env.DB.prepare(`
          INSERT INTO live_events (id, event_type, record_id, title, event_at, source_name, target_path)
          VALUES (?, 'new_video', NULL, ?, ?, ?, '/videos')
        `).bind(crypto.randomUUID(), video.title, now, video.pageName),
      );
    }
  }
  await batchStatements(env, statements);
  return videos.length;
}

export async function syncFacebookVideos(
  env: ModulesEnv,
  now: string,
): Promise<ModuleSyncResult> {
  const token = env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("Falta FACEBOOK_PAGE_ACCESS_TOKEN");
  const pages = await resolveFacebookPages(token);
  const collected: NormalizedFacebookVideo[] = [];
  const failures: string[] = [];
  for (const page of pages) {
    try {
      const { payload } = await fetchJson(
        `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${page.id}/videos?fields=${FACEBOOK_VIDEO_FIELDS}&limit=25&access_token=${encodeURIComponent(page.token)}`,
      );
      collected.push(
        ...normalizeFacebookVideos(payload, { id: page.id, name: page.name }),
      );
    } catch (error) {
      failures.push(
        `${page.name}: ${error instanceof Error ? error.message : "fallo"}`,
      );
    }
  }
  if (!collected.length && failures.length)
    throw new Error(failures.join("; ").slice(0, 400));
  if (!collected.length && pages.every((page) => !page.isPage)) {
    // Distinguir «página sin videos» de «token que no es de página» evita que
    // la interfaz muestre una sección vacía sin explicar por qué.
    throw new Error(
      `El token pertenece al perfil personal «${pages[0]?.name ?? ""}» y no administra ninguna página. La Graph API solo expone videos de páginas: genera un token de página con los permisos pages_show_list y pages_read_engagement.`,
    );
  }
  const unique = [
    ...new Map(collected.map((video) => [video.externalId, video])).values(),
  ];
  const stored = await persistFacebookVideos(env, unique, now);
  return {
    discovered: unique.length,
    stored,
    changed: 0,
    httpStatus: 200,
    rateLimitRemaining: null,
  };
}

// ---------------------------------------------------------------------------
// Endpoints de mapa
// ---------------------------------------------------------------------------

async function collectCountryData(env: ModulesEnv) {
  const [papers, providers, institutions, news] = await Promise.all([
    env.DB.prepare(`
      SELECT je.value AS country FROM observatory_records r,
        json_each(COALESCE(json_extract(r.data_json, '$.countries'), '[]')) je
      WHERE r.record_kind = 'paper'
    `).all<{ country: string }>(),
    env.DB.prepare(`
      SELECT p.country AS country,
        (SELECT COUNT(*) FROM observatory_records r WHERE r.record_kind = 'model' AND r.provider_id = p.id) AS models
      FROM providers p
    `).all<{ country: string | null; models: number }>(),
    env.DB.prepare(
      "SELECT country_code AS country FROM map_locations WHERE entity_kind = 'institution'",
    ).all<{ country: string }>(),
    env.DB.prepare(
      "SELECT country_region AS country FROM observatory_records WHERE record_kind IN ('news','filing') AND country_region IS NOT NULL",
    ).all<{ country: string }>(),
  ]);
  return aggregateCountries({
    paperCountries: papers.results.map((row) => row.country),
    providerCountries: providers.results.map((row) => ({
      country: row.country,
      models: Number(row.models ?? 0),
    })),
    institutionCountries: institutions.results.map((row) => row.country),
    newsCountries: news.results.map((row) => row.country),
  });
}

async function institutionPoints(
  env: ModulesEnv,
  codes?: readonly string[],
): Promise<InstitutionPoint[]> {
  const where = codes?.length
    ? `AND country_code IN (${codes.map(() => "?").join(",")})`
    : "";
  const rows = await env.DB.prepare(
    `SELECT id, entity_name, country_code, city, latitude, longitude, works_count, homepage_url, source_name
     FROM map_locations WHERE entity_kind = 'institution' ${where}
     ORDER BY works_count DESC LIMIT 400`,
  )
    .bind(...(codes ?? []))
    .all<Record<string, unknown>>();
  return rows.results.map((row) => ({
    id: String(row.id),
    name: String(row.entity_name),
    countryCode: row.country_code ? String(row.country_code) : null,
    city: row.city ? String(row.city) : null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    worksCount: row.works_count === null ? null : Number(row.works_count),
    homepageUrl: row.homepage_url ? String(row.homepage_url) : null,
    sourceName: String(row.source_name),
  }));
}

export async function getGlobalMap(env: ModulesEnv) {
  const aggregates = await collectCountryData(env);
  const institutions = await institutionPoints(env);
  return {
    geojson: buildGlobalGeoJson(aggregates, institutions),
    countries: aggregates,
    coverage: {
      institutionCount: institutions.length,
      note: "Solo se muestran entidades con datos verificados en las fuentes indexadas. La ausencia de un país indica ausencia de registros, no ausencia de actividad.",
    },
  };
}

export async function getRegionalMap(
  env: ModulesEnv,
  codes: readonly string[],
) {
  const aggregates = (await collectCountryData(env)).filter((aggregate) =>
    codes.includes(aggregate.countryCode),
  );
  for (const code of codes) {
    if (!aggregates.some((aggregate) => aggregate.countryCode === code)) {
      aggregates.push({
        countryCode: code,
        countryName: countryName(code),
        papers: 0,
        providers: 0,
        models: 0,
        institutions: 0,
        repositories: 0,
        news: 0,
        total: 0,
      });
    }
  }
  const institutions = await institutionPoints(env, codes);
  const pendingSources = await env.DB.prepare(
    "SELECT name FROM source_registry WHERE status = 'registered'",
  ).all<{ name: string }>();
  return {
    geojson: buildGlobalGeoJson(
      aggregates.filter((aggregate) => aggregate.total > 0),
      institutions,
    ),
    countries: aggregates,
    coverage: {
      institutionCount: institutions.length,
      pendingSources: pendingSources.results.map((row) => row.name),
      note: "Cobertura basada en OpenAlex y fuentes sincronizadas. Las comparaciones entre países pueden reflejar diferencias de cobertura de fuentes, no solo de actividad real.",
    },
  };
}

export async function getCountryPanel(env: ModulesEnv, code: string) {
  const upper = code.toUpperCase();
  if (!COUNTRIES[upper]) return null;
  const aggregates = await collectCountryData(env);
  const aggregate = aggregates.find((entry) => entry.countryCode === upper) ?? {
    countryCode: upper,
    countryName: countryName(upper),
    papers: 0,
    providers: 0,
    models: 0,
    institutions: 0,
    repositories: 0,
    news: 0,
    total: 0,
  };
  const spanishName = countryName(upper);
  const [recentPapers, topInstitutions, providerRows, recent30d] =
    await Promise.all([
      env.DB.prepare(`
        SELECT r.title, r.original_url, r.published_at, r.source_name FROM observatory_records r
        WHERE r.record_kind = 'paper' AND EXISTS (
          SELECT 1 FROM json_each(COALESCE(json_extract(r.data_json, '$.countries'), '[]')) je WHERE UPPER(je.value) = ?)
        ORDER BY COALESCE(r.published_at, r.detected_at) DESC LIMIT 8
      `)
        .bind(upper)
        .all<Record<string, unknown>>(),
      env.DB.prepare(`
        SELECT entity_name, city, works_count, homepage_url FROM map_locations
        WHERE entity_kind = 'institution' AND country_code = ? ORDER BY works_count DESC LIMIT 8
      `)
        .bind(upper)
        .all<Record<string, unknown>>(),
      env.DB.prepare("SELECT id, name FROM providers WHERE country = ?")
        .bind(spanishName)
        .all<{ id: string; name: string }>(),
      env.DB.prepare(`
        SELECT COUNT(*) AS count FROM observatory_records r
        WHERE r.detected_at >= datetime('now', '-30 days') AND (
          UPPER(COALESCE(r.country_region, '')) = ? OR r.country_region = ? OR EXISTS (
            SELECT 1 FROM json_each(COALESCE(json_extract(r.data_json, '$.countries'), '[]')) je WHERE UPPER(je.value) = ?))
      `)
        .bind(upper, spanishName, upper)
        .first<{ count: number }>(),
    ]);
  return {
    country: { code: upper, name: spanishName },
    aggregate,
    recentPapers: recentPapers.results.map((row) => ({
      title: String(row.title),
      url: String(row.original_url),
      publishedAt: row.published_at ? String(row.published_at) : null,
      sourceName: String(row.source_name),
    })),
    institutions: topInstitutions.results.map((row) => ({
      name: String(row.entity_name),
      city: row.city ? String(row.city) : null,
      worksCount: row.works_count === null ? null : Number(row.works_count),
      homepageUrl: row.homepage_url ? String(row.homepage_url) : null,
    })),
    providers: providerRows.results,
    recentActivity30d: {
      records: Number(recent30d?.count ?? 0),
      label: "Inferencia del observatorio",
      note: "Conteo de registros indexados en los últimos 30 días asociados al país dentro de las fuentes actualmente sincronizadas.",
    },
    sources: ["OpenAlex", "OpenRouter", "GitHub REST", "Feeds oficiales"],
  };
}

// ---------------------------------------------------------------------------
// Rankings de modelos y ofertas
// ---------------------------------------------------------------------------

export async function getModelRankings(env: ModulesEnv, type: string) {
  const validTypes: string[] = [
    ...CATALOG_RANKING_TYPES,
    ...CATEGORY_RANKING_TYPES,
  ];
  if ((UNAVAILABLE_RANKING_TYPES as readonly string[]).includes(type)) {
    return {
      type,
      available: false,
      reason:
        "Ranking no disponible: la API pública de OpenRouter no publica este orden (verificado: el parámetro `order` es ignorado). No se sustituye por otro orden.",
      entries: [],
    };
  }
  if (!validTypes.includes(type)) return null;
  const latest = await env.DB.prepare(
    "SELECT MAX(ranking_date) AS date FROM model_rankings WHERE ranking_type = ?",
  )
    .bind(type)
    .first<{ date: string | null }>();
  if (!latest?.date) {
    return {
      type,
      available: true,
      reason: null,
      entries: [],
      rankingDate: null,
    };
  }
  const rows = await env.DB.prepare(`
    SELECT mr.*, r.data_json, r.original_url, r.summary FROM model_rankings mr
    LEFT JOIN observatory_records r ON r.source_id = 'openrouter' AND r.external_id = mr.model_external_id
    WHERE mr.ranking_type = ? AND mr.ranking_date = ?
    ORDER BY mr.ranking_position ASC LIMIT 50
  `)
    .bind(type, latest.date)
    .all<Record<string, unknown>>();
  const offerings = await env.DB.prepare(`
    SELECT model_external_id, COUNT(*) AS providers, MIN(input_price_per_million) AS min_input,
      MAX(input_price_per_million) AS max_input, MIN(output_price_per_million) AS min_output,
      MAX(verified_at) AS verified_at
    FROM model_offerings WHERE input_price_per_million IS NOT NULL GROUP BY model_external_id
  `).all<Record<string, unknown>>();
  const offeringMap = new Map(
    offerings.results.map((row) => [String(row.model_external_id), row]),
  );
  const usageByModel = await usageRankingsByModel(env);
  return {
    type,
    available: true,
    reason: null,
    rankingDate: latest.date,
    entries: rows.results.map((row) => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(String(row.data_json ?? "{}"));
      } catch {
        data = {};
      }
      const offering = offeringMap.get(String(row.model_external_id));
      const capabilities = deriveCapabilityTags({
        ...capabilityInputFrom(data),
        rankings: usageByModel.get(String(row.model_external_id)) ?? [],
      });
      return {
        capabilities,
        modelExternalId: String(row.model_external_id),
        modelTitle: String(row.model_title),
        position: Number(row.ranking_position),
        score: row.score === null ? null : Number(row.score),
        scoreUnit: row.score_unit ? String(row.score_unit) : null,
        sourceName: String(row.source_name),
        rankingDate: String(row.ranking_date),
        methodology: String(row.methodology),
        methodologyUrl: row.methodology_url
          ? String(row.methodology_url)
          : null,
        summary: row.summary ? String(row.summary) : null,
        url: row.original_url ? String(row.original_url) : null,
        contextLength:
          typeof data.contextLength === "number" ? data.contextLength : null,
        inputPricePerToken: data.inputPricePerToken ?? null,
        outputPricePerToken: data.outputPricePerToken ?? null,
        offeringSummary: offering
          ? {
              providers: Number(offering.providers),
              minInputPerMillion: Number(offering.min_input),
              maxInputPerMillion: Number(offering.max_input),
              minOutputPerMillion: Number(offering.min_output),
              verifiedAt: String(offering.verified_at),
            }
          : null,
      };
    }),
  };
}

export async function getModelOfferings(env: ModulesEnv, modelId: string) {
  const rows = await env.DB.prepare(`
    SELECT * FROM model_offerings WHERE model_external_id = ?
    ORDER BY input_price_per_million ASC NULLS LAST
  `)
    .bind(modelId)
    .all<Record<string, unknown>>();
  return rows.results.map((row) => ({
    providerName: String(row.provider_name),
    providerModelIdentifier: row.provider_model_identifier
      ? String(row.provider_model_identifier)
      : null,
    inputPricePerMillion:
      row.input_price_per_million === null
        ? null
        : Number(row.input_price_per_million),
    outputPricePerMillion:
      row.output_price_per_million === null
        ? null
        : Number(row.output_price_per_million),
    cachedInputPricePerMillion:
      row.cached_input_price_per_million === null
        ? null
        : Number(row.cached_input_price_per_million),
    contextLength:
      row.context_length === null ? null : Number(row.context_length),
    maxCompletionTokens:
      row.max_completion_tokens === null
        ? null
        : Number(row.max_completion_tokens),
    quantization: row.quantization ? String(row.quantization) : null,
    status: row.status ? String(row.status) : null,
    pricingSourceName: String(row.pricing_source_name),
    verifiedAt: String(row.verified_at),
  }));
}

// ---------------------------------------------------------------------------
// Ficha de modelo: capacidades, rankings de uso y proveedores que lo alojan
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  "category-programming": "Programación",
  "category-technology": "Tecnología",
  "category-science": "Ciencia",
  "category-translation": "Traducción",
};

function parseJsonObject(value: unknown): Record<string, unknown> {
  try {
    const parsed = JSON.parse(String(value ?? "{}"));
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function numberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return value === null || value === undefined || !Number.isFinite(parsed)
    ? null
    : parsed;
}

function capabilityInputFrom(data: Record<string, unknown>): CapabilityInput {
  const architecture = (data.architecture ?? {}) as Record<string, unknown>;
  return {
    contextLength: numberOrNull(data.contextLength),
    inputModalities: stringList(architecture.input_modalities),
    outputModalities: stringList(architecture.output_modalities),
    supportedParameters: stringList(data.supportedParameters),
    inputPricePerToken: numberOrNull(data.inputPricePerToken),
    outputPricePerToken: numberOrNull(data.outputPricePerToken),
    huggingFaceId:
      typeof data.huggingFaceId === "string" ? data.huggingFaceId : null,
  };
}

/** Latest date on which usage-category rankings were stored. */
async function latestCategoryRankingDate(
  env: ModulesEnv,
): Promise<string | null> {
  const placeholders = CATEGORY_RANKING_TYPES.map(() => "?").join(",");
  const row = await env.DB.prepare(
    `SELECT MAX(ranking_date) AS date FROM model_rankings WHERE ranking_type IN (${placeholders})`,
  )
    .bind(...CATEGORY_RANKING_TYPES)
    .first<{ date: string | null }>();
  return row?.date ?? null;
}

/**
 * Real-usage category positions per model at the latest ranking date, used to
 * tag models with the categories they actually rank in.
 */
async function usageRankingsByModel(
  env: ModulesEnv,
): Promise<Map<string, { rankingType: string; position: number }[]>> {
  const byModel = new Map<
    string,
    { rankingType: string; position: number }[]
  >();
  const rankingDate = await latestCategoryRankingDate(env);
  if (!rankingDate) return byModel;
  const placeholders = CATEGORY_RANKING_TYPES.map(() => "?").join(",");
  const rows = await env.DB.prepare(
    `SELECT model_external_id, ranking_type, ranking_position FROM model_rankings
     WHERE ranking_date = ? AND ranking_type IN (${placeholders})`,
  )
    .bind(rankingDate, ...CATEGORY_RANKING_TYPES)
    .all<Record<string, unknown>>();
  for (const row of rows.results) {
    const key = String(row.model_external_id);
    const list = byModel.get(key) ?? [];
    list.push({
      rankingType: String(row.ranking_type),
      position: Number(row.ranking_position),
    });
    byModel.set(key, list);
  }
  return byModel;
}

export async function getModelDetail(env: ModulesEnv, modelId: string) {
  const record = await env.DB.prepare(
    `SELECT title, summary, original_url, data_json, last_successful_sync_at
     FROM observatory_records
     WHERE record_kind = 'model' AND external_id = ?
     ORDER BY CASE WHEN source_id = 'openrouter' THEN 0 ELSE 1 END LIMIT 1`,
  )
    .bind(modelId)
    .first<Record<string, unknown>>();

  const rankingRows = await env.DB.prepare(
    `SELECT mr.ranking_type, mr.ranking_position, mr.ranking_date, mr.methodology, mr.methodology_url
     FROM model_rankings mr
     WHERE mr.model_external_id = ?
       AND mr.ranking_date = (
         SELECT MAX(ranking_date) FROM model_rankings WHERE ranking_type = mr.ranking_type
       )
     ORDER BY mr.ranking_position ASC`,
  )
    .bind(modelId)
    .all<Record<string, unknown>>();

  const rankings = rankingRows.results.map((row) => ({
    rankingType: String(row.ranking_type),
    label:
      CATEGORY_LABELS[String(row.ranking_type)] ?? String(row.ranking_type),
    position: Number(row.ranking_position),
    rankingDate: String(row.ranking_date),
    methodology: String(row.methodology),
    methodologyUrl: row.methodology_url ? String(row.methodology_url) : null,
    isUsageCategory: (CATEGORY_RANKING_TYPES as readonly string[]).includes(
      String(row.ranking_type),
    ),
  }));

  const data = record ? parseJsonObject(record.data_json) : {};
  const capabilities = deriveCapabilityTags({
    ...capabilityInputFrom(data),
    rankings: rankings
      .filter((entry) => entry.isUsageCategory)
      .map((entry) => ({
        rankingType: entry.rankingType,
        position: entry.position,
      })),
  });

  const offerings = await getModelOfferings(env, modelId);
  const priced = offerings.filter(
    (offering) => offering.inputPricePerMillion !== null,
  );

  return {
    modelExternalId: modelId,
    modelTitle: record ? String(record.title) : modelId,
    summary: record?.summary ? String(record.summary) : null,
    url: record?.original_url ? String(record.original_url) : null,
    contextLength: numberOrNull(data.contextLength),
    inputPricePerToken: numberOrNull(data.inputPricePerToken),
    outputPricePerToken: numberOrNull(data.outputPricePerToken),
    indexed: Boolean(record),
    capabilities,
    primaryUse: describePrimaryUse(capabilities),
    rankings,
    offerings,
    hostSummary: priced.length
      ? {
          providers: priced.length,
          minInputPerMillion: Math.min(
            ...priced.map((item) => item.inputPricePerMillion ?? 0),
          ),
          maxInputPerMillion: Math.max(
            ...priced.map((item) => item.inputPricePerMillion ?? 0),
          ),
          verifiedAt: priced
            .map((item) => item.verifiedAt)
            .sort()
            .at(-1) as string,
        }
      : null,
    offeringsNote: offerings.length
      ? null
      : "OpenRouter indexa los proveedores que alojan cada modelo solo para los mejor posicionados de cada sincronización. Ejecuta «Sincronizar modelos» o elige un modelo del ranking principal.",
  };
}

// ---------------------------------------------------------------------------
// Ficha de proveedor: sus modelos por uso real y los que aloja
// ---------------------------------------------------------------------------

export async function getProviderModels(env: ModulesEnv, providerId: string) {
  const provider = await env.DB.prepare(
    "SELECT id, name, models_url, pricing_url FROM providers WHERE id = ?",
  )
    .bind(providerId)
    .first<Record<string, unknown>>();
  if (!provider) return null;
  const providerName = String(provider.name);

  const prefixes = authorPrefixesFor(providerId);
  const prefixClauses = prefixes.map(() => "r.external_id LIKE ?").join(" OR ");
  const records = await env.DB.prepare(
    `SELECT r.external_id, r.title, r.summary, r.original_url, r.data_json
     FROM observatory_records r
     WHERE r.record_kind = 'model' AND (r.provider_id = ? OR ${prefixClauses})
     GROUP BY r.external_id
     LIMIT 400`,
  )
    .bind(providerId, ...prefixes.map((prefix) => `${prefix}/%`))
    .all<Record<string, unknown>>();

  // Usage rankings (real order published by OpenRouter per category).
  const rankingDate = await latestCategoryRankingDate(env);
  const rankingByModel = await usageRankingsByModel(env);

  const offeringRows = await env.DB.prepare(
    `SELECT model_external_id, COUNT(*) AS providers, MIN(input_price_per_million) AS min_input,
       MIN(output_price_per_million) AS min_output, MAX(verified_at) AS verified_at
     FROM model_offerings WHERE input_price_per_million IS NOT NULL
     GROUP BY model_external_id`,
  ).all<Record<string, unknown>>();
  const offeringMap = new Map(
    offeringRows.results.map((row) => [String(row.model_external_id), row]),
  );

  const authored = records.results
    .map((row) => {
      const modelId = String(row.external_id);
      const data = parseJsonObject(row.data_json);
      const modelRankings = rankingByModel.get(modelId) ?? [];
      const best = modelRankings.length
        ? modelRankings.reduce((left, right) =>
            left.position <= right.position ? left : right,
          )
        : null;
      const capabilities = deriveCapabilityTags({
        ...capabilityInputFrom(data),
        rankings: modelRankings,
      });
      const offering = offeringMap.get(modelId);
      const perToken = (value: number | null) =>
        value === null ? null : Math.round(value * 1_000_000 * 10_000) / 10_000;
      return {
        modelExternalId: modelId,
        modelTitle: String(row.title),
        summary: row.summary ? String(row.summary) : null,
        url: row.original_url ? String(row.original_url) : null,
        contextLength: numberOrNull(data.contextLength),
        inputPricePerMillion: perToken(numberOrNull(data.inputPricePerToken)),
        outputPricePerMillion: perToken(numberOrNull(data.outputPricePerToken)),
        usageRank: best
          ? {
              category: CATEGORY_LABELS[best.rankingType] ?? best.rankingType,
              position: best.position,
              rankingDate,
            }
          : null,
        capabilities,
        hostCount: offering ? Number(offering.providers) : 0,
      };
    })
    .sort((left, right) => {
      const leftRank = left.usageRank?.position ?? Number.MAX_SAFE_INTEGER;
      const rightRank = right.usageRank?.position ?? Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.modelTitle.localeCompare(right.modelTitle, "es");
    });

  // Models this provider hosts as an inference endpoint.
  const hostNames = hostNamesFor(providerId, providerName);
  const hostPlaceholders = hostNames.map(() => "?").join(",");
  const hostedRows = await env.DB.prepare(
    `SELECT model_external_id, model_title, input_price_per_million, output_price_per_million,
       cached_input_price_per_million, context_length, quantization, status, verified_at
     FROM model_offerings WHERE LOWER(provider_name) IN (${hostPlaceholders})
     ORDER BY input_price_per_million ASC LIMIT 120`,
  )
    .bind(...hostNames)
    .all<Record<string, unknown>>();
  const hosted = hostedRows.results.map((row) => ({
    modelExternalId: String(row.model_external_id),
    modelTitle: String(row.model_title),
    inputPricePerMillion: numberOrNull(row.input_price_per_million),
    outputPricePerMillion: numberOrNull(row.output_price_per_million),
    cachedInputPricePerMillion: numberOrNull(
      row.cached_input_price_per_million,
    ),
    contextLength: numberOrNull(row.context_length),
    quantization: row.quantization ? String(row.quantization) : null,
    status: row.status ? String(row.status) : null,
    verifiedAt: String(row.verified_at),
  }));

  return {
    providerId,
    providerName,
    isAggregator: isAggregator(providerId),
    rankingDate,
    authored,
    hosted,
    links: {
      models: provider.models_url ? String(provider.models_url) : null,
      pricing: provider.pricing_url ? String(provider.pricing_url) : null,
    },
    note: authored.length
      ? "El orden usa los rankings de uso real por categoría de OpenRouter. Los modelos sin posición no aparecieron en ninguna categoría en la última sincronización."
      : "No hay modelos indexados para este proveedor. Ejecuta «Sincronizar modelos» para poblar el catálogo público.",
  };
}

// ---------------------------------------------------------------------------
// Rankings de GitHub
// ---------------------------------------------------------------------------

const GITHUB_TOPIC_VIEWS: Record<string, string[]> = {
  rag: [
    "rag",
    "retrieval-augmented-generation",
    "vector-database",
    "embeddings",
  ],
  agents: ["ai-agent", "agents", "agent", "llm-agent", "autonomous-agents"],
  audio: [
    "speech-to-text",
    "text-to-speech",
    "whisper",
    "speech-recognition",
    "audio",
  ],
  vision: ["computer-vision", "vision", "ocr", "image-generation"],
  "open-local": [
    "local-ai",
    "ollama",
    "llama-cpp",
    "llamacpp",
    "vllm",
    "self-hosted",
  ],
};

/** How many model lines the trend chart shows at once. */
const PRICE_SERIES_LIMIT = 5;

/**
 * Per-model input price per million tokens, one point per synchronization date.
 *
 * Every value is a `score` that OpenRouter's `pricing-low` ranking actually
 * reported on that date (`score_unit = usd_per_million_input`), so the series
 * only ever contains observations the observatory really stored. Dates between
 * synchronizations are not interpolated and history is never back-filled: with
 * fewer than two dates the endpoint says a trend is not available yet.
 *
 * Models are chosen among those present on every stored date, ranked by how
 * much their price actually moved, so the chart shows real movement rather than
 * an arbitrary slice of the catalogue.
 */
export async function getPriceHistory(env: ModulesEnv) {
  const rows = await env.DB.prepare(
    `SELECT ranking_date, model_external_id, model_title, score
     FROM model_rankings
     WHERE ranking_type = 'pricing-low' AND score IS NOT NULL
     ORDER BY ranking_date ASC`,
  ).all<Record<string, unknown>>();

  const dates = [
    ...new Set(rows.results.map((row) => String(row.ranking_date))),
  ].sort();

  const byModel = new Map<
    string,
    { title: string; points: Map<string, number> }
  >();
  for (const row of rows.results) {
    const id = String(row.model_external_id);
    const score = Number(row.score);
    if (!Number.isFinite(score)) continue;
    const entry = byModel.get(id) ?? {
      title: String(row.model_title),
      points: new Map<string, number>(),
    };
    entry.title = String(row.model_title);
    entry.points.set(String(row.ranking_date), score);
    byModel.set(id, entry);
  }

  const complete = [...byModel.entries()]
    .filter(([, entry]) => entry.points.size === dates.length)
    .map(([id, entry]) => {
      const points = dates.map((date) => ({
        date,
        pricePerMillion: entry.points.get(date) as number,
      }));
      const first = points[0].pricePerMillion;
      const current = points[points.length - 1].pricePerMillion;
      const changePercent = first ? ((current - first) / first) * 100 : 0;
      return {
        modelExternalId: id,
        modelTitle: entry.title,
        points,
        first,
        current,
        changePercent: Math.round(changePercent * 10) / 10,
      };
    });

  // Prefer lines that actually moved; fall back to the dearer models so the
  // chart is never a set of flat, identical lines when nothing changed.
  const series = complete
    .sort((left, right) => {
      const move = Math.abs(right.changePercent) - Math.abs(left.changePercent);
      return move !== 0 ? move : right.current - left.current;
    })
    .slice(0, PRICE_SERIES_LIMIT);

  return {
    dates,
    series,
    observations: dates.length,
    trackedModels: complete.length,
    available: dates.length >= 2 && series.length > 0,
    reason:
      dates.length >= 2 && series.length > 0
        ? null
        : "El histórico se construye con cada sincronización. Todavía no hay dos fechas distintas de ranking con los mismos modelos, y no se simulan valores anteriores.",
    methodology:
      "Precio de entrada por millón de tokens que el ranking «pricing-low» de OpenRouter publicó en cada fecha de sincronización. Sin interpolar días intermedios.",
  };
}

export async function getGithubRankings(env: ModulesEnv, view: string) {
  const baseSelect = `
    SELECT r.id, r.title, r.summary, r.original_url, r.published_at, r.source_name, r.retrieved_at, r.data_json
    FROM observatory_records r WHERE r.record_kind = 'repository'`;
  let rows: Array<Record<string, unknown>> = [];
  if (view === "stars" || view === "peru-latam") {
    const extra =
      view === "peru-latam"
        ? ` AND (LOWER(r.title) LIKE '%peru%' OR LOWER(COALESCE(r.summary,'')) LIKE '%peru%'
            OR LOWER(COALESCE(r.summary,'')) LIKE '%latam%' OR LOWER(COALESCE(r.summary,'')) LIKE '%latinoam%'
            OR EXISTS (SELECT 1 FROM json_each(COALESCE(json_extract(r.data_json,'$.topics'),'[]')) je
                       WHERE je.value IN ('peru','latam','latin-america','spanish')))`
        : "";
    const result = await env.DB.prepare(
      `${baseSelect}${extra} ORDER BY CAST(COALESCE(json_extract(r.data_json,'$.stars'),0) AS INTEGER) DESC LIMIT 100`,
    ).all<Record<string, unknown>>();
    rows = result.results;
  } else if (view === "active") {
    const result = await env.DB.prepare(
      `${baseSelect} ORDER BY json_extract(r.data_json,'$.pushedAt') DESC LIMIT 100`,
    ).all<Record<string, unknown>>();
    rows = result.results;
  } else if (view === "new") {
    const result = await env.DB.prepare(
      `${baseSelect} ORDER BY r.published_at DESC LIMIT 100`,
    ).all<Record<string, unknown>>();
    rows = result.results;
  } else if (view === "growth") {
    const growth = await env.DB.prepare(`
      SELECT r.id, r.title, r.summary, r.original_url, r.published_at, r.source_name, r.retrieved_at, r.data_json,
        latest.stars AS latest_stars, latest.snapshot_date AS latest_date,
        earlier.stars AS earlier_stars, earlier.snapshot_date AS earlier_date
      FROM observatory_records r
      JOIN repository_snapshots latest ON latest.record_id = r.id
        AND latest.snapshot_date = (SELECT MAX(snapshot_date) FROM repository_snapshots WHERE record_id = r.id)
      JOIN repository_snapshots earlier ON earlier.record_id = r.id
        AND earlier.snapshot_date = (SELECT MIN(snapshot_date) FROM repository_snapshots WHERE record_id = r.id)
      WHERE r.record_kind = 'repository' AND latest.snapshot_date > earlier.snapshot_date
      ORDER BY (latest.stars - earlier.stars) DESC LIMIT 100
    `).all<Record<string, unknown>>();
    return {
      view,
      available: growth.results.length > 0,
      reason:
        growth.results.length > 0
          ? null
          : "Crecimiento todavía no calculable: se necesitan al menos dos snapshots en fechas distintas por repositorio.",
      entries: growth.results.map((row, index) =>
        mapRepositoryRow(row, index, {
          starGrowth: Number(row.latest_stars) - Number(row.earlier_stars),
          periodStart: String(row.earlier_date),
          periodEnd: String(row.latest_date),
        }),
      ),
    };
  } else if (GITHUB_TOPIC_VIEWS[view]) {
    const topics = GITHUB_TOPIC_VIEWS[view];
    const result = await env.DB.prepare(
      `${baseSelect} AND EXISTS (
        SELECT 1 FROM json_each(COALESCE(json_extract(r.data_json,'$.topics'),'[]')) je
        WHERE je.value IN (${topics.map(() => "?").join(",")}))
       ORDER BY CAST(COALESCE(json_extract(r.data_json,'$.stars'),0) AS INTEGER) DESC LIMIT 100`,
    )
      .bind(...topics)
      .all<Record<string, unknown>>();
    rows = result.results;
  } else {
    return null;
  }
  return {
    view,
    available: rows.length > 0,
    reason:
      rows.length > 0 ? null : "Sin repositorios indexados para esta vista.",
    entries: rows.map((row, index) => mapRepositoryRow(row, index, null)),
  };
}

function mapRepositoryRow(
  row: Record<string, unknown>,
  index: number,
  growth: { starGrowth: number; periodStart: string; periodEnd: string } | null,
) {
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(String(row.data_json ?? "{}"));
  } catch {
    data = {};
  }
  return {
    rank: index + 1,
    id: String(row.id),
    fullName: String(row.title),
    owner: typeof data.owner === "string" ? data.owner : null,
    description: row.summary ? String(row.summary) : null,
    stars: Number(data.stars ?? 0),
    forks: Number(data.forks ?? 0),
    openIssues: Number(data.openIssues ?? 0),
    language: typeof data.language === "string" ? data.language : null,
    license: typeof data.license === "string" ? data.license : null,
    topics: Array.isArray(data.topics)
      ? data.topics.filter((item): item is string => typeof item === "string")
      : [],
    pushedAt: typeof data.pushedAt === "string" ? data.pushedAt : null,
    createdAt: row.published_at ? String(row.published_at) : null,
    homepage: typeof data.homepage === "string" ? data.homepage : null,
    url: String(row.original_url),
    sourceName: String(row.source_name),
    retrievedAt: String(row.retrieved_at),
    growth,
  };
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export async function listVideos(
  env: ModulesEnv,
  params: URLSearchParams,
): Promise<{
  items: Array<Record<string, unknown>>;
  total: number;
  platforms: Array<{ platform: string; count: number }>;
}> {
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  const platform = (params.get("platform") ?? "").trim();
  if (platform === "youtube" || platform === "facebook") {
    conditions.push("platform = ?");
    bindings.push(platform);
  }
  const search = (params.get("q") ?? "").trim().slice(0, 120);
  if (search) {
    conditions.push(
      "(title LIKE ? OR description LIKE ? OR channel_title LIKE ?)",
    );
    const pattern = `%${search.replaceAll("%", "\\%")}%`;
    bindings.push(pattern, pattern, pattern);
  }
  const topic = (params.get("topic") ?? "").trim();
  if (topic) {
    conditions.push("topic = ?");
    bindings.push(topic);
  }
  const language = (params.get("language") ?? "").trim();
  if (language) {
    conditions.push("language LIKE ?");
    bindings.push(`${language}%`);
  }
  if (params.get("official") === "1")
    conditions.push("is_official_channel = 1");
  const order =
    params.get("order") === "views"
      ? "view_count DESC NULLS LAST"
      : "published_at DESC";
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [count, rows, platforms] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS total FROM video_items ${where}`)
      .bind(...bindings)
      .first<{ total: number }>(),
    env.DB.prepare(
      `SELECT * FROM video_items ${where} ORDER BY ${order} LIMIT 60`,
    )
      .bind(...bindings)
      .all<Record<string, unknown>>(),
    env.DB.prepare(
      "SELECT platform, COUNT(*) AS count FROM video_items GROUP BY platform ORDER BY count DESC",
    ).all<{ platform: string; count: number }>(),
  ]);
  return {
    total: Number(count?.total ?? 0),
    platforms: platforms.results.map((row) => ({
      platform: String(row.platform),
      count: Number(row.count),
    })),
    items: rows.results.map((row) => ({
      id: String(row.id),
      platform: String(row.platform),
      externalId: String(row.external_id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      channelTitle: String(row.channel_title),
      isOfficialChannel: Boolean(row.is_official_channel),
      publishedAt: row.published_at ? String(row.published_at) : null,
      thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
      watchUrl: String(row.watch_url),
      language: row.language ? String(row.language) : null,
      topic: String(row.topic),
      durationSeconds:
        row.duration_seconds === null ? null : Number(row.duration_seconds),
      viewCount: row.view_count === null ? null : Number(row.view_count),
      sourceName: String(row.source_name),
      retrievedAt: String(row.retrieved_at),
    })),
  };
}

// ---------------------------------------------------------------------------
// Mi laboratorio
// ---------------------------------------------------------------------------

async function engineContext(env: ModulesEnv): Promise<EngineContext> {
  const [offerings, openModels, repositories] = await Promise.all([
    env.DB.prepare(`
      SELECT model_external_id, model_title, provider_name, input_price_per_million,
        output_price_per_million, context_length, verified_at
      FROM model_offerings ORDER BY input_price_per_million ASC NULLS LAST LIMIT 200
    `).all<Record<string, unknown>>(),
    env.DB.prepare(`
      SELECT external_id, title, source_name, original_url, json_extract(data_json,'$.license') AS license
      FROM observatory_records
      WHERE record_kind = 'model' AND (
        json_extract(data_json,'$.localAvailability') = 1 OR json_extract(data_json,'$.localAvailability') = true
        OR json_extract(data_json,'$.huggingFaceId') IS NOT NULL)
      ORDER BY COALESCE(published_at, detected_at) DESC LIMIT 40
    `).all<Record<string, unknown>>(),
    env.DB.prepare(`
      SELECT external_id, title, original_url, data_json FROM observatory_records
      WHERE record_kind = 'repository'
      ORDER BY CAST(COALESCE(json_extract(data_json,'$.stars'),0) AS INTEGER) DESC LIMIT 150
    `).all<Record<string, unknown>>(),
  ]);
  return {
    offerings: offerings.results.map((row) => ({
      modelExternalId: String(row.model_external_id),
      modelTitle: String(row.model_title),
      providerName: String(row.provider_name),
      inputPricePerMillion:
        row.input_price_per_million === null
          ? null
          : Number(row.input_price_per_million),
      outputPricePerMillion:
        row.output_price_per_million === null
          ? null
          : Number(row.output_price_per_million),
      contextLength:
        row.context_length === null ? null : Number(row.context_length),
      verifiedAt: String(row.verified_at),
    })),
    openModels: openModels.results.map((row) => ({
      externalId: String(row.external_id),
      title: String(row.title),
      sourceName: String(row.source_name),
      license: row.license ? String(row.license) : null,
      url: String(row.original_url),
    })),
    repositories: repositories.results.map((row) => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(String(row.data_json ?? "{}"));
      } catch {
        data = {};
      }
      return {
        externalId: String(row.external_id),
        title: String(row.title),
        stars: Number(data.stars ?? 0),
        topics: Array.isArray(data.topics)
          ? data.topics.filter(
              (item): item is string => typeof item === "string",
            )
          : [],
        url: String(row.original_url),
      };
    }),
  };
}

export async function listLaboratoryProjects(env: ModulesEnv) {
  const rows = await env.DB.prepare(`
    SELECT p.id, p.name, p.status, p.inputs_json, p.created_at, p.updated_at,
      (SELECT COUNT(*) FROM laboratory_alternatives a WHERE a.project_id = p.id) AS alternatives
    FROM laboratory_projects p ORDER BY p.updated_at DESC
  `).all<Record<string, unknown>>();
  return rows.results.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    status: String(row.status),
    inputs: parseInputs(row.inputs_json),
    alternativeCount: Number(row.alternatives ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

function parseInputs(value: unknown): ProjectInputs | null {
  try {
    return JSON.parse(String(value ?? "null")) as ProjectInputs;
  } catch {
    return null;
  }
}

export async function getLaboratoryProject(env: ModulesEnv, id: string) {
  const row = await env.DB.prepare(
    "SELECT * FROM laboratory_projects WHERE id = ?",
  )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!row) return null;
  const alternatives = await env.DB.prepare(
    "SELECT alternative_kind, recommendation_json, engine_version, calculated_at FROM laboratory_alternatives WHERE project_id = ?",
  )
    .bind(id)
    .all<Record<string, unknown>>();
  return {
    id: String(row.id),
    name: String(row.name),
    status: String(row.status),
    inputs: parseInputs(row.inputs_json),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    alternatives: alternatives.results.map((entry) => {
      let recommendation: unknown = null;
      try {
        recommendation = JSON.parse(String(entry.recommendation_json));
      } catch {
        recommendation = null;
      }
      return {
        kind: String(entry.alternative_kind),
        engineVersion: String(entry.engine_version),
        calculatedAt: String(entry.calculated_at),
        recommendation,
      };
    }),
  };
}

export async function saveLaboratoryProject(
  env: ModulesEnv,
  payload: {
    id?: string;
    name: string;
    inputs: ProjectInputs;
    status?: string;
  },
) {
  const id = payload.id ?? crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO laboratory_projects (id, name, status, inputs_json, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, status = excluded.status,
      inputs_json = excluded.inputs_json, updated_at = CURRENT_TIMESTAMP
  `)
    .bind(
      id,
      payload.name,
      payload.status === "archived" ? "archived" : "active",
      JSON.stringify(payload.inputs),
    )
    .run();
  return id;
}

export async function recommendForProject(env: ModulesEnv, projectId: string) {
  const project = await getLaboratoryProject(env, projectId);
  if (!project?.inputs) return null;
  const context = await engineContext(env);
  const alternatives = recommend(project.inputs, context);
  const now = new Date().toISOString();
  const statements = alternatives.map((alternative) =>
    env.DB.prepare(`
      INSERT INTO laboratory_alternatives (id, project_id, alternative_kind, recommendation_json, engine_version, calculated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id, alternative_kind) DO UPDATE SET
        recommendation_json = excluded.recommendation_json,
        engine_version = excluded.engine_version, calculated_at = excluded.calculated_at
    `).bind(
      crypto.randomUUID(),
      projectId,
      alternative.kind,
      JSON.stringify(alternative),
      ENGINE_VERSION,
      now,
    ),
  );
  statements.push(
    env.DB.prepare(`
      INSERT INTO live_events (id, event_type, record_id, title, event_at, source_name, target_path)
      VALUES (?, 'laboratory_recommendation', NULL, ?, ?, 'Mi laboratorio', '/laboratory')
    `).bind(
      crypto.randomUUID(),
      `Recomendación recalculada: ${project.name}`,
      now,
    ),
  );
  await batchStatements(env, statements);
  return {
    projectId,
    engineVersion: ENGINE_VERSION,
    calculatedAt: now,
    alternatives,
  };
}

export async function deleteLaboratoryProject(env: ModulesEnv, id: string) {
  await env.DB.prepare(
    "UPDATE laboratory_projects SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  )
    .bind(id)
    .run();
}
