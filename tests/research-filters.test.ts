import { describe, expect, it } from "vitest";
import {
  evidenceTypeLabel,
  filterResearchRecords,
  type ResearchFilters,
} from "../src/features/observatory/researchFilters";
import type { ObservatoryRecord } from "../types/api";

function record(
  id: string,
  sourceId: string,
  publishedAt: string,
  type: string,
  title = id,
): ObservatoryRecord {
  return {
    id,
    sourceId,
    recordKind: "paper",
    externalId: id,
    title,
    summary: null,
    originalUrl: `https://example.test/${id}`,
    sourceName: sourceId,
    sourceType: "academic",
    publishedAt,
    detectedAt: publishedAt,
    retrievedAt: publishedAt,
    verificationStatus: "confirmed",
    confidenceLevel: "high",
    language: "en",
    countryRegion: null,
    lastSuccessfulSyncAt: publishedAt,
    providerId: null,
    isStale: false,
    data: { evidenceType: type, authors: ["Ada Lovelace"] },
  };
}

const baseFilters: ResearchFilters = {
  query: "",
  dateRange: "all",
  evidenceType: "all",
  source: "all",
  sort: "newest",
};

describe("research filters", () => {
  const records = [
    record("recent-preprint", "arxiv", "2026-07-17T00:00:00Z", "preprint"),
    record(
      "older-article",
      "crossref",
      "2026-05-01T00:00:00Z",
      "journal-article",
      "Transparent AI",
    ),
    record("middle-thesis", "openalex", "2026-07-01T00:00:00Z", "dissertation"),
  ];

  it("combines date, type, and source filters", () => {
    const result = filterResearchRecords(
      records,
      {
        ...baseFilters,
        dateRange: "30d",
        evidenceType: "preprint",
        source: "arxiv",
      },
      new Date("2026-07-18T00:00:00Z"),
    );

    expect(result.map((item) => item.id)).toEqual(["recent-preprint"]);
  });

  it("does not mix future-dated metadata into recent publication ranges", () => {
    const future = record(
      "future-metadata",
      "openalex",
      "2049-12-31T00:00:00Z",
      "article",
    );
    const result = filterResearchRecords(
      [...records, future],
      { ...baseFilters, dateRange: "30d" },
      new Date("2026-07-18T00:00:00Z"),
    );

    expect(result.map((item) => item.id)).not.toContain("future-metadata");
  });

  it("searches title and authors and sorts oldest first", () => {
    expect(
      filterResearchRecords(records, {
        ...baseFilters,
        query: "Ada Lovelace",
        sort: "oldest",
      }).map((item) => item.id),
    ).toEqual(["older-article", "middle-thesis", "recent-preprint"]);
  });

  it("uses clear Spanish labels without changing source metadata", () => {
    expect(evidenceTypeLabel("journal-article")).toBe("Artículo de revista");
    expect(evidenceTypeLabel("custom-output")).toBe("custom output");
  });
});
