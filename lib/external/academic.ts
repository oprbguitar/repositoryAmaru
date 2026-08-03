import { z } from "zod";
import { plainText } from "./normalizers";
import type { NormalizedExternalRecord } from "./types";

/**
 * Normalizadores de índices académicos adicionales: Europe PMC, DOAJ, DBLP,
 * Semantic Scholar y CORE.
 *
 * Todos emiten registros `paper` con la misma forma que arXiv, OpenAlex y
 * Crossref, de modo que los filtros por tipo, fuente y fecha del módulo
 * Investigación funcionan sin casos especiales. Ningún campo se rellena por
 * inferencia: lo que la fuente no informa queda en null.
 */

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Identificador que la fuente puede entregar como cadena o como número. */
function identifier(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return text(value);
}

/** Convierte un año suelto en fecha ISO solo cuando no hay fecha completa. */
function yearToIso(year: unknown): string | null {
  const parsed = Number(text(year) ?? year);
  if (!Number.isInteger(parsed) || parsed < 1500 || parsed > 2200) return null;
  return `${parsed}-01-01`;
}

function isoDate(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** DBLP y DOAJ devuelven un objeto suelto cuando la lista tiene un elemento. */
function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === null || value === undefined ? [] : [value];
}

/**
 * Cada índice nombra los tipos de documento a su manera («Journal Article»,
 * «research article», «journal-article»). Se llevan todos al mismo vocabulario
 * para que el filtro por tipo del módulo Investigación no muestre la misma
 * categoría varias veces escrita de forma distinta. Un tipo desconocido se
 * conserva en forma canónica en lugar de aplastarlo a «otro»: la fuente sabe
 * algo que este mapa todavía no.
 */
export function canonicalEvidenceType(raw: unknown): string {
  const value = text(raw);
  if (!value) return "unknown";
  const slug = value
    .toLowerCase()
    .trim()
    .replaceAll(/[\s_]+/g, "-");
  const synonyms: Record<string, string> = {
    "journal-article": "journal-article",
    journalarticle: "journal-article",
    "research-article": "journal-article",
    research: "journal-article",
    article: "article",
    "conference-paper": "conference-paper",
    "conference-and-workshop-papers": "conference-paper",
    conferencepaper: "conference-paper",
    "proceedings-article": "conference-paper",
    "book-chapter": "book-chapter",
    bookchapter: "book-chapter",
    "posted-content": "preprint",
    preprint: "preprint",
    thesis: "dissertation",
    dissertation: "dissertation",
    "review-article": "review",
    review: "review",
  };
  return synonyms[slug] ?? slug;
}

// ---------------------------------------------------------------------------
// Europe PMC (sin credencial)
// ---------------------------------------------------------------------------

const europePmcSchema = z.object({
  resultList: z
    .object({ result: z.array(z.record(z.string(), z.unknown())) })
    .optional(),
});

