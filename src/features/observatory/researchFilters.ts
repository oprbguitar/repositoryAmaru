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
    }[value] ?? value.replaceAll("-", " ")
  );
}

function recordTimestamp(record: ObservatoryRecord): number {
  if (!record.publishedAt) return Number.NaN;
  return new Date(record.publishedAt).getTime();
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
