import type {
  ContributorInfo,
  LanguageShare,
  OrgInfo,
  RateLimitInfo,
  ReleaseInfo,
  RepoSummary,
  VerificationSignal,
} from "./types";

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" ? (value as Raw) : {};
const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;
const asNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/** SPDX identifiers of licenses approved by the Open Source Initiative (common subset). */
const OSI_SPDX = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "MPL-2.0",
  "GPL-2.0",
  "GPL-3.0",
  "GPL-2.0-only",
  "GPL-3.0-only",
  "GPL-2.0-or-later",
  "GPL-3.0-or-later",
  "LGPL-2.1",
  "LGPL-3.0",
  "LGPL-2.1-only",
  "LGPL-3.0-only",
  "AGPL-3.0",
  "AGPL-3.0-only",
  "AGPL-3.0-or-later",
  "EPL-2.0",
  "EPL-1.0",
  "Zlib",
  "BSL-1.0",
  "Artistic-2.0",
  "CDDL-1.0",
  "MS-PL",
  "OFL-1.1",
  "PostgreSQL",
  "NCSA",
  "UPL-1.0",
  "0BSD",
  "MIT-0",
  "Unlicense",
]);

export function isOsiLicense(spdxId: string | null | undefined): boolean {
  return !!spdxId && OSI_SPDX.has(spdxId);
}

export function normalizeRepo(value: unknown): RepoSummary {
  const raw = asRecord(value);
  const owner = asRecord(raw.owner);
  const license = asRecord(raw.license);
  const ownerType =
    owner.type === "User" || owner.type === "Organization"
      ? owner.type
      : "Other";
  const spdx = asString(license.spdx_id);
  return {
    id: asNumber(raw.id),
    fullName: asString(raw.full_name) ?? "",
    owner: asString(owner.login) ?? "",
    name: asString(raw.name) ?? "",
    description: asString(raw.description),
    url: asString(raw.html_url) ?? "",
    stars: asNumber(raw.stargazers_count),
    forks: asNumber(raw.forks_count),
    openIssues: asNumber(raw.open_issues_count),
    language: asString(raw.language),
    license: asString(license.name)
      ? {
          spdxId: spdx && spdx !== "NOASSERTION" ? spdx : null,
          name: String(license.name),
        }
      : null,
    topics: Array.isArray(raw.topics)
      ? raw.topics.filter((t): t is string => typeof t === "string")
      : [],
    pushedAt: asString(raw.pushed_at),
    createdAt: asString(raw.created_at),
    archived: raw.archived === true,
    fork: raw.fork === true,
    isPrivate: raw.private === true,
    isTemplate: raw.is_template === true,
    homepage: asString(raw.homepage),
    defaultBranch: asString(raw.default_branch) ?? "main",
    ownerType,
    ownerAvatar: asString(owner.avatar_url),
    hasPages: raw.has_pages === true,
  };
}

export function normalizeLanguages(value: unknown): LanguageShare[] {
  const entries = Object.entries(asRecord(value)).filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === "number" && entry[1] > 0,
  );
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (!total) return [];
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: Math.round((bytes / total) * 1000) / 10,
    }));
}

export function normalizeReleases(value: unknown, limit = 5): ReleaseInfo[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).map((item) => {
    const raw = asRecord(item);
    return {
      tag: asString(raw.tag_name) ?? "",
      name: asString(raw.name),
      publishedAt: asString(raw.published_at),
      prerelease: raw.prerelease === true,
      draft: raw.draft === true,
      url: asString(raw.html_url) ?? "",
    };
  });
}

export function normalizeContributors(
  value: unknown,
  limit = 8,
): ContributorInfo[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asRecord(item))
    .filter((raw) => asString(raw.login))
    .slice(0, limit)
    .map((raw) => ({
      login: String(raw.login),
      contributions: asNumber(raw.contributions),
      avatar: asString(raw.avatar_url),
      url: asString(raw.html_url) ?? "",
      isBot: raw.type === "Bot" || String(raw.login).endsWith("[bot]"),
    }));
}

