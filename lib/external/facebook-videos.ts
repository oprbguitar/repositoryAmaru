import { z } from "zod";

/**
 * Normalización de videos de la Meta Graph API. Solo metadatos oficiales y el
 * enlace permanente de reproducción: no se descarga el archivo de video ni se
 * infieren métricas que la API no devuelva (las vistas exigen permisos de
 * insights, así que quedan en null cuando no llegan).
 */

export type NormalizedFacebookVideo = {
  platform: "facebook";
  externalId: string;
  title: string;
  description: string | null;
  pageId: string;
  pageName: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  watchUrl: string;
  durationSeconds: number | null;
  viewCount: number | null;
};

const videoSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        created_time: z.string().optional(),
        permalink_url: z.string().optional(),
        picture: z.string().optional(),
        length: z.number().optional(),
        views: z.number().optional(),
      })
      .passthrough(),
  ),
});

export const pageSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.string(),
        name: z.string().optional(),
        access_token: z.string().optional(),
      })
      .passthrough(),
  ),
});

export const FACEBOOK_GRAPH_VERSION = "v21.0";

export const FACEBOOK_VIDEO_FIELDS = [
  "id",
  "title",
  "description",
  "created_time",
  "permalink_url",
  "picture",
  "length",
  "views",
].join(",");

function absoluteUrl(permalink: string | undefined, id: string): string {
  if (!permalink) return `https://www.facebook.com/watch/?v=${id}`;
  return permalink.startsWith("http")
    ? permalink
    : `https://www.facebook.com${permalink}`;
}

/** El título es opcional en Graph: se cae a la primera línea de la descripción. */
function resolveTitle(
  title: string | undefined,
  description: string | undefined,
): string {
  const fromTitle = title?.trim();
  if (fromTitle) return fromTitle.slice(0, 240);
  const firstLine = description?.trim().split("\n")[0]?.trim();
  if (firstLine) return firstLine.slice(0, 240);
  return "Video sin título en la fuente";
}

export function normalizeFacebookVideos(
  payload: unknown,
  page: { id: string; name: string },
): NormalizedFacebookVideo[] {
  const parsed = videoSchema.safeParse(payload);
  if (!parsed.success) return [];
  return parsed.data.data.map((item) => ({
    platform: "facebook" as const,
    externalId: item.id,
    title: resolveTitle(item.title, item.description),
    description: item.description?.trim().slice(0, 600) ?? null,
    pageId: page.id,
    pageName: page.name,
    publishedAt: item.created_time
      ? new Date(item.created_time).toISOString()
      : null,
    thumbnailUrl: item.picture ?? null,
    watchUrl: absoluteUrl(item.permalink_url, item.id),
    durationSeconds:
      typeof item.length === "number" ? Math.round(item.length) : null,
    viewCount: typeof item.views === "number" ? item.views : null,
  }));
}
