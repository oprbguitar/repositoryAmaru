/**
 * Downloads a model package into a folder the user picked with the File
 * System Access API. Resumable (HTTP Range + `.partial` files + manifest
 * checkpoints), hashed incrementally while streaming, verified against the
 * LFS oid published by Hugging Face, and only then renamed to its real name.
 */
import { resolveUrl } from "./hf";
import {
  type LibraryEntry,
  MANIFEST_NAME,
  type ManifestFile,
  type ModelManifest,
  PARTIAL_SUFFIX,
  parseManifest,
} from "./manifest";
import { bytesToHex, Sha256, type Sha256State } from "./sha256";

/**
 * Commit written bytes and the hash state every 1 GiB. Each commit makes the
 * browser copy the file, so frequent checkpoints slow big downloads a lot;
 * pausing (abort) always commits what arrived anyway.
 */
export const CHECKPOINT_BYTES = 1024 ** 3;
/** Files at least this big are fetched with several parallel connections. */
export const PARALLEL_MIN_BYTES = 128 * 1024 ** 2;
export const PARALLEL_CONNECTIONS = 4;
/** Network chunks are grouped before each disk write. */
const WRITE_BUFFER_BYTES = 8 * 1024 ** 2;
const PROGRESS_INTERVAL_MS = 250;

type PermissionMode = { mode: "read" | "readwrite" };
type PermissionedHandle = FileSystemDirectoryHandle & {
  queryPermission?: (d: PermissionMode) => Promise<PermissionState>;
  requestPermission?: (d: PermissionMode) => Promise<PermissionState>;
  values?: () => AsyncIterable<FileSystemHandle>;
};
type MovableFile = FileSystemFileHandle & {
  move?: (name: string) => Promise<void>;
};

export function supportsFolderAccess(): boolean {
  return (
    typeof window !== "undefined" &&
    "showDirectoryPicker" in window &&
    typeof FileSystemFileHandle !== "undefined" &&
    "createWritable" in FileSystemFileHandle.prototype
  );
}

