export type ApiError = {
  code: string;
  message: string;
  sourceId?: string;
  providerCode?: string;
  retryAfterSeconds?: number;
};

export type ApiResponse<T> = {
  data: T;
  meta: {
    requestId: string;
    generatedAt: string;
    sourceStatus?: string;
    providerId?: string;
    modelId?: string;
    nextCursor?: string;
    total?: number;
    stale?: boolean;
  };
  errors?: ApiError[];
};

export type IngestionStatus =
  | "processed"
  | "warning"
  | "rejected"
  | "unsupported";

export type LocalDocument = {
  id: string;
  relativePath: string;
  fileName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  modifiedAt: string;
  sha256: string;
  parserName: string;
  parserVersion: string;
  ingestionStatus: IngestionStatus;
  ingestedAt: string;
  lastError: string | null;
  detectedTitle: string | null;
  summary: string | null;
  extractedText?: string | null;
  tags: string[];
  origin: string | null;
  sourceAlias: string;
  isRelevant: boolean;
  inWatchlist: boolean;
};

export type DocumentAnalysis = {
  documentId: string;
  model: string;
  generatedAt: string;
  summary: string;
  keyPoints: string[];
  entities: string[];
  risks: string[];
  recommendations: string[];
};

export type LibraryStats = {
  discovered: number;
  processed: number;
  rejected: number;
  warnings: number;
  unsupported: number;
  lastScanAt: string | null;
  directoryAlias: string;
  databaseStatus: "ready" | "needs_migration" | "unavailable";
  objectStorageStatus: "ready" | "unavailable";
  cacheStatus: "ready" | "unavailable";
  types: Array<{ label: string; count: number }>;
};

export type ObservatoryRecord = {
  id: string;
  sourceId: string;
  recordKind: string;
  externalId: string;
  title: string;
  summary: string | null;
  originalUrl: string;
  sourceName: string;
  sourceType: string;
  publishedAt: string | null;
  detectedAt: string;
  retrievedAt: string;
  verificationStatus:
    | "verified"
    | "confirmed"
    | "provisional"
    | "inferred"
    | "unverified";
  confidenceLevel: "high" | "medium" | "low";
  language: string | null;
  countryRegion: string | null;
  lastSuccessfulSyncAt: string;
  providerId: string | null;
  isStale: boolean;
  data: Record<string, unknown>;
};

export type ProviderRecord = {
  id: string;
  name: string;
  country: string | null;
  categories: string[];
  apiAvailable: boolean;
  freeTierStatus: string | null;
  localExecutionAvailable: boolean;
  modelCount: number;
  lastSuccessfulSync: string | null;
  sourceConfidence: string | null;
  integrationStatus: string;
  links: Record<string, string | null>;
};

export type SourceHealth = {
  id: string;
  name: string;
  category: string | null;
  endpoint: string | null;
  isOfficial: boolean;
  enabled: boolean;
  authenticationType: string;
  secretBindingName: string | null;
  credentialConfigured: boolean;
  status: string;
  lastRequestAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  lastHttpStatus: number | null;
  recordCount: number;
  dailyRequestEstimate: number;
  rateLimitRemaining: number | null;
  trustLevel: string;
};

export type ObservatoryDashboard = {
  providers: number;
  models: number;
  papers: number;
  repositories: number;
  news: number;
  filings: number;
  economicIndicators: number;
  failedSources: number;
  sourcesRequiringCredentials: number;
  staleSources: number;
  lastSuccessfulSyncAt: string | null;
  recent: ObservatoryRecord[];
};

export type LiveEvent = {
  id: string;
  eventType: string;
  recordId: string | null;
  title: string;
  eventAt: string;
  sourceName: string;
  targetPath: string;
};

export type SynchronizationSummary = {
  runId: string;
  sourceId: string;
  status: string;
  discovered: number;
  stored: number;
  changed: number;
  error: string | null;
};

export type CountryAggregate = {
  countryCode: string;
  countryName: string;
  papers: number;
  providers: number;
  models: number;
  institutions: number;
  repositories: number;
  news: number;
  total: number;
};

export type MapGeoJson = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: Record<string, unknown>;
  }>;
};

export type MapResponse = {
  geojson: MapGeoJson;
  countries: CountryAggregate[];
  coverage: {
    institutionCount: number;
    pendingSources?: string[];
    note: string;
  };
};

export type CountryPanelData = {
  country: { code: string; name: string };
  aggregate: CountryAggregate;
  recentPapers: Array<{
    title: string;
    url: string;
    publishedAt: string | null;
    sourceName: string;
  }>;
  institutions: Array<{
    name: string;
    city: string | null;
    worksCount: number | null;
    homepageUrl: string | null;
  }>;
  providers: Array<{ id: string; name: string }>;
  recentActivity30d: { records: number; label: string; note: string };
  sources: string[];
};

export type ModelRankingEntry = {
  capabilities: CapabilityTag[];
  modelExternalId: string;
  modelTitle: string;
  position: number;
  score: number | null;
  scoreUnit: string | null;
  sourceName: string;
  rankingDate: string;
  methodology: string;
  methodologyUrl: string | null;
  summary: string | null;
  url: string | null;
  contextLength: number | null;
  inputPricePerToken: unknown;
  outputPricePerToken: unknown;
  offeringSummary: {
    providers: number;
    minInputPerMillion: number;
    maxInputPerMillion: number;
    minOutputPerMillion: number;
    verifiedAt: string;
  } | null;
};

export type ModelRankingResponse = {
  type: string;
  available: boolean;
  reason: string | null;
  rankingDate?: string | null;
  entries: ModelRankingEntry[];
};