export function normalizeOrg(value: unknown): OrgInfo | null {
  const raw = asRecord(value);
  const login = asString(raw.login);
  if (!login) return null;
  return {
    login,
    name: asString(raw.name),
    isVerified: raw.is_verified === true,
    blog: asString(raw.blog),
    publicRepos: typeof raw.public_repos === "number" ? raw.public_repos : null,
    followers: typeof raw.followers === "number" ? raw.followers : null,
  };
}

export function parseRateLimit(headers: Headers): RateLimitInfo {
  const number = (name: string) => {
    const header = headers.get(name);
    const parsed = Number(header);
    return header !== null && Number.isFinite(parsed) ? parsed : null;
  };
  const reset = number("x-ratelimit-reset");
  return {
    limit: number("x-ratelimit-limit"),
    remaining: number("x-ratelimit-remaining"),
    resetAt: reset ? new Date(reset * 1000).toISOString() : null,
    resource: headers.get("x-ratelimit-resource"),
  };
}

/** GitHub Pages URL derived from the repository name (not fetched). */
export function derivePagesUrl(
  repo: Pick<RepoSummary, "owner" | "name" | "hasPages">,
): string | null {
  if (!repo.hasPages) return null;
  const host = `${repo.owner.toLowerCase()}.github.io`;
  return repo.name.toLowerCase() === host
    ? `https://${host}/`
    : `https://${host}/${repo.name}/`;
}

const DAY_MS = 86_400_000;

export function buildSignals(input: {
  repo: RepoSummary;
  org: OrgInfo | null;
  releases: ReleaseInfo[];
  now?: Date;
}): VerificationSignal[] {
  const { repo, org, releases } = input;
  const now = input.now ?? new Date();
  const source = `GET /repos/${repo.fullName}`;
  const signals: VerificationSignal[] = [];

  if (repo.ownerType === "Organization") {
    signals.push(
      org
        ? {
            id: "organization",
            label: "Organización verificada",
            state: org.isVerified ? "ok" : "warn",
            detail: org.isVerified
              ? `${org.login} tiene el dominio verificado en GitHub.`
              : `${org.login} es una organización sin dominio verificado.`,
            source: `GET /orgs/${org.login}`,
          }
        : {
            id: "organization",
            label: "Organización verificada",
            state: "na",
            detail: "No se pudo consultar la organización.",
            source: `GET /orgs/${repo.owner}`,
          },
    );
  } else {
    signals.push({
      id: "organization",
      label: "Propietario",
      state: "na",
      detail: "Cuenta personal: GitHub no ofrece verificación para usuarios.",
      source,
    });
  }

  signals.push(
    repo.license
      ? {
          id: "license",
          label: "Licencia OSI",
          state: isOsiLicense(repo.license.spdxId) ? "ok" : "warn",
          detail: isOsiLicense(repo.license.spdxId)
            ? `${repo.license.name} figura entre las licencias aprobadas por la OSI.`
            : `${repo.license.name} no está en la lista OSI local; revisa los términos.`,
          source,
        }
      : {
          id: "license",
          label: "Licencia OSI",
          state: "bad",
          detail:
            "Sin licencia declarada: por defecto no se concede permiso de uso.",
          source,
        },
  );

  const pushed = repo.pushedAt ? new Date(repo.pushedAt).getTime() : Number.NaN;
  const days = Math.floor((now.getTime() - pushed) / DAY_MS);
  signals.push(
    Number.isNaN(pushed)
      ? {
          id: "activity",
          label: "Actividad reciente",
          state: "na",
          detail: "Sin fecha de último push.",
          source,
        }
      : {
          id: "activity",
          label: "Actividad reciente",
          state: days <= 90 ? "ok" : days <= 365 ? "warn" : "bad",
          detail: `Último push hace ${days} días.`,
          source,
        },
  );

  signals.push({
    id: "archived",
    label: "Mantenimiento",
    state: repo.archived ? "bad" : "ok",
    detail: repo.archived
      ? "Repositorio archivado: solo lectura."
      : "No está archivado.",
    source,
  });

  const stable = releases.filter((r) => !r.draft && !r.prerelease);
  signals.push({
    id: "releases",
    label: "Releases publicadas",
    state: stable.length ? "ok" : "warn",
    detail: stable.length
      ? `Última versión estable: ${stable[0].tag}.`
      : "Sin releases estables publicadas.",
    source: `${source}/releases`,
  });
  return signals;
}
