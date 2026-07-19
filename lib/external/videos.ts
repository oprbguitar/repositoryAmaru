import { z } from "zod";

// Normalización de resultados de YouTube Data API v3. No se descargan videos
// ni subtítulos: solo metadatos oficiales y enlaces de reproducción.

export type NormalizedVideo = {
  platform: "youtube";
  externalId: string;
  title: string;
  description: string | null;
  channelId: string | null;
  channelTitle: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  watchUrl: string;
  language: string | null;
  topic: string;
  queryGroup: string;
  durationSeconds: number | null;
  viewCount: number | null;
};

const searchSchema = z.object({
  items: z.array(
    z
      .object({
        id: z
          .object({ videoId: z.string().optional() })
          .passthrough()
          .optional(),
        snippet: z
          .object({
            publishedAt: z.string().optional(),
            channelId: z.string().optional(),
            channelTitle: z.string().optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            thumbnails: z.record(z.string(), z.unknown()).optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  ),
});

const playlistSchema = z.object({
  items: z.array(
    z
      .object({
        snippet: z
          .object({
            publishedAt: z.string().optional(),
            channelId: z.string().optional(),
            channelTitle: z.string().optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            thumbnails: z.record(z.string(), z.unknown()).optional(),
            resourceId: z
              .object({ videoId: z.string().optional() })
              .passthrough()
              .optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  ),
});

const videosSchema = z.object({
  items: z.array(
    z
      .object({
        id: z.string(),
        contentDetails: z
          .object({ duration: z.string().optional() })
          .passthrough()
          .optional(),
        statistics: z
          .object({ viewCount: z.string().optional() })
          .passthrough()
          .optional(),
        snippet: z
          .object({ defaultAudioLanguage: z.string().optional() })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  ),
});

export function parseIsoDuration(
  value: string | null | undefined,
): number | null {
  if (!value) return null;
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const [, hours, minutes, seconds] = match;
  return (
    Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0)
  );
}

function thumbnail(
  thumbnails: Record<string, unknown> | undefined,
): string | null {
  for (const key of ["medium", "high", "default"]) {
    const entry = thumbnails?.[key] as Record<string, unknown> | undefined;
    if (entry && typeof entry.url === "string") return entry.url;
  }
  return null;
}

function buildVideo(
  videoId: string,
  snippet: {
    publishedAt?: string;
    channelId?: string;
    channelTitle?: string;
    title?: string;
    description?: string;
    thumbnails?: Record<string, unknown>;
  },
  topic: string,
  queryGroup: string,
  language: string | null,
): NormalizedVideo {
  return {
    platform: "youtube",
    externalId: videoId,
    title: snippet.title ?? "Video sin título informado",
    description: snippet.description || null,
    channelId: snippet.channelId ?? null,
    channelTitle: snippet.channelTitle ?? "Canal no informado",
    publishedAt: snippet.publishedAt ?? null,
    thumbnailUrl: thumbnail(snippet.thumbnails),
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    language,
    topic,
    queryGroup,
    durationSeconds: null,
    viewCount: null,
  };
}

export function normalizeYouTubeSearch(
  payload: unknown,
  topic: string,
  queryGroup: string,
  language: string | null,
): NormalizedVideo[] {
  const parsed = searchSchema.parse(payload);
  return parsed.items.flatMap((item) => {
    const videoId = item.id?.videoId;
    if (!videoId || !item.snippet) return [];
    return [buildVideo(videoId, item.snippet, topic, queryGroup, language)];
  });
}

export function normalizeYouTubePlaylist(
  payload: unknown,
  topic: string,
  queryGroup: string,
): NormalizedVideo[] {
  const parsed = playlistSchema.parse(payload);
  return parsed.items.flatMap((item) => {
    const snippet = item.snippet;
    const videoId = snippet?.resourceId?.videoId;
    if (!videoId || !snippet) return [];
    return [buildVideo(videoId, snippet, topic, queryGroup, null)];
  });
}

export function enrichVideoDetails(
  videos: NormalizedVideo[],
  detailsPayload: unknown,
): NormalizedVideo[] {
  const parsed = videosSchema.parse(detailsPayload);
  const details = new Map(parsed.items.map((item) => [item.id, item]));
  return videos.map((video) => {
    const detail = details.get(video.externalId);
    if (!detail) return video;
    const viewCount = Number(detail.statistics?.viewCount);
    return {
      ...video,
      durationSeconds: parseIsoDuration(detail.contentDetails?.duration),
      viewCount: Number.isFinite(viewCount) ? viewCount : null,
      language: video.language ?? detail.snippet?.defaultAudioLanguage ?? null,
    };
  });
}

// Grupos de consultas configurables (cuota: search = 100 unidades por consulta)
export const VIDEO_QUERY_GROUPS: Array<{
  group: string;
  topic: string;
  language: string | null;
  queries: string[];
}> = [
  {
    group: "programming",
    topic: "Programación con IA",
    language: "en",
    queries: ["AI programming tutorial", "RAG tutorial", "AI agents tutorial"],
  },
  {
    group: "local-ai",
    topic: "IA local",
    language: "en",
    queries: ["Ollama tutorial", "vLLM deployment", "local LLM tutorial"],
  },
  {
    group: "research",
    topic: "Investigación",
    language: "en",
    queries: ["large language model lecture", "multimodal AI research"],
  },
  {
    group: "spanish",
    topic: "IA en español",
    language: "es",
    queries: [
      "inteligencia artificial programación",
      "RAG en español",
      "agentes IA en español",
      "inteligencia artificial Perú",
    ],
  },
];

// Handles oficiales para resolver channel_id con channels.list?forHandle (1 unidad).
export const OFFICIAL_CHANNEL_HANDLES: Record<string, string> = {
  "yt-openai": "OpenAI",
  "yt-anthropic": "anthropic-ai",
  "yt-deepmind": "Google_DeepMind",
  "yt-google-devs": "GoogleDevelopers",
  "yt-nvidia-dev": "NVIDIADeveloper",
  "yt-huggingface": "HuggingFace",
  "yt-mistral": "MistralAI",
  "yt-microsoft-dev": "MicrosoftDeveloper",
  "yt-aws-dev": "awsdevelopers",
  "yt-cloudflare-dev": "CloudflareDevelopers",
  "yt-github": "GitHub",
  "yt-langchain": "LangChain",
  "yt-stanford-hai": "stanfordhai",
  "yt-mit-csail": "MITCSAIL",
};