export type ModelOffering = {
  providerName: string;
  providerModelIdentifier: string | null;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  cachedInputPricePerMillion: number | null;
  contextLength: number | null;
  maxCompletionTokens: number | null;
  quantization: string | null;
  status: string | null;
  pricingSourceName: string;
  verifiedAt: string;
};

export type CapabilityTag = {
  id: string;
  label: string;
  group: "uso" | "modalidad" | "capacidad" | "acceso";
  evidence: string;
};

export type ModelRankingMembership = {
  rankingType: string;
  label: string;
  position: number;
  rankingDate: string;
  methodology: string;
  methodologyUrl: string | null;
  isUsageCategory: boolean;
};

export type ModelDetail = {
  modelExternalId: string;
  modelTitle: string;
  summary: string | null;
  url: string | null;
  contextLength: number | null;
  inputPricePerToken: number | null;
  outputPricePerToken: number | null;
  indexed: boolean;
  capabilities: CapabilityTag[];
  primaryUse: string | null;
  rankings: ModelRankingMembership[];
  offerings: ModelOffering[];
  hostSummary: {
    providers: number;
    minInputPerMillion: number;
    maxInputPerMillion: number;
    verifiedAt: string;
  } | null;
  offeringsNote: string | null;
};

export type ProviderAuthoredModel = {
  modelExternalId: string;
  modelTitle: string;
  summary: string | null;
  url: string | null;
  contextLength: number | null;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  usageRank: {
    category: string;
    position: number;
    rankingDate: string | null;
  } | null;
  capabilities: CapabilityTag[];
  hostCount: number;
};

export type ProviderHostedModel = {
  modelExternalId: string;
  modelTitle: string;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  cachedInputPricePerMillion: number | null;
  contextLength: number | null;
  quantization: string | null;
  status: string | null;
  verifiedAt: string;
};

export type ProviderModelsResponse = {
  providerId: string;
  providerName: string;
  isAggregator: boolean;
  rankingDate: string | null;
  authored: ProviderAuthoredModel[];
  hosted: ProviderHostedModel[];
  links: { models: string | null; pricing: string | null };
  note: string;
};

export type PriceHistoryPoint = {
  date: string;
  pricePerMillion: number;
};

export type PriceHistorySeries = {
  modelExternalId: string;
  modelTitle: string;
  points: PriceHistoryPoint[];
  first: number;
  current: number;
  changePercent: number;
};

export type PriceHistoryResponse = {
  dates: string[];
  series: PriceHistorySeries[];
  observations: number;
  trackedModels: number;
  available: boolean;
  reason: string | null;
  methodology: string;
};

export type GithubRankingEntry = {
  rank: number;
  id: string;
  fullName: string;
  owner: string | null;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  license: string | null;
  topics: string[];
  pushedAt: string | null;
  createdAt: string | null;
  homepage: string | null;
  url: string;
  sourceName: string;
  retrievedAt: string;
  growth: {
    starGrowth: number;
    periodStart: string;
    periodEnd: string;
  } | null;
};

export type GithubRankingResponse = {
  view: string;
  available: boolean;
  reason: string | null;
  entries: GithubRankingEntry[];
};

export type VideoItem = {
  id: string;
  platform: string;
  externalId: string;
  title: string;
  description: string | null;
  channelTitle: string;
  isOfficialChannel: boolean;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  watchUrl: string;
  language: string | null;
  topic: string;
  durationSeconds: number | null;
  viewCount: number | null;
  sourceName: string;
  retrievedAt: string;
};

export type VideoListResponse = {
  items: VideoItem[];
  total: number;
  /** Conteo real por plataforma sobre el total indexado, sin filtros aplicados. */
  platforms: Array<{ platform: string; count: number }>;
  integrations: {
    youtubeConfigured: boolean;
    metaConfigured: boolean;
    xConfigured: boolean;
  };
};

export type IntegrationStatus = {
  binding: string;
  name: string;
  category: string;
  unlocks: string;
  apiKeyUrl: string;
  documentationUrl: string;
  freeTierNote: string;
  configured: boolean;
  storage: "none" | "environment" | "local_encrypted";
  lastFour: string | null;
  updatedAt: string | null;
  lastTestedAt: string | null;
  lastTestStatus: "ok" | "failed" | null;
  lastTestMessage: string | null;
  testable: boolean;
  verified?: string | null;
  probeNote?: string | null;
  needs?: string[];
  minLength?: number;
  sources: Array<{
    id: string;
    status: string;
    lastSuccessAt: string | null;
    recordCount: number;
  }>;
};

export type IntegrationsResponse = {
  categories: Array<{ id: string; label: string; description: string }>;
  items: IntegrationStatus[];
  encryptionConfigured: boolean;
};

export type MarketQuote = {
  symbol: string;
  companyName: string;
  providerId: string | null;
  price: number;
  changeAbsolute: number | null;
  changePercent: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  dayOpen: number | null;
  previousClose: number | null;
  quotedAt: string;
  retrievedAt: string;
  sourceName: string;
  originalUrl: string;
};

export type MarketQuotesResponse = {
  configured: boolean;
  quotes: MarketQuote[];
  /** Motivo textual cuando no hay cotizaciones: nunca se rellena con datos falsos. */
  reason: string | null;
  refreshedAt: string | null;
  fromCache: boolean;
};

export type ImportBatch = {
  runId: string;
  sourceAlias: string;
  startedAt: string;
  completedAt: string;
  discoveredCount: number;
  skippedCount: number;
  rejectedCount: number;
  warningCount: number;
  documents: Array<LocalDocument & { rawContentBase64?: string }>;
};