export async function pickRootFolder(): Promise<FileSystemDirectoryHandle> {
  const picker = (
    window as unknown as {
      showDirectoryPicker: (options: {
        id?: string;
        mode: "readwrite";
      }) => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;
  return picker({ id: "amaru-models", mode: "readwrite" });
}

/** Re-grants access to a stored handle; must run inside a user gesture. */
export async function ensurePermission(
  handle: FileSystemDirectoryHandle,
  request: boolean,
): Promise<boolean> {
  const h = handle as PermissionedHandle;
  const options: PermissionMode = { mode: "readwrite" };
  if (!h.queryPermission) return true;
  if ((await h.queryPermission(options)) === "granted") return true;
  if (!request || !h.requestPermission) return false;
  return (await h.requestPermission(options)) === "granted";
}

// ---------- pure decisions (tested) ----------

export type RangeOutcome = "resume" | "restart" | "already-complete" | "error";

/** What to do with the server answer to a `Range: bytes=start-` request. */
export function interpretRange(
  status: number,
  start: number,
  size: number,
): RangeOutcome {
  if (status === 206) return start > 0 ? "resume" : "restart";
  if (status === 200) return "restart";
  if (status === 416 && start >= size) return "already-complete";
  return "error";
}

export type Verification =
  | { ok: true; kind: "sha256" | "git-sha1" | "size" }
  | { ok: false; reason: string };

export function verifyDigest(
  file: Pick<ManifestFile, "sha256" | "gitOid" | "size">,
  written: number,
  sha256Hex: string | null,
  gitSha1Hex: string | null,
): Verification {
  if (written !== file.size)
    return {
      ok: false,
      reason: `Tamaño distinto: se esperaban ${file.size} bytes y llegaron ${written}.`,
    };
  if (file.sha256)
    return sha256Hex === file.sha256
      ? { ok: true, kind: "sha256" }
      : { ok: false, reason: "El SHA-256 no coincide con el publicado." };
  if (file.gitOid)
    return gitSha1Hex === file.gitOid
      ? { ok: true, kind: "git-sha1" }
      : { ok: false, reason: "El identificador git no coincide." };
  return { ok: true, kind: "size" };
}

// ---------- filesystem helpers ----------

async function parentOf(
  dir: FileSystemDirectoryHandle,
  path: string,
): Promise<{ parent: FileSystemDirectoryHandle; name: string }> {
  const parts = path.split("/");
  const name = parts.pop() ?? path;
  let parent = dir;
  for (const part of parts)
    parent = await parent.getDirectoryHandle(part, { create: true });
  return { parent, name };
}

export async function writeManifest(
  dir: FileSystemDirectoryHandle,
  manifest: ModelManifest,
): Promise<void> {
  const handle = await dir.getFileHandle(MANIFEST_NAME, { create: true });
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(manifest, null, 2));
  await writable.close();
}

export async function readLibrary(
  root: FileSystemDirectoryHandle,
): Promise<LibraryEntry[]> {
  const entries: LibraryEntry[] = [];
  const values = (root as PermissionedHandle).values?.();
  if (!values) return entries;
  for await (const handle of values) {
    if (handle.kind !== "directory") continue;
    try {
      const dir = handle as FileSystemDirectoryHandle;
      const file = await (await dir.getFileHandle(MANIFEST_NAME)).getFile();
      const manifest = parseManifest(JSON.parse(await file.text()));
      if (manifest) entries.push({ folder: handle.name, manifest });
    } catch {
      // Folders without a valid manifest are not AMARU downloads.
    }
  }
  return entries.sort((a, b) => a.folder.localeCompare(b.folder));
}

export function removeFolder(root: FileSystemDirectoryHandle, folder: string) {
  return root.removeEntry(folder, { recursive: true });
}

async function gitBlobSha1(file: File): Promise<string> {
  const header = new TextEncoder().encode(`blob ${file.size}\0`);
  const body = new Uint8Array(await file.arrayBuffer());
  const joined = new Uint8Array(header.length + body.length);
  joined.set(header);
  joined.set(body, header.length);
  return bytesToHex(
    new Uint8Array(await crypto.subtle.digest("SHA-1", joined)),
  );
}

let hashWorker: Worker | null = null;
let hashSeq = 0;
const hashWaiters = new Map<
  number,
  (result: { state?: Sha256State; error?: string }) => void
>();

/** SHA-256 of the first `upTo` bytes, computed in a Web Worker when possible. */
async function rehash(file: File, upTo: number): Promise<Sha256> {
  if (upTo === 0) return new Sha256();
  if (typeof Worker !== "undefined") {
    try {
      if (!hashWorker) {
        hashWorker = new Worker(new URL("./hash.worker.ts", import.meta.url), {
          type: "module",
        });
        hashWorker.onmessage = (event) => {
          const waiter = hashWaiters.get(event.data.id);
          hashWaiters.delete(event.data.id);
          waiter?.(event.data);
        };
      }
      const id = ++hashSeq;
      const worker = hashWorker;
      const result = await new Promise<{ state?: Sha256State }>((resolve) => {
        hashWaiters.set(id, resolve);
        worker.postMessage({ id, file, upTo });
      });
      if (result.state) return Sha256.restore(result.state);
    } catch {
      // Fall back to hashing on the main thread.
    }
  }
  const hasher = new Sha256();
  const reader = file.slice(0, upTo).stream().getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    hasher.update(value);
  }
  return hasher;
}

