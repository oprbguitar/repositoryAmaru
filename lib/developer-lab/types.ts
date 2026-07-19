import type {
  CredentialState,
  ProviderCategory,
  ProviderLocation,
} from "./registry";

export type CredentialStorage =
  | "environment"
  | "local_encrypted"
  | "temporary_encrypted";

export type CredentialMetadata = {
  providerId: string;
  alias: string;
  lastFour: string;
  state: CredentialState;
  storage: CredentialStorage;
  verifiedAt: string | null;
  lastTestedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DeveloperLabProvider = {
  id: string;
  name: string;
  location: ProviderLocation;
  categories: ProviderCategory[];
  credentialBinding: string | null;
  credential: CredentialMetadata | null;
  modelCount: number;
  lastSuccessfulTest: string | null;
  supports: {
    modelDiscovery: boolean;
    streaming: boolean;
    usageMetadata: boolean;
    quotaInspection: boolean;
    fileUpload: boolean;
    asyncJobs: boolean;
  };
  links: {
    documentation: string;
    pricing: string | null;
    apiKey: string | null;
  };
};

export type TestType = "text" | "reasoning" | "code" | "image" | "video";

export type TestbenchModel = {
  id: string;
  displayName: string;
  contextLength: number | null;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  pricingNote: string | null;
  source: "indexed" | "live" | "curated";
  supportsImageInput: boolean;
  outputKind: "text" | "video";
};

export type TestbenchResult = {
  providerId: string;
  modelId: string;
  testType: TestType;
  outputText: string | null;
  outputFile: { base64: string; mimeType: string } | null;
  usage: { inputTokens: number | null; outputTokens: number | null };
  costUsd: number | null;
  costNote: string;
  latencyMs: number;
  requestId: string;
  finishedAt: string;
};

export type ConnectionTestResult = {
  providerId: string;
  state: CredentialState;
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number;
  modelCount: number | null;
  requestId: string;
  testedAt: string;
  message: string;
};
