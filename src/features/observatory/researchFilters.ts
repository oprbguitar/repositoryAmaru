import type { ObservatoryRecord } from "../../../types/api";

export type ResearchDateRange = "all" | "7d" | "30d" | "365d";
export type ResearchSort = "newest" | "oldest";

export type ResearchFilters = {
  query: string;
  dateRange: ResearchDateRange;
  evidenceType: string;
  source: string;
  sort: ResearchSort;
};

export function evidenceType(record: ObservatoryRecord): string {
  const value = record.data.evidenceType;
  return typeof value === "string" && value.trim() ? value.trim() : "unknown";
}

export function evidenceTypeLabel(value: string): string {
  return (
    {
      article: "Artículo",
      "book-chapter": "Capítulo de libro",
      book: "Libro",
      "conference-paper": "Paper de conferencia",
      dissertation: "Tesis",
      "edited-book": "Libro editado",
      "journal-article": "Artículo de revista",
      monograph: "Monografía",
      other: "Otro",
      paratext: "Material complementario",
      preprint: "Preprint",
      standard: "Estándar",
      unknown: "Tipo no informado",
      // Vocabularios de Europe PMC, DOAJ, DBLP, Semantic Scholar y CORE.
      "posted-content": "Preprint",
      review: "Revisión",
      letter: "Carta al editor",
      editorial: "Editorial",
      report: "Informe",
      "case-reports": "Reporte de caso",
      "clinical-trial": "Ensayo clínico",
      "comparative-study": "Estudio comparativo",
      "multicenter-study": "Estudio multicéntrico",
      "observational-study": "Estudio observacional",
      "validation-study": "Estudio de validación",
      "systematic-review": "Revisión sistemática",
      "meta-analysis": "Metaanálisis",
      dataset: "Conjunto de datos",
    }[value] ?? value.replaceAll("-", " ")
  );
}

function recordTimestamp(record: ObservatoryRecord): number {
  if (!record.publishedAt) return Number.NaN;
  return new Date(record.publishedAt).getTime();
}

/**
 * Algunos índices publican fechas posteriores a hoy (números «in press» o
 * errores de captura en el registro de origen). No se corrigen ni se ocultan:
 * el registro se muestra tal cual y la interfaz avisa de la anomalía, para que
 * quien lo lea sepa que la rareza viene de la fuente y no del observatorio.
 */
export function isFuturePublication(
  record: ObservatoryRecord,
  now = new Date(),
): boolean {
  const timestamp = recordTimestamp(record);
  return !Number.isNaN(timestamp) && timestamp > now.getTime();
}

export function filterResearchRecords(
  records: ObservatoryRecord[],
  filters: ResearchFilters,
  now = new Date(),
): ObservatoryRecord[] {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("es");
  const rangeDays = { all: null, "7d": 7, "30d": 30, "365d": 365 }[
    filters.dateRange
  ];
  const minimumTimestamp =
    rangeDays === null ? null : now.getTime() - rangeDays * 24 * 60 * 60 * 1000;

  return records
    .filter((record) => {
      const authors = Array.isArray(record.data.authors)
        ? record.data.authors.filter((item) => typeof item === "string")
        : [];
      const searchable = [
        record.title,
        record.summary ?? "",
        record.sourceName,
        record.externalId,
        ...authors,
      ]
        .join(" ")
        .toLocaleLowerCase("es");
      const timestamp = recordTimestamp(record);

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (filters.source === "all" || record.sourceId === filters.source) &&
        (filters.evidenceType === "all" ||
          evidenceType(record) === filters.evidenceType) &&
        (minimumTimestamp === null ||
          (!Number.isNaN(timestamp) &&
            timestamp >= minimumTimestamp &&
            timestamp <= now.getTime()))
      );
    })
    .sort((left, right) => {
      const leftTime = recordTimestamp(left);
      const rightTime = recordTimestamp(right);
      const safeLeft = Number.isNaN(leftTime) ? -Infinity : leftTime;
      const safeRight = Number.isNaN(rightTime) ? -Infinity : rightTime;
      return filters.sort === "newest"
        ? safeRight - safeLeft
        : safeLeft - safeRight;
    });
}
