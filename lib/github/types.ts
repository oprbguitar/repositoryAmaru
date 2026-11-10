/** Shared shapes for the GitHub explorer (worker responses and UI). */

export type RateLimitInfo = {
  limit: number | null;
  remaining: number | null;
  /** ISO timestamp when the window resets. */
  resetAt: string | null;
  resource: string | null;
};

export type RepoSummary = {
  /** True for private repos (only visible with an authorized token). */
  isPrivate?: boolean;
  id: number;
  fullName: string;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  license: { spdxId: string | null; name: string } | null;
  topics: string[];
  pushedAt: string | null;
  createdAt: string | null;
  archived: boolean;
  fork: boolean;
  isTemplate: boolean;
  homepage: string | null;
  defaultBranch: string;
  ownerType: "User" | "Organization" | "Other";
  ownerAvatar: string | null;
  hasPages: boolean;
};

export type SearchResult = {
  query: string;
  sort: SearchSort;
  page: number;
  perPage: number;
  totalCount: number;
  incomplete: boolean;
  items: RepoSummary[];
  fetchedAt: string;
  /** True when GitHub was unreachable or limited and a cached copy was served. */
  stale: boolean;
};

export type SearchSort = "stars" | "updated" | "forks" | "best-match";

export type LanguageShare = { name: string; bytes: number; percent: number };

export type ReleaseInfo = {
  tag: string;
  name: string | null;
  publishedAt: string | null;
  prerelease: boolean;
  draft: boolean;
  url: string;
};

export type ContributorInfo = {
  login: string;
  contributions: number;
  avatar: string | null;
  url: string;
  isBot: boolean;
};

export type OrgInfo = {
  login: string;
  name: string | null;
  isVerified: boolean;
  blog: string | null;
  publicRepos: number | null;
  followers: number | null;
};

export type SignalState = "ok" | "warn" | "bad" | "na";

export type VerificationSignal = {
  id: "organization" | "license" | "activity" | "archived" | "releases";
  label: string;
  state: SignalState;
  detail: string;
  /** GitHub API endpoint the evidence comes from. */
  source: string;
};

export type RepoDetail = {
  repo: RepoSummary & {
    subscribers: number | null;
    sizeKb: number | null;
    networkCount: number | null;
  };
  languages: LanguageShare[];
  releases: ReleaseInfo[];
  contributors: ContributorInfo[];
  org: OrgInfo | null;
  signals: VerificationSignal[];
  preview: { homepage: string | null; pagesUrl: string | null };
  /** Sections that failed to load (for example because of the rate limit). */
  missing: string[];
  fetchedAt: string;
  stale: boolean;
};

export type TreeEntry = {
  path: string;
  type: "blob" | "tree";
  size: number | null;
};

export type TreeResult = {
  ref: string;
  entries: TreeEntry[];
  truncated: boolean;
  total: number;
  fetchedAt: string;
};

export type FileResult = {
  path: string;
  ref: string;
  size: number;
  kind: "text" | "binary" | "too-large";
  text: string | null;
  /** HTML rendered by GitHub for Markdown files (still unsanitized). */
  html: string | null;
  truncated: boolean;
  fetchedAt: string;
};

export type ReadmeResult = {
  path: string | null;
  html: string | null;
  ref: string;
  fetchedAt: string;
};

export type GithubStatus = {
  tokenConfigured: boolean;
  /** Present when GitHub answered the /rate_limit probe. */
  core: RateLimitInfo | null;
  search: RateLimitInfo | null;
  checkedAt: string;
  reachable: boolean;
};

export type PreviewCheck = {
  url: string;
  embeddable: boolean;
  status: number | null;
  reason: string | null;
};

/** Structured, validated search specification (never a raw query string). */
export type QuerySpec = {
  /** All of these topics must match (AND). */
  topics?: string[];
  /** At least one of these topics must match (OR). */
  anyTopics?: string[];
  /** Free-text keywords matched in name, description and README. */
  keywords?: string[];
  language?: string;
  minStars?: number;
  /** Only repositories pushed in the last N days. */
  pushedWithinDays?: number;
  includeArchived?: boolean;
  /** Restrict to a license key such as "mit". */
  license?: string;
};
