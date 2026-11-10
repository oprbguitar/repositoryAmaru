import { describe, expect, it } from "vitest";
import {
  applyView,
  collectTags,
  kindOf,
} from "../src/features/local-library/libraryView";
import type { LocalDocument } from "../types/api";

function doc(id: string, over: Partial<LocalDocument>): LocalDocument {
  return {
    id,
    relativePath: id,
    fileName: `${id}.pdf`,
    extension: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 10,
    modifiedAt: "2026-01-01T00:00:00.000Z",
    sha256: id,
    parserName: "p",
    parserVersion: "1",
    ingestionStatus: "processed",
    ingestedAt: "2026-01-01T00:00:00.000Z",
    lastError: null,
    detectedTitle: null,
    summary: null,
    tags: [],
    origin: null,
    sourceAlias: "x",
    isRelevant: false,
    inWatchlist: false,
    ...over,
  };
}

describe("library view helpers", () => {
  const docs = [
    doc("a", {
      tags: ["ia", "peru"],
      sizeBytes: 5,
      modifiedAt: "2026-02-01T00:00:00.000Z",
    }),
    doc("b", { tags: ["ia"], sizeBytes: 50, extension: "csv" }),
  ];
  it("maps extensions to kinds with a text fallback", () => {
    expect(kindOf("XLSX")).toBe("sheet");
    expect(kindOf("md")).toBe("text");
  });
  it("collects tags by frequency", () => {
    expect(collectTags(docs)).toEqual(["ia", "peru"]);
  });
  it("filters by tag and analysis state and sorts", () => {
    const f = { tag: "", analysis: "analyzed" as const, watchlist: false };
    expect(
      applyView(docs, f, new Set(["b"]), "recent").map((d) => d.id),
    ).toEqual(["b"]);
    const g = { tag: "peru", analysis: "" as const, watchlist: false };
    expect(applyView(docs, g, new Set(), "recent").map((d) => d.id)).toEqual([
      "a",
    ]);
    expect(
      applyView(docs, { ...g, tag: "" }, new Set(), "size").map((d) => d.id),
    ).toEqual(["b", "a"]);
  });
});
