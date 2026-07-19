import { z } from "zod";

const statusSchema = z.enum([
  "processed",
  "warning",
  "rejected",
  "unsupported",
]);

export const localDocumentSchema = z.object({
  id: z.string().min(8).max(128),
  relativePath: z.string().min(1).max(1024),
  fileName: z.string().min(1).max(255),
  extension: z.string().max(24),
  mimeType: z.string().min(1).max(128),
  sizeBytes: z
    .number()
    .int()
    .nonnegative()
    .max(1024 * 1024 * 100),
  modifiedAt: z.iso.datetime(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  parserName: z.string().min(1).max(80),
  parserVersion: z.string().min(1).max(32),
  ingestionStatus: statusSchema,
  ingestedAt: z.iso.datetime(),
  lastError: z.string().max(1000).nullable(),
  detectedTitle: z.string().max(500).nullable(),
  summary: z.string().max(4000).nullable(),
  extractedText: z.string().max(500_000).nullable().optional(),
  tags: z.array(z.string().min(1).max(80)).max(40),
  origin: z.string().max(500).nullable(),
  sourceAlias: z.string().min(1).max(120),
  isRelevant: z.boolean(),
  inWatchlist: z.boolean(),
  rawContentBase64: z.string().max(70_000_000).optional(),
});

export const importBatchSchema = z.object({
  runId: z.string().min(8).max(128),
  sourceAlias: z.string().min(1).max(120),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
  discoveredCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
  warningCount: z.number().int().nonnegative(),
  documents: z.array(localDocumentSchema).max(250),
});

export type ValidatedImportBatch = z.infer<typeof importBatchSchema>;
