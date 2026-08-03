import { z } from "zod";
import { plainText } from "./normalizers";
import type { NormalizedExternalRecord } from "./types";

/**
 * Normalizadores de agregadores de prensa (The Guardian, NewsAPI) y de series
 * económicas oficiales (FRED, Reserva Federal de San Luis).
 *
 * Las noticias se marcan `confirmed` y no `verified`: son artículos de terceros
 * recuperados por API, no comunicados oficiales del proveedor de IA como los
 * feeds de `official-feed`. La distinción se conserva en la interfaz.
 */

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// ---------------------------------------------------------------------------
// The Guardian — Content API
// ---------------------------------------------------------------------------

const guardianSchema = z.object({
  response: z
    .object({
      results: z.array(z.record(z.string(), z.unknown())).optional(),
    })
    .optional(),
});

export function normalizeGuardian(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = guardianSchema.safeParse(payload);
  if (!parsed.success) return [];
  return (parsed.data.response?.results ?? []).flatMap((entry) => {
    const id = text(entry.id);
    const url = text(entry.webUrl);
    if (!id || !url) return [];
    const fields = (entry.fields ?? {}) as Record<string, unknown>;
    return [
      {
        sourceId: "guardian",
        recordKind: "news" as const,
        externalId: id,
        title: text(entry.webTitle) ?? "Artículo sin título informado",
        summary: plainText(fields.trailText),
        originalUrl: url,
        sourceName: "The Guardian",
        sourceType: "press_agregator",
        publishedAt: text(entry.webPublicationDate),
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "confirmed" as const,
        confidenceLevel: "high" as const,
        language: "en",
        countryRegion: "Reino Unido",
        lastSuccessfulSyncAt: now,
        providerId: null,
        data: {
          section: text(entry.sectionName),
          byline: text(fields.byline),
          contentType: text(entry.type),
          publisher: "The Guardian",
        },
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// NewsAPI — /v2/everything
// ---------------------------------------------------------------------------

const newsApiSchema = z.object({
  articles: z.array(z.record(z.string(), z.unknown())).optional(),
});

export function normalizeNewsApi(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = newsApiSchema.safeParse(payload);
  if (!parsed.success) return [];
  return (parsed.data.articles ?? []).flatMap((entry) => {
    const url = text(entry.url);
    const title = text(entry.title);
    // NewsAPI marca los artículos retirados como «[Removed]»: no se indexan.
    if (!url || !title || title === "[Removed]") return [];
    const source = (entry.source ?? {}) as Record<string, unknown>;
    const publisher = text(source.name);
    return [
      {
        sourceId: "newsapi",
        recordKind: "news" as const,
        // La URL es el único identificador estable que devuelve NewsAPI.
        externalId: url,
        title,
        summary: plainText(entry.description),
        originalUrl: url,
        sourceName: publisher ? `NewsAPI · ${publisher}` : "NewsAPI",
        sourceType: "press_agregator",
        publishedAt: text(entry.publishedAt),
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "confirmed" as const,
        confidenceLevel: "medium" as const,
        language: null,
        countryRegion: null,
        lastSuccessfulSyncAt: now,
        providerId: null,
        data: {
          publisher,
          author: text(entry.author),
          imageUrl: text(entry.urlToImage),
          // El plan gratuito trunca el cuerpo: se guarda lo que llega, sin
          // presentarlo como el artículo completo.
          excerpt: plainText(entry.content),
        },
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// FRED — series económicas oficiales
// ---------------------------------------------------------------------------

const fredSchema = z.object({
  observations: z
    .array(
      z
        .object({ date: z.string().optional(), value: z.string().optional() })
        .passthrough(),
    )
    .optional(),
});

export type FredSeries = {
  id: string;
  title: string;
  unit: string;
  /** Qué aporta la serie al observatorio, en una línea. */
  note: string;
};

export function normalizeFred(
  payload: unknown,
  series: FredSeries,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = fredSchema.safeParse(payload);
  if (!parsed.success) return [];
  return (parsed.data.observations ?? []).flatMap((entry) => {
    const date = text(entry.date);
    const raw = text(entry.value);
    // FRED usa "." para los periodos sin dato publicado: no se rellenan.
    if (!date || !raw || raw === ".") return [];
    const value = Number(raw);
    if (!Number.isFinite(value)) return [];
    return [
      {
        sourceId: "fred",
        recordKind: "economic_indicator" as const,
        externalId: `${series.id}:${date}`,
        title: `${series.title} — ${date}`,
        summary: series.note,
        originalUrl: `https://fred.stlouisfed.org/series/${series.id}`,
        sourceName: "FRED (Reserva Federal de San Luis)",
        sourceType: "official_economic_series",
        publishedAt: date,
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "verified" as const,
        confidenceLevel: "high" as const,
        language: "en",
        countryRegion: "Estados Unidos",
        lastSuccessfulSyncAt: now,
        providerId: null,
        data: {
          indicatorType: "macro_series",
          seriesId: series.id,
          seriesTitle: series.title,
          value,
          unit: series.unit,
          referenceDate: date,
        },
      },
    ];
  });
}