function concat(chunks: Uint8Array[], size: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

class SegmentError extends Error {
  constructor(
    message: string,
    readonly contiguous: number,
    readonly original: unknown,
  ) {
    super(message);
  }
}

/**
 * Fetches a whole file with several Range connections, writing each segment
 * at its position. On failure throws a SegmentError carrying how many leading
 * bytes are complete, so a resume continues sequentially from there.
 */
async function fetchParallel(
  url: string,
  size: number,
  writable: FileSystemWritableFileStream,
  signal: AbortSignal,
  onBytes: (count: number) => void,
): Promise<void> {
  const count = PARALLEL_CONNECTIONS;
  const segment = Math.ceil(size / count);
  const progress = new Array<number>(count).fill(0);
  const lengths = Array.from({ length: count }, (_, i) =>
    Math.max(0, Math.min(segment, size - i * segment)),
  );
  const inner = new AbortController();
  const onAbort = () => inner.abort(signal.reason);
  signal.addEventListener("abort", onAbort);
  const run = async (i: number) => {
    const from = i * segment;
    const length = lengths[i];
    if (!length) return;
    const response = await fetch(url, {
      signal: inner.signal,
      headers: { Range: `bytes=${from}-${from + length - 1}` },
    });
    if (response.status !== 206 || !response.body)
      throw new Error(
        response.status === 401 || response.status === 403
          ? "Modelo restringido: acepta sus condiciones en Hugging Face."
          : `El servidor respondió ${response.status} a una descarga por partes.`,
      );
    const reader = response.body.getReader();
    let buffer: Uint8Array[] = [];
    let buffered = 0;
    const flush = async () => {
      if (!buffered) return;
      const data = concat(buffer, buffered);
      const position = from + progress[i];
      buffer = [];
      buffered = 0;
      await writable.write({ type: "write", position, data });
      progress[i] += data.length;
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer.push(value);
      buffered += value.length;
      onBytes(value.length);
      if (buffered >= WRITE_BUFFER_BYTES) await flush();
    }
    await flush();
    if (progress[i] !== length)
      throw new Error("Una parte de la descarga llegó incompleta.");
  };
  try {
    const results = await Promise.allSettled(
      lengths.map((_, i) =>
        run(i).catch((error) => {
          inner.abort(error);
          throw error;
        }),
      ),
    );
    const failed = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failed) {
      let contiguous = 0;
      for (let i = 0; i < count; i += 1) {
        contiguous += progress[i];
        if (progress[i] < lengths[i]) break;
      }
      const reason = signal.aborted ? signal.reason : failed.reason;
      throw new SegmentError(
        (reason as Error)?.message ?? "Descarga interrumpida.",
        contiguous,
        reason,
      );
    }
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

async function finalizeName(
  parent: FileSystemDirectoryHandle,
  partial: FileSystemFileHandle,
  name: string,
): Promise<void> {
  const movable = partial as MovableFile;
  if (movable.move) {
    await movable.move(name);
    return;
  }
  const target = await parent.getFileHandle(name, { create: true });
  const writable = await target.createWritable();
  await (await partial.getFile()).stream().pipeTo(writable);
  await parent.removeEntry(partial.name);
}

// ---------- engine ----------

export type DownloadProgress = {
  file: string;
  fileIndex: number;
  fileCount: number;
  done: number;
  total: number;
  bytesPerSecond: number;
  phase: "downloading" | "verifying" | "finalizing";
};

export type DownloadOptions = {
  root: FileSystemDirectoryHandle;
  folder: string;
  manifest: ModelManifest;
  signal: AbortSignal;
  onProgress: (progress: DownloadProgress) => void;
  onCheckpoint?: (manifest: ModelManifest) => void;
};

function patchFile(
  manifest: ModelManifest,
  path: string,
  patch: Partial<ManifestFile>,
): ModelManifest {
  return {
    ...manifest,
    updatedAt: new Date().toISOString(),
    files: manifest.files.map((file) =>
      file.path === path ? { ...file, ...patch } : file,
    ),
  };
}

export async function runDownload(
  options: DownloadOptions,
): Promise<ModelManifest> {
  const { root, folder, signal, onProgress } = options;
  const dir = await root.getDirectoryHandle(folder, { create: true });
  let manifest = options.manifest;
  const save = async () => {
    await writeManifest(dir, manifest);
    options.onCheckpoint?.(manifest);
  };
  await save();
  const total = manifest.totalBytes;
  const doneBefore = () =>
    manifest.files.reduce(
      (sum, f) => sum + (f.status === "complete" ? f.size : 0),
      0,
    );
  const pending = manifest.files.filter((f) => f.status !== "complete");
  const startedAt = performance.now();
  let fetchedThisRun = 0;

  for (const [index, file] of pending.entries()) {
    signal.throwIfAborted();
    const { parent, name } = await parentOf(dir, file.path);
    const partial = await parent.getFileHandle(`${name}${PARTIAL_SUFFIX}`, {
      create: true,
    });
    const onDisk = (await partial.getFile()).size;
    let start = Math.min(file.bytesWritten, onDisk);
    let hasher =
      file.hashState && file.hashState.length === start
        ? Sha256.restore(file.hashState)
        : await rehash(await partial.getFile(), start);

    const report = (written: number, phase: DownloadProgress["phase"]) => {
      const elapsed = (performance.now() - startedAt) / 1000;
      onProgress({
        file: file.path,
        fileIndex: index,
        fileCount: pending.length,
        done: doneBefore() + written,
        total,
        bytesPerSecond: elapsed > 0 ? fetchedThisRun / elapsed : 0,
        phase,
      });
    };

    let written = start;
    let lastReport = 0;
    const throttledReport = (value: number) => {
      const now = performance.now();
      if (now - lastReport < PROGRESS_INTERVAL_MS) return;
      lastReport = now;
      report(value, "downloading");
    };
    const url = resolveUrl(manifest.repo, manifest.revision, file.path);
    let hashedInline = true;

    if (start === 0 && file.size >= PARALLEL_MIN_BYTES) {
      // Several connections at once; hashed afterwards in a worker.
      hashedInline = false;
      const writable = await partial.createWritable({
        keepExistingData: false,
      });
      try {
        await fetchParallel(url, file.size, writable, signal, (bytes) => {
          written += bytes;
          fetchedThisRun += bytes;
          throttledReport(written);
        });
        await writable.close();
        written = file.size;
      } catch (error) {
        await writable.close().catch(() => undefined);
        const contiguous = error instanceof SegmentError ? error.contiguous : 0;
        manifest = patchFile(manifest, file.path, {
          status: "partial",
          bytesWritten: contiguous,
          hashState: undefined,
          usesPartialName: true,
        });
        await save().catch(() => undefined);
        throw error instanceof SegmentError && error.original instanceof Error
          ? error.original
          : error;
      }
    } else if (start < file.size) {
      const response = await fetch(url, {
        signal,
        headers: start > 0 ? { Range: `bytes=${start}-` } : undefined,
      });
      const outcome = interpretRange(response.status, start, file.size);
      if (outcome === "error" || !response.body)
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Modelo restringido: acepta sus condiciones en Hugging Face."
            : `Hugging Face respondió ${response.status} para ${file.path}.`,
        );
      if (outcome === "restart") {
        start = 0;
        written = 0;
        hasher = new Sha256();
      }
      if (outcome !== "already-complete") {
        let writable = await partial.createWritable({
          keepExistingData: start > 0,
        });
        if (start > 0) await writable.seek(start);
        else await writable.truncate(0);
        let sinceCheckpoint = 0;
        let buffer: Uint8Array[] = [];
        let buffered = 0;
        const flush = async () => {
          if (!buffered) return;
          const data = concat(buffer, buffered);
          buffer = [];
          buffered = 0;
          await writable.write(data);
          hasher.update(data);
          written += data.length;
          sinceCheckpoint += data.length;
        };
        const reader = response.body.getReader();
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer.push(value);
            buffered += value.length;
            fetchedThisRun += value.length;
            throttledReport(written + buffered);
            if (buffered < WRITE_BUFFER_BYTES) continue;
            await flush();
            if (sinceCheckpoint >= CHECKPOINT_BYTES) {
              sinceCheckpoint = 0;
              await writable.close();
              manifest = patchFile(manifest, file.path, {
                status: "partial",
                bytesWritten: written,
                hashState: hasher.save(),
                usesPartialName: true,
              });
              await save();
              writable = await partial.createWritable({
                keepExistingData: true,
              });
              await writable.seek(written);
            }
          }
          await flush();
          await writable.close();
        } catch (error) {
          // Commit what arrived so a later resume starts from here.
          await flush().catch(() => undefined);
          await writable.close().catch(() => undefined);
          manifest = patchFile(manifest, file.path, {
            status: "partial",
            bytesWritten: written,
            hashState: hasher.save(),
            usesPartialName: true,
          });
          await save().catch(() => undefined);
          throw error;
        }
      }
    }

    report(written, "verifying");
    const gitSha1 =
      !file.sha256 && file.gitOid
        ? await gitBlobSha1(await partial.getFile())
        : null;
    const verdict = verifyDigest(
      file,
      written,
      file.sha256
        ? hashedInline
          ? hasher.hex()
          : (await rehash(await partial.getFile(), written)).hex()
        : null,
      gitSha1,
    );
    if (!verdict.ok) {
      await parent.removeEntry(partial.name).catch(() => undefined);
      manifest = patchFile(manifest, file.path, {
        status: "failed",
        bytesWritten: 0,
        hashState: undefined,
      });
      await save();
      throw new Error(`${file.path}: ${verdict.reason}`);
    }
    report(written, "finalizing");
    await parent.removeEntry(name).catch(() => undefined);
    await finalizeName(parent, partial, name);
    manifest = patchFile(manifest, file.path, {
      status: "complete",
      bytesWritten: file.size,
      verified: verdict.kind,
      hashState: undefined,
      usesPartialName: false,
    });
    await save();
  }

  manifest = { ...manifest, completedAt: new Date().toISOString() };
  await save();
  return manifest;
}
