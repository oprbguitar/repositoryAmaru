/**
 * `amaru-model.json`: the manifest written inside every model folder. It is
 * the source of truth for the library, for resuming downloads and for version
 * monitoring. Pure data helpers only — no browser APIs here.
 */
import type { ModelFormat, ModelPackage, PackageFile } from "./selection";
import type { Sha256State } from "./sha256";

export const MANIFEST_NAME = "amaru-model.json";
export const MANIFEST_SCHEMA = 1;
export const PARTIAL_SUFFIX = ".partial";

export type FileStatus = "pending" | "partial" | "complete" | "failed";
export type VerificationKind = "sha256" | "git-sha1" | "size";

export type ManifestFile = PackageFile & {
  status: FileStatus;
  /** Bytes committed to disk so far. */
  bytesWritten: number;
  /** How the finished file was verified; `null` until verified. */
  verified: VerificationKind | null;
  /** Saved hasher, so a resumed download does not re-read the partial file. */
  hashState?: Sha256State;
  /** True when the partial data is stored under `<path>.partial`. */
  usesPartialName?: boolean;
  /** Bytes committed per parallel segment, so each one resumes on its own. */
  segments?: number[];
};

export type ModelManifest = {
  schema: number;
  repo: string;
  /** Full commit sha the files were resolved against. */
  revision: string;
  revisionDate: string | null;
  format: ModelFormat;
  variant: string | null;
  license: string | null;
  baseModel: string | null;
  source: string;
  files: ManifestFile[];
  totalBytes: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  /** Kept on purpose for reproducibility; update prompts never suggest removing it. */
  pinned: boolean;
};

export type LibraryEntry = {
  folder: string;
  manifest: ModelManifest;
};

export type ManifestStatus = "complete" | "partial" | "failed";

function sanitizeSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "_");
}

/** `owner--name@sha8`: one folder per repo revision, so versions sit side by side. */
export function folderNameFor(repo: string, revision: string): string {
  const [owner, ...rest] = repo.split("/");
  const name = rest.join("-") || owner;
  const prefix = rest.length
    ? `${sanitizeSegment(owner)}--${sanitizeSegment(name)}`
    : sanitizeSegment(owner);
  return `${prefix}@${sanitizeSegment(revision).slice(0, 8)}`;
}

export function createManifest(input: {
  repo: string;
  revision: string;
  revisionDate: string | null;
  license: string | null;
  baseModel: string | null;
  pkg: ModelPackage;
  now: string;
}): ModelManifest {
  return {
    schema: MANIFEST_SCHEMA,
    repo: input.repo,
    revision: input.revision,
    revisionDate: input.revisionDate,
    format: input.pkg.format,
    variant: input.pkg.variant,
    license: input.license,
    baseModel: input.baseModel,
    source: `https://huggingface.co/${input.repo}/tree/${input.revision}`,
    files: input.pkg.files.map((file) => ({
      ...file,
      status: "pending" as const,
      bytesWritten: 0,
      verified: null,
    })),
    totalBytes: input.pkg.totalBytes,
    createdAt: input.now,
    updatedAt: input.now,
    completedAt: null,
    pinned: false,
  };
}

/**
 * Adds the files of `pkg` that the manifest does not have yet (for example a
 * second quantization of the same revision). Files already present are kept
 * untouched, which is what prevents duplicate downloads.
 */
export function mergePackage(
  manifest: ModelManifest,
  pkg: ModelPackage,
  now: string,
): { manifest: ModelManifest; added: number; alreadyPresent: number } {
  const known = new Set(manifest.files.map((file) => file.path));
  const additions: ManifestFile[] = pkg.files
    .filter((file) => !known.has(file.path))
    .map((file) => ({
      ...file,
      status: "pending" as const,
      bytesWritten: 0,
      verified: null,
    }));
  const files = [...manifest.files, ...additions];
  return {
    manifest: {
      ...manifest,
      files,
      variant:
        additions.some((file) => file.role === "weights") &&
        pkg.variant &&
        manifest.variant &&
        !manifest.variant.split(" + ").includes(pkg.variant)
          ? `${manifest.variant} + ${pkg.variant}`
          : manifest.variant,
      totalBytes: files.reduce((sum, file) => sum + file.size, 0),
      updatedAt: now,
      completedAt: additions.length ? null : manifest.completedAt,
    },
    added: additions.length,
    alreadyPresent: pkg.files.length - additions.length,
  };
}

export function manifestStatus(manifest: ModelManifest): ManifestStatus {
  if (manifest.files.every((file) => file.status === "complete"))
    return "complete";
  if (manifest.files.some((file) => file.status === "failed")) return "failed";
  return "partial";
}

export function manifestProgress(manifest: ModelManifest): {
  done: number;
  total: number;
} {
  return {
    done: manifest.files.reduce(
      (sum, file) =>
        sum + (file.status === "complete" ? file.size : file.bytesWritten),
      0,
    ),
    total: manifest.totalBytes,
  };
}

/** Bytes still to download for a manifest (what the disk must still absorb). */
export function remainingBytes(manifest: ModelManifest): number {
  const progress = manifestProgress(manifest);
  return Math.max(0, progress.total - progress.done);
}

