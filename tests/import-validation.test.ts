import { describe, expect, it } from "vitest";
import { importBatchSchema } from "../lib/validation/local-import";

const validDocument = {
  id: "document-123456",
  relativePath: "papers/nota.md",
  fileName: "nota.md",
  extension: "md",
  mimeType: "text/markdown",
  sizeBytes: 10,
  modifiedAt: "2026-07-18T12:00:00.000Z",
  sha256: "a".repeat(64),
  parserName: "plain-text",
  parserVersion: "1.0.0",
  ingestionStatus: "processed",
  ingestedAt: "2026-07-18T12:01:00.000Z",
  lastError: null,
  detectedTitle: "Nota",
  summary: "Resumen",
  extractedText: "Contenido seguro",
  tags: ["prueba"],
  origin: null,
  sourceAlias: "Biblioteca local",
  isRelevant: false,
  inWatchlist: false,
};

describe("local import contract", () => {
  it("accepts a normalized import batch", () => {
    const result = importBatchSchema.safeParse({
      runId: "run-12345678",
      sourceAlias: "Biblioteca local",
      startedAt: "2026-07-18T12:00:00.000Z",
      completedAt: "2026-07-18T12:01:00.000Z",
      discoveredCount: 1,
      skippedCount: 0,
      rejectedCount: 0,
      warningCount: 0,
      documents: [validDocument],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid hashes and oversized metadata", () => {
    const result = importBatchSchema.safeParse({
      runId: "run-12345678",
      sourceAlias: "Biblioteca local",
      startedAt: "2026-07-18T12:00:00.000Z",
      completedAt: "2026-07-18T12:01:00.000Z",
      discoveredCount: 1,
      skippedCount: 0,
      rejectedCount: 0,
      warningCount: 0,
      documents: [
        { ...validDocument, sha256: "unsafe", relativePath: "../secret" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