export function normalizeEuropePmc(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = europePmcSchema.safeParse(payload);
  if (!parsed.success) return [];
  return (parsed.data.resultList?.result ?? []).flatMap((entry) => {
    const id = text(entry.id);
    const source = text(entry.source) ?? "MED";
    if (!id) return [];
    const doi = text(entry.doi);
    const pubTypes = toArray(
      (entry.pubTypeList as Record<string, unknown> | undefined)?.pubType,
    )
      .map((item) => text(item))
      .filter((item): item is string => item !== null);
    return [
      {
        sourceId: "europe-pmc",
        recordKind: "paper" as const,
        externalId: `${source}:${id}`,
        title: text(entry.title) ?? "Publicación sin título informado",
        summary: plainText(entry.abstractText),
        originalUrl: `https://europepmc.org/article/${source}/${id}`,
        sourceName: "Europe PMC",
        sourceType: "academic_index",
        publishedAt:
          isoDate(entry.firstPublicationDate) ?? yearToIso(entry.pubYear),
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "confirmed" as const,
        confidenceLevel: "high" as const,
        language: text(entry.language),
        countryRegion: null,
        lastSuccessfulSyncAt: now,
        providerId: null,
        data: {
          doi,
          pmid: text(entry.pmid),
          pmcid: text(entry.pmcid),
          // `authorString` llega como una sola cadena separada por comas.
          authors: (text(entry.authorString) ?? "")
            .split(",")
            .map((item) => item.trim().replace(/\.$/, ""))
            .filter(Boolean),
          venue: text(entry.journalTitle),
          citationCount: count(entry.citedByCount),
          openAccess: entry.isOpenAccess === "Y",
          evidenceType: canonicalEvidenceType(pubTypes[0] ?? "journal-article"),
          publicationTypes: pubTypes,
        },
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// DOAJ — Directory of Open Access Journals (sin credencial)
// ---------------------------------------------------------------------------

const doajSchema = z.object({
  results: z.array(
    z
      .object({
        id: z.string().optional(),
        bibjson: z.record(z.string(), z.unknown()).optional(),
      })
      .passthrough(),
  ),
});

export function normalizeDoaj(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = doajSchema.safeParse(payload);
  if (!parsed.success) return [];
  return parsed.data.results.flatMap((entry) => {
    const bib = entry.bibjson ?? {};
    const id = text(entry.id);
    if (!id) return [];
    const identifiers = toArray(bib.identifier).map(
      (item) => item as Record<string, unknown>,
    );
    const doi = text(identifiers.find((item) => text(item.type) === "doi")?.id);
    const links = toArray(bib.link).map(
      (item) => item as Record<string, unknown>,
    );
    const fullText = text(
      links.find((item) => text(item.type) === "fulltext")?.url,
    );
    const journal = (bib.journal ?? {}) as Record<string, unknown>;
    const month = text(bib.month);
    const year = text(bib.year);
    return [
      {
        sourceId: "doaj",
        recordKind: "paper" as const,
        externalId: id,
        title: text(bib.title) ?? "Artículo sin título informado",
        summary: plainText(bib.abstract),
        originalUrl: fullText ?? `https://doaj.org/article/${id}`,
        sourceName: "DOAJ",
        sourceType: "open_access_index",
        // DOAJ informa año y mes por separado; sin mes se usa enero declarado.
        publishedAt: year
          ? `${year}-${(month ?? "01").padStart(2, "0")}-01`
          : null,
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "confirmed" as const,
        confidenceLevel: "high" as const,
        language:
          toArray(journal.language).map((item) => text(item))[0] ?? null,
        countryRegion: text(journal.country),
        lastSuccessfulSyncAt: now,
        providerId: null,
        data: {
          doi,
          authors: toArray(bib.author)
            .map((item) => text((item as Record<string, unknown>).name))
            .filter((item): item is string => item !== null),
          venue: text(journal.title),
          publisher: text(journal.publisher),
          keywords: toArray(bib.keywords)
            .map((item) => text(item))
            .filter((item): item is string => item !== null)
            .slice(0, 8),
          // Todo lo indexado en DOAJ es acceso abierto revisado por pares.
          openAccess: true,
          citationCount: null,
          evidenceType: "journal-article",
        },
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// DBLP — bibliografía de ciencias de la computación (sin credencial)
// ---------------------------------------------------------------------------

const dblpSchema = z.object({
  result: z
    .object({
      hits: z.object({ hit: z.unknown().optional() }).passthrough().optional(),
    })
    .passthrough(),
});

/** «Journal Articles» → `journal-article`, para compartir el filtro de tipo. */
function dblpEvidenceType(value: string | null): string {
  const mapping: Record<string, string> = {
    "journal articles": "journal-article",
    "conference and workshop papers": "conference-paper",
    "informal and other publications": "preprint",
    "books and theses": "book",
    "parts in books or collections": "book-chapter",
    editorship: "edited-book",
  };
  const key = (value ?? "").toLowerCase();
  return mapping[key] ?? "other";
}

export function normalizeDblp(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = dblpSchema.safeParse(payload);
  if (!parsed.success) return [];
  return toArray(parsed.data.result.hits?.hit).flatMap((raw) => {
    const info = ((raw as Record<string, unknown>).info ?? {}) as Record<
      string,
      unknown
    >;
    const key = text(info.key);
    const title = text(info.title);
    if (!key || !title) return [];
    const authors = toArray(
      (info.authors as Record<string, unknown> | undefined)?.author,
    )
      .map((item) => text((item as Record<string, unknown>).text))
      // DBLP desambigua homónimos con un sufijo numérico: «Mingliang Xu 0001».
      .map((item) => item?.replace(/\s+\d{4}$/, "") ?? null)
      .filter((item): item is string => item !== null);
    const type = text(info.type);
    return [
      {
        sourceId: "dblp",
        recordKind: "paper" as const,
        externalId: key,
        title: title.replace(/\.$/, ""),
        // DBLP es un índice bibliográfico: no distribuye resúmenes.
        summary: null,
        originalUrl:
          text(info.url) ?? text(info.ee) ?? `https://dblp.org/rec/${key}`,
        sourceName: "DBLP",
        sourceType: "bibliography_index",
        publishedAt: yearToIso(info.year),
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "confirmed" as const,
        confidenceLevel: "high" as const,
        language: null,
        countryRegion: null,
        lastSuccessfulSyncAt: now,
        providerId: null,
        data: {
          doi: text(info.doi),
          authors,
          venue: text(info.venue),
          volume: text(info.volume),
          pages: text(info.pages),
          openAccess: text(info.access) === "open",
          citationCount: null,
          evidenceType: dblpEvidenceType(type),
          dblpType: type,
        },
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Semantic Scholar (clave gratuita; sin ella la API limita a 429)
// ---------------------------------------------------------------------------

const semanticScholarSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).optional(),
});

export function normalizeSemanticScholar(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = semanticScholarSchema.safeParse(payload);
  if (!parsed.success) return [];
  return (parsed.data.data ?? []).flatMap((entry) => {
    const paperId = text(entry.paperId);
    if (!paperId) return [];
    const externalIds = (entry.externalIds ?? {}) as Record<string, unknown>;
    const types = toArray(entry.publicationTypes)
      .map((item) => text(item))
      .filter((item): item is string => item !== null);
    const openAccessPdf = (entry.openAccessPdf ?? {}) as Record<
      string,
      unknown
    >;
    return [
      {
        sourceId: "semantic-scholar",
        recordKind: "paper" as const,
        externalId: paperId,
        title: text(entry.title) ?? "Publicación sin título informado",
        summary: plainText(entry.abstract),
        originalUrl:
          text(entry.url) ?? `https://www.semanticscholar.org/paper/${paperId}`,
        sourceName: "Semantic Scholar",
        sourceType: "academic_index",
        publishedAt: isoDate(entry.publicationDate) ?? yearToIso(entry.year),
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "confirmed" as const,
        confidenceLevel: "high" as const,
        language: null,
        countryRegion: null,
        lastSuccessfulSyncAt: now,
        providerId: null,
        data: {
          doi: text(externalIds.DOI),
          arxivId: text(externalIds.ArXiv),
          authors: toArray(entry.authors)
            .map((item) => text((item as Record<string, unknown>).name))
            .filter((item): item is string => item !== null),
          venue: text(entry.venue),
          citationCount: count(entry.citationCount),
          openAccess: Boolean(text(openAccessPdf.url)),
          openAccessPdfUrl: text(openAccessPdf.url),
          evidenceType: canonicalEvidenceType(types[0]),
          publicationTypes: types,
        },
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// CORE — agregador de repositorios de acceso abierto (clave gratuita)
// ---------------------------------------------------------------------------

const coreSchema = z.object({
  results: z.array(z.record(z.string(), z.unknown())).optional(),
});

export function normalizeCore(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = coreSchema.safeParse(payload);
  if (!parsed.success) return [];
  return (parsed.data.results ?? []).flatMap((entry) => {
    // CORE numera sus obras: `id` llega como número, no como cadena. Exigir
    // una cadena descartaba en silencio todos los resultados.
    const id = identifier(entry.id) ?? identifier(entry.coreId);
    const title = text(entry.title);
    if (!id || !title) return [];
    const language = (entry.language ?? {}) as Record<string, unknown>;
    const links = toArray(entry.links).map(
      (item) => item as Record<string, unknown>,
    );
    const linkOfType = (type: string) =>
      text(links.find((item) => text(item.type) === type)?.url);
    const doi = text(entry.doi);
    // `downloadUrl` redirige a un blob firmado que caduca: al abrirlo días
    // después CORE responde «BlobNotFound». El enlace estable es la página de
    // la obra (`links[type=display]`), así que ese es el enlace principal y el
    // PDF queda como dato secundario, declarado como lo que es.
    const downloadUrl = linkOfType("download") ?? text(entry.downloadUrl);
    return [
      {
        sourceId: "core",
        recordKind: "paper" as const,
        externalId: id,
        title,
        summary: plainText(entry.abstract),
        originalUrl: linkOfType("display") ?? `https://core.ac.uk/works/${id}`,
        sourceName: "CORE",
        sourceType: "open_access_index",
        publishedAt:
          isoDate(entry.publishedDate) ?? yearToIso(entry.yearPublished),
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "confirmed" as const,
        confidenceLevel: "medium" as const,
        language: text(language.code),
        countryRegion: null,
        lastSuccessfulSyncAt: now,
        providerId: null,
        data: {
          doi,
          doiUrl: doi ? `https://doi.org/${doi}` : null,
          authors: toArray(entry.authors)
            .map((item) => text((item as Record<string, unknown>).name))
            .filter((item): item is string => item !== null),
          publisher: text(entry.publisher),
          // Enlace temporal al PDF alojado por CORE: puede caducar.
          pdfUrl: downloadUrl,
          // PDF en el repositorio de origen, que no depende de CORE.
          repositoryUrl: toArray(entry.sourceFulltextUrls)
            .map((item) => text(item))
            .find((item): item is string => item !== null),
          // CORE agrega repositorios institucionales: todo es acceso abierto.
          openAccess: true,
          citationCount: null,
          evidenceType: canonicalEvidenceType(entry.documentType),
        },
      },
    ];
  });
}