/** Validates an untrusted JSON value read from disk. */
export function parseManifest(value: unknown): ModelManifest | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (
    raw.schema !== MANIFEST_SCHEMA ||
    typeof raw.repo !== "string" ||
    typeof raw.revision !== "string" ||
    (raw.format !== "gguf" && raw.format !== "safetensors") ||
    !Array.isArray(raw.files)
  )
    return null;
  const files: ManifestFile[] = [];
  for (const entry of raw.files) {
    if (!entry || typeof entry !== "object") return null;
    const file = entry as Record<string, unknown>;
    if (
      typeof file.path !== "string" ||
      typeof file.size !== "number" ||
      file.path.split("/").some((part) => part === ".." || part === "")
    )
      return null;
    files.push({
      path: file.path,
      size: file.size,
      sha256: typeof file.sha256 === "string" ? file.sha256 : null,
      gitOid: typeof file.gitOid === "string" ? file.gitOid : null,
      role:
        file.role === "weights" ||
        file.role === "config" ||
        file.role === "tokenizer"
          ? file.role
          : "docs",
      status:
        file.status === "complete" ||
        file.status === "partial" ||
        file.status === "failed"
          ? file.status
          : "pending",
      bytesWritten:
        typeof file.bytesWritten === "number" ? file.bytesWritten : 0,
      verified:
        file.verified === "sha256" ||
        file.verified === "git-sha1" ||
        file.verified === "size"
          ? file.verified
          : null,
      ...(file.hashState && typeof file.hashState === "object"
        ? { hashState: file.hashState as Sha256State }
        : {}),
      ...(file.usesPartialName === true ? { usesPartialName: true } : {}),
      ...(Array.isArray(file.segments) &&
      file.segments.every((n: unknown) => typeof n === "number" && n >= 0)
        ? { segments: file.segments as number[] }
        : {}),
    });
  }
  const text = (key: string) =>
    typeof raw[key] === "string" ? (raw[key] as string) : null;
  return {
    schema: MANIFEST_SCHEMA,
    repo: raw.repo,
    revision: raw.revision,
    revisionDate: text("revisionDate"),
    format: raw.format,
    variant: text("variant"),
    license: text("license"),
    baseModel: text("baseModel"),
    source: text("source") ?? `https://huggingface.co/${raw.repo}`,
    files,
    totalBytes:
      typeof raw.totalBytes === "number"
        ? raw.totalBytes
        : files.reduce((sum, file) => sum + file.size, 0),
    createdAt: text("createdAt") ?? "",
    updatedAt: text("updatedAt") ?? "",
    completedAt: text("completedAt"),
    pinned: raw.pinned === true,
  };
}

export type FolderContext = {
  /** Same repo and revision already in the folder (resume or add files). */
  sameRevision: LibraryEntry | null;
  /** Earlier or different revisions of the same repo. */
  otherRevisions: LibraryEntry[];
  /** Other models stored in the same folder. */
  otherModels: LibraryEntry[];
};

/** What is already in the destination folder relative to a planned download. */
export function describeFolder(
  library: LibraryEntry[],
  repo: string,
  revision: string,
): FolderContext {
  const sameRepo = library.filter(
    (entry) => entry.manifest.repo.toLowerCase() === repo.toLowerCase(),
  );
  return {
    sameRevision:
      sameRepo.find((entry) => entry.manifest.revision === revision) ?? null,
    otherRevisions: sameRepo.filter(
      (entry) => entry.manifest.revision !== revision,
    ),
    otherModels: library.filter(
      (entry) => entry.manifest.repo.toLowerCase() !== repo.toLowerCase(),
    ),
  };
}

export type PackageDiff = {
  added: PackageFile[];
  removed: ManifestFile[];
  changed: Array<{ path: string; from: number; to: number }>;
  unchanged: number;
  installedBytes: number;
  publishedBytes: number;
  sizeDelta: number;
};

function fingerprint(file: {
  sha256: string | null;
  gitOid: string | null;
  size: number;
}): string {
  return file.sha256 ?? file.gitOid ?? `size:${file.size}`;
}

/** Installed files vs. the same selection resolved against a newer revision. */
export function diffPackage(
  installed: ManifestFile[],
  published: PackageFile[],
): PackageDiff {
  const before = new Map(installed.map((file) => [file.path, file]));
  const after = new Map(published.map((file) => [file.path, file]));
  const added = published.filter((file) => !before.has(file.path));
  const removed = installed.filter((file) => !after.has(file.path));
  const changed: PackageDiff["changed"] = [];
  let unchanged = 0;
  for (const file of published) {
    const previous = before.get(file.path);
    if (!previous) continue;
    if (fingerprint(previous) === fingerprint(file)) unchanged += 1;
    else changed.push({ path: file.path, from: previous.size, to: file.size });
  }
  const installedBytes = installed.reduce((sum, file) => sum + file.size, 0);
  const publishedBytes = published.reduce((sum, file) => sum + file.size, 0);
  return {
    added,
    removed,
    changed,
    unchanged,
    installedBytes,
    publishedBytes,
    sizeDelta: publishedBytes - installedBytes,
  };
}

/** Stable Ollama model name derived from the repo and quantization. */
export function ollamaNameFor(repo: string, variant: string | null): string {
  const name = (repo.split("/").pop() ?? repo)
    .toLowerCase()
    .replace(/-gguf$/i, "")
    .replace(/[^a-z0-9._-]+/g, "-");
  const tag = (variant ?? "local").toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return `amaru-${name}:${tag}`;
}

/** Modelfile that imports a downloaded GGUF without copying the weights. */
export function buildModelfile(manifest: ModelManifest): string | null {
  if (manifest.format !== "gguf") return null;
  const weights = manifest.files
    .filter((file) => file.role === "weights")
    .sort((a, b) => a.path.localeCompare(b.path));
  if (!weights.length) return null;
  return [
    `# Generado por AMARU AI Observatory a partir de ${manifest.repo}@${manifest.revision.slice(0, 8)}`,
    `FROM ./${weights[0].path}`,
    "",
  ].join("\n");
}
