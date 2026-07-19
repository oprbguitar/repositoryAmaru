import { describe, expect, it } from "vitest";
import { newestNewsFirst } from "../src/features/observatory/newsSort";
import type { ObservatoryRecord } from "../types/api";

function news(
  id: string,
  publishedAt: string | null,
  detectedAt: string,
): ObservatoryRecord {
  return {
    id,
    sourceId: "official-news",
    recordKind: "news",
    externalId: id,
    title: id,
    summary: null,
    originalUrl: `https://example.test/${id}`,
    sourceName: "Official feed",
    sourceType: "official_feed",
    publishedAt,
    detectedAt,
    retrievedAt: detectedAt,
    verificationStatus: "verified",
    confidenceLevel: "high",
    language: "en",
    countryRegion: null,
    lastSuccessfulSyncAt: detectedAt,
    providerId: null,
    isStale: false,
    data: {},
  };
}

describe("news ordering", () => {
  it("orders by publication date from newest to oldest", () => {
    const result = newestNewsFirst([
      news("older", "2026-07-10T00:00:00Z", "2026-07-11T00:00:00Z"),
      news("newer", "2026-07-18T00:00:00Z", "2026-07-18T01:00:00Z"),
    ]);
    expect(result.map((item) => item.id)).toEqual(["newer", "older"]);
  });

  it("falls back to detection time when publication is missing", () => {
    const result = newestNewsFirst([
      news("published", "2026-07-12T00:00:00Z", "2026-07-12T00:00:00Z"),
      news("detected", null, "2026-07-19T00:00:00Z"),
    ]);
    expect(result[0]?.id).toBe("detected");
  });
});
