export type VerificationStatus =
  | "verified"
  | "confirmed"
  | "provisional"
  | "inferred"
  | "unverified";

export type ConfidenceLevel = "high" | "medium" | "low";

export type NormalizedExternalRecord = {
  sourceId: string;
  recordKind:
    | "model"
    | "dataset"
    | "space"
    | "paper"
    | "repository"
    | "news"
    | "filing"
    | "economic_indicator";
  externalId: string;
  title: string;
  summary: string | null;
  originalUrl: string;
  sourceName: string;
  sourceType: string;
  publishedAt: string | null;
  detectedAt: string;
  retrievedAt: string;
  verificationStatus: VerificationStatus;
  confidenceLevel: ConfidenceLevel;
  language: string | null;
  countryRegion: string | null;
  lastSuccessfulSyncAt: string;
  providerId: string | null;
  data: Record<string, unknown>;
};

export type AdapterResult = {
  records: NormalizedExternalRecord[];
  httpStatus: number;
  rateLimitRemaining: number | null;
};
