/**
 * Downloads a model package into a folder the user picked with the File
 * System Access API. Resumable (HTTP Range + `.partial` files + manifest
 * checkpoints), fetched in 16 MB chunks over several connections straight
 * from the CDN, hashed while streaming, verified against the LFS oid
 * published by Hugging Face, and only then renamed to its real name.
 */
import { resolveUrl } from "./hf";
import { hfAuthHeaders } from "./hfToken";
import {
  type LibraryEntry,
  MANIFEST_NAME,
  type ManifestFile,
  type ModelManifest,
  PARTIAL_SUFFIX,
  parseManifest,
} from "./manifest";
import { bytesToHex, Sha256, type Sha256State } from "./sha256";

/** Files at least this big are fetched in chunks over several connections. */
export const PARALLEL_MIN_BYTES = 64 * 1024 ** 2;
/** Size of each chunk a connection pulls (small, so stragglers are short). */
export const CHUNK_BYTES = 16 * 1024 ** 2;
const MAX_CHUNKS = 2048;
/** Connections per big file, like aria2 or Ollama. */
export const CONNECTIONS_PER_FILE = 8;
/** Budget for the whole tab, shared by every model downloading at once. */
export const MAX_CONNECTIONS = 16;
/** Files of one model downloaded at the same time. */
const FILES_AT_ONCE = 3;
/** Chunks held in memory ahead of the hash (bounds RAM to ~192 MB a file). */
const HASH_WINDOW_CHUNKS = 12;
const SPEED_WINDOW_MS = 5000;
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

// ---------- hashing (Web Worker, WebAssembly) ----------

type WorkerReply = {
  key: string;
  hex?: string;
  state?: Sha256State;
  error?: string;
};

let hashWorker: Worker | null | undefined;
let hashSeq = 0;
const hashWaiters = new Map<string, (reply: WorkerReply) => void>();

function getHashWorker(): Worker | null {
  if (hashWorker !== undefined) return hashWorker;
  if (typeof Worker === "undefined") {
    hashWorker = null;
    return null;
  }
  try {
    const worker = new Worker(new URL("./hash.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const waiter = hashWaiters.get(event.data.key);
      hashWaiters.delete(event.data.key);
      waiter?.(event.data);
    };
    hashWorker = worker;
  } catch {
    hashWorker = null;
  }
  return hashWorker;
}

function askWorker(
  worker: Worker,
  message: Record<string, unknown>,
): Promise<WorkerReply> {
  const key = `k${++hashSeq}`;
  return new Promise((resolve) => {
    hashWaiters.set(key, resolve);
    worker.postMessage({ ...message, key });
  });
}

/** Resumable SHA-256 state of the first `upTo` bytes (small files only). */
async function rehash(file: File, upTo: number): Promise<Sha256> {
  if (upTo === 0) return new Sha256();
  const worker = getHashWorker();
  if (worker) {
    const result = await askWorker(worker, { type: "state", file, upTo });
    if (result.state) return Sha256.restore(result.state);
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

/** SHA-256 hex of a whole file, WebAssembly in a worker when possible. */
async function hashFileHex(file: File, upTo: number): Promise<string> {
  const worker = getHashWorker();
  if (worker) {
    const result = await askWorker(worker, { type: "file-hex", file, upTo });
    if (result.hex) return result.hex;
  }
  return (await rehash(file, upTo)).hex();
}

/** SHA-256 fed in order while the file downloads, so verifying is instant. */
type HashStream = {
  update: (data: Uint8Array<ArrayBuffer>) => void;
  digest: () => Promise<string>;
  drop: () => void;
};

function openHashStream(): HashStream {
  const worker = getHashWorker();
  if (!worker) {
    const hasher = new Sha256();
    return {
      update: (data) => hasher.update(data),
      digest: async () => hasher.hex(),
      drop: () => undefined,
    };
  }
  const sid = `s${++hashSeq}`;
  worker.postMessage({ type: "stream-start", sid });
  return {
    // The buffer is already on disk: hand it over without copying.
    update: (data) =>
      worker.postMessage({ type: "stream-update", sid, data }, [data.buffer]),
    digest: async () => {
      const result = await askWorker(worker, { type: "stream-digest", sid });
      if (!result.hex) throw new Error(result.error ?? "Hash no disponible.");
      return result.hex;
    },
    drop: () => worker.postMessage({ type: "stream-drop", sid }),
  };
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

// ---------- connection budget ----------

/** Counting semaphore shared by every download in the tab. */
export class ConnectionGate {
  private free: number;
  private queue: Array<() => void> = [];

  constructor(size: number) {
    this.free = size;
  }

  get available(): number {
    return this.free;
  }

  async acquire(signal: AbortSignal): Promise<() => void> {
    signal.throwIfAborted();
    if (this.free > 0) {
      this.free -= 1;
      return this.releaser();
    }
    await new Promise<void>((resolve, reject) => {
      const grant = () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      };
      const onAbort = () => {
        const index = this.queue.indexOf(grant);
        if (index >= 0) this.queue.splice(index, 1);
        reject(signal.reason);
      };
      this.queue.push(grant);
      signal.addEventListener("abort", onAbort, { once: true });
    });
    return this.releaser();
  }

  private releaser(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.queue.shift();
      if (next) next();
      else this.free += 1;
    };
  }
}

const gate = new ConnectionGate(MAX_CONNECTIONS);

// ---------- chunk layout (tested) ----------

const MAX_SEGMENT_RETRIES = 12;
const MAX_LINK_REFRESHES = 6;

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

class FatalDownloadError extends Error {}

const RESTRICTED_MESSAGE =
  "Modelo restringido: acepta sus condiciones en Hugging Face y añade tu token de lectura en «Acceso a modelos restringidos».";

/** Number of chunks for a file: ~CHUNK_BYTES each, at least one. */
export function chunkCount(size: number): number {
  return Math.min(MAX_CHUNKS, Math.max(1, Math.ceil(size / CHUNK_BYTES)));
}

/** Splits a file into `count` equal chunks: [start, length] pairs. */
export function segmentLayout(size: number, count = chunkCount(size)) {
  const segment = Math.ceil(size / count);
  return Array.from({ length: count }, (_, i) => ({
    from: i * segment,
    length: Math.max(0, Math.min(segment, size - i * segment)),
  }));
}

/**
 * Initial per-chunk progress for a resume, in the current chunk layout.
 * Saved counters from any earlier layout (older versions used 4 segments)
 * become covered byte ranges and are re-mapped; without them a contiguous
 * byte count is used. Everything is clamped to the bytes on disk.
 */
export function resumeSegments(
  size: number,
  saved: number[] | undefined,
  contiguous: number,
  onDisk: number,
  count = chunkCount(size),
): number[] {
  const covered: Array<[number, number]> = saved?.length
    ? segmentLayout(size, saved.length).map(({ from, length }, i) => [
        from,
        from + Math.max(0, Math.min(saved[i] ?? 0, length)),
      ])
    : [[0, contiguous]];
  // Join touching ranges: a chunk may span two old segments.
  const merged: Array<[number, number]> = [];
  for (const [start, end] of covered) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else if (end > start) merged.push([start, end]);
  }
  return segmentLayout(size, count).map(({ from, length }) => {
    const range = merged.find(([start, end]) => start <= from && from < end);
    const end = range ? Math.min(range[1], onDisk) : from;
    return Math.max(0, Math.min(length, end - from));
  });
}

// ---------- network ----------

type Source = { url: string; direct: boolean };

function failOnStatus(status: number) {
  if (status === 401 || status === 403)
    throw new FatalDownloadError(RESTRICTED_MESSAGE);
  if (status === 404)
    throw new FatalDownloadError("El archivo ya no existe en esa revisión.");
}

/**
 * Follows Hugging Face's redirect once and keeps the signed CDN address, so
 * every chunk goes straight to the CDN (no extra round trip, no rate limit
 * on /resolve, no CORS preflight). The signed link expires after a while;
 * it is refreshed when the CDN answers 400/403/410.
 */
async function resolveSource(
  url: string,
  signal: AbortSignal,
): Promise<Source> {
  const response = await fetch(url, {
    signal,
    headers: { ...hfAuthHeaders(), Range: "bytes=0-0" },
  });
  failOnStatus(response.status);
  await response.body?.cancel().catch(() => undefined);
  try {
    if (response.url && new URL(response.url).host !== new URL(url).host)
      return { url: response.url, direct: true };
  } catch {
    // Unparseable URL: keep the original one.
  }
  return { url, direct: false };
}

/** Holds chunk data back until every earlier chunk has been hashed. */
class InlineHasher {
  next = 0;
  private pieces = new Map<number, Uint8Array<ArrayBuffer>[]>();
  private finished = new Set<number>();
  private waiters: Array<() => void> = [];

  constructor(
    readonly stream: HashStream,
    private window: number,
  ) {}

  canClaim(index: number): boolean {
    return index < this.next + this.window;
  }

  waitForRoom(signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const wake = () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      };
      const onAbort = () => reject(signal.reason);
      this.waiters.push(wake);
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  add(index: number, data: Uint8Array<ArrayBuffer>) {
    const list = this.pieces.get(index);
    if (list) list.push(data);
    else this.pieces.set(index, [data]);
    if (index === this.next) this.drain();
  }

  complete(index: number) {
    this.finished.add(index);
    this.drain();
  }

  private drain() {
    // The chunk being hashed streams as it arrives; later ones wait.
    for (;;) {
      for (const data of this.pieces.get(this.next) ?? [])
        this.stream.update(data);
      this.pieces.delete(this.next);
      if (!this.finished.has(this.next)) break;
      this.finished.delete(this.next);
      this.next += 1;
    }
    const waiters = this.waiters;
    this.waiters = [];
    for (const wake of waiters) wake();
  }
}

/**
 * Fetches a file in many small chunks over several connections that pull
 * the next chunk as soon as they finish one, so a slow connection never
 * holds the rest back. Each chunk resumes on its own after a dropped
 * connection (with backoff); only a fatal HTTP error or a pause stops the
 * whole file. `progress` is updated in place, per chunk.
 */
async function fetchParallel(input: {
  url: string;
  size: number;
  progress: number[];
  writable: FileSystemWritableFileStream;
  signal: AbortSignal;
  onBytes: (count: number) => void;
  hasher: InlineHasher | null;
}): Promise<void> {
  const { url, size, progress, writable, signal, onBytes, hasher } = input;
  const layout = segmentLayout(size, progress.length);
  const inner = new AbortController();
  const onAbort = () => inner.abort(signal.reason);
  signal.addEventListener("abort", onAbort);

  let source: Promise<Source> = resolveSource(url, inner.signal);
  let refreshes = 0;
  const refresh = (stale: Promise<Source>) => {
    if (source !== stale) return; // another connection already refreshed it
    refreshes += 1;
    if (refreshes > MAX_LINK_REFRESHES)
      throw new Error("El enlace de descarga caducó demasiadas veces.");
    source = resolveSource(url, inner.signal);
  };

  // Disk writes go one at a time, in the order they were requested.
  let writing: Promise<void> = Promise.resolve();
  const write = (position: number, data: Uint8Array<ArrayBuffer>) => {
    const job = writing.then(() =>
      writable.write({ type: "write", position, data }),
    );
    writing = job.catch(() => undefined);
    return job;
  };

  let cursor = 0;
  const claim = async (): Promise<number | null> => {
    for (;;) {
      while (
        cursor < layout.length &&
        progress[cursor] >= layout[cursor].length
      ) {
        hasher?.complete(cursor);
        cursor += 1;
      }
      if (cursor >= layout.length) return null;
      if (!hasher || hasher.canClaim(cursor)) {
        cursor += 1;
        return cursor - 1;
      }
      await hasher.waitForRoom(inner.signal);
    }
  };

  const fetchChunk = async (i: number) => {
    const { from, length } = layout[i];
    let failures = 0;
    while (progress[i] < length) {
      inner.signal.throwIfAborted();
      const release = await gate.acquire(inner.signal);
      const current = source;
      let backoff = 0;
      try {
        const { url: target, direct } = await current;
        const offset = from + progress[i];
        const response = await fetch(target, {
          signal: inner.signal,
          headers: {
            ...(direct ? {} : hfAuthHeaders()),
            Range: `bytes=${offset}-${from + length - 1}`,
          },
        });
        if (direct && [400, 403, 410].includes(response.status)) {
          await response.body?.cancel().catch(() => undefined);
          refresh(current);
          continue;
        }
        failOnStatus(response.status);
        if (response.status !== 206 || !response.body)
          throw new Error(`El servidor respondió ${response.status}.`);
        const reader = response.body.getReader();
        let buffer: Uint8Array[] = [];
        let buffered = 0;
        const flush = async () => {
          if (!buffered) return;
          const data = concat(buffer, buffered);
          const position = from + progress[i];
          buffer = [];
          buffered = 0;
          await write(position, data);
          progress[i] += data.length;
          hasher?.add(i, data);
        };
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            const room = length - progress[i] - buffered;
            if (room <= 0) break;
            const chunk = value.length > room ? value.subarray(0, room) : value;
            buffer.push(chunk);
            buffered += chunk.length;
            onBytes(chunk.length);
            if (buffered >= WRITE_BUFFER_BYTES) await flush();
          }
        } finally {
          // Keep whatever arrived before the connection dropped.
          await flush();
          reader.cancel().catch(() => undefined);
        }
        failures = 0;
      } catch (error) {
        if (error instanceof FatalDownloadError || inner.signal.aborted)
          throw error;
        failures += 1;
        if (failures > MAX_SEGMENT_RETRIES)
          throw new Error(
            "La conexión se cortó demasiadas veces. Pulsa «Reanudar» para continuar desde donde quedó.",
          );
        backoff = Math.min(15_000, 1000 * 2 ** (failures - 1));
      } finally {
        // Free the slot before waiting so other downloads keep going.
        release();
      }
      if (backoff) await wait(backoff, inner.signal);
    }
    hasher?.complete(i);
  };

  const worker = async () => {
    for (;;) {
      const index = await claim();
      if (index === null) return;
      await fetchChunk(index);
    }
  };

  try {
    await source;
    const results = await Promise.allSettled(
      Array.from(
        { length: Math.min(CONNECTIONS_PER_FILE, layout.length) },
        () =>
          worker().catch((error) => {
            inner.abort(error);
            throw error;
          }),
      ),
    );
    const failed = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failed) throw failed.reason;
    await writing;
  } catch (error) {
    inner.abort(error);
    throw signal.aborted ? signal.reason : error;
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

export async function finalizeName(
  parent: FileSystemDirectoryHandle,
  partial: FileSystemFileHandle,
  name: string,
): Promise<void> {
  const movable = partial as MovableFile;
  if (movable.move) {
    try {
      await movable.move(name);
      return;
    } catch {
      // Chrome only allows move() on some user-visible folders and platforms
      // (NotAllowedError "not allowed by the user agent or the platform").
      // The bytes are already verified, so fall back to copy + delete.
    }
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
  /** Current speed (last few seconds), not the average since the start. */
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

/** Speed over a sliding window, so the ETA follows the real network. */
export class SpeedMeter {
  private samples: Array<[number, number]> = [];
  private total = 0;

  constructor(private windowMs = SPEED_WINDOW_MS) {}

  add(bytes: number, now = performance.now()) {
    this.total += bytes;
    this.samples.push([now, this.total]);
    while (this.samples.length > 1 && now - this.samples[1][0] >= this.windowMs)
      this.samples.shift();
  }

  rate(now = performance.now()): number {
    const first = this.samples[0];
    if (!first) return 0;
    const span = Math.max(now - first[0], 250);
    return ((this.total - first[1]) / span) * 1000;
  }
}

type LiveFile = { written: number; phase: DownloadProgress["phase"] };
const PHASE_RANK = { downloading: 0, verifying: 1, finalizing: 2 } as const;

export async function runDownload(
  options: DownloadOptions,
): Promise<ModelManifest> {
  const { root, folder, signal, onProgress } = options;
  const dir = await root.getDirectoryHandle(folder, { create: true });
  let manifest = options.manifest;
  // Manifest writes are chained: files finish concurrently.
  let saving: Promise<void> = Promise.resolve();
  const save = () => {
    const job = saving.then(async () => {
      await writeManifest(dir, manifest);
      options.onCheckpoint?.(manifest);
    });
    saving = job.catch(() => undefined);
    return job;
  };
  await save();
  const total = manifest.totalBytes;
  const pending = manifest.files.filter((f) => f.status !== "complete");
  const speed = new SpeedMeter();
  const live = new Map<string, LiveFile>();
  let finishedFiles = 0;
  let lastReport = 0;

  const report = (force = false) => {
    const now = performance.now();
    if (!force && now - lastReport < PROGRESS_INTERVAL_MS) return;
    lastReport = now;
    const completeBytes = manifest.files.reduce(
      (sum, f) => sum + (f.status === "complete" ? f.size : 0),
      0,
    );
    let inFlight = 0;
    let current: string | null = null;
    let phase: DownloadProgress["phase"] = "finalizing";
    for (const [path, state] of live) {
      inFlight += state.written;
      if (current === null || PHASE_RANK[state.phase] < PHASE_RANK[phase]) {
        current = path;
        phase = state.phase;
      }
    }
    onProgress({
      file: current ?? "",
      fileIndex: Math.min(finishedFiles, Math.max(0, pending.length - 1)),
      fileCount: pending.length,
      done: Math.min(total, completeBytes + inFlight),
      total,
      bytesPerSecond: speed.rate(now),
      phase,
    });
  };

  const downloadFile = async (file: ManifestFile) => {
    signal.throwIfAborted();
    const { parent, name } = await parentOf(dir, file.path);
    const partial = await parent.getFileHandle(`${name}${PARTIAL_SUFFIX}`, {
      create: true,
    });
    const onDisk = (await partial.getFile()).size;
    const useParallel = file.size >= PARALLEL_MIN_BYTES;
    const state: LiveFile = { written: 0, phase: "downloading" };
    live.set(file.path, state);
    const onBytes = (bytes: number) => {
      state.written += bytes;
      speed.add(bytes);
      report();
    };
    const url = resolveUrl(manifest.repo, manifest.revision, file.path);
    let digest: string | null = null;
    let written = 0;

    if (useParallel) {
      const segments = resumeSegments(
        file.size,
        file.segments,
        file.bytesWritten,
        onDisk,
      );
      const already = segments.reduce((sum, n) => sum + n, 0);
      state.written = already;
      // Hash while downloading when starting fresh; a resume re-reads the
      // file at the end instead (WebAssembly, in a worker).
      const inline =
        already === 0 && file.sha256
          ? new InlineHasher(openHashStream(), HASH_WINDOW_CHUNKS)
          : null;
      const persist = async () => {
        manifest = patchFile(manifest, file.path, {
          status: "partial",
          bytesWritten: segments[0] ?? 0,
          segments: [...segments],
          hashState: undefined,
          usesPartialName: true,
        });
        await save().catch(() => undefined);
      };
      if (already < file.size) {
        const writable = await partial.createWritable({
          keepExistingData: already > 0,
        });
        try {
          await fetchParallel({
            url,
            size: file.size,
            progress: segments,
            writable,
            signal,
            onBytes,
            hasher: inline,
          });
          await writable.close();
          // Checkpoint the finished bytes: if verification or the final
          // rename fails, «Reanudar» verifies the file on disk instead.
          await persist();
        } catch (error) {
          inline?.stream.drop();
          await writable.close().catch(() => undefined);
          await persist();
          throw error;
        }
      }
      written = segments.reduce((sum, n) => sum + n, 0);
      state.written = written;
      state.phase = "verifying";
      report(true);
      if (file.sha256)
        digest =
          inline && inline.next >= segments.length
            ? await inline.stream.digest()
            : await hashFileHex(await partial.getFile(), written);
    } else {
      let start = Math.min(file.bytesWritten, onDisk);
      let hasher =
        file.hashState && file.hashState.length === start
          ? Sha256.restore(file.hashState)
          : await rehash(await partial.getFile(), start);
      written = start;
      state.written = start;
      if (start < file.size) {
        const release = await gate.acquire(signal);
        try {
          const response = await fetch(url, {
            signal,
            headers: {
              ...hfAuthHeaders(),
              ...(start > 0 ? { Range: `bytes=${start}-` } : {}),
            },
          });
          const outcome = interpretRange(response.status, start, file.size);
          if (outcome === "error" || !response.body)
            throw new Error(
              response.status === 401 || response.status === 403
                ? RESTRICTED_MESSAGE
                : `Hugging Face respondió ${response.status} para ${file.path}.`,
            );
          if (outcome === "restart") {
            start = 0;
            written = 0;
            state.written = 0;
            hasher = new Sha256();
          }
          if (outcome !== "already-complete") {
            const writable = await partial.createWritable({
              keepExistingData: start > 0,
            });
            if (start > 0) await writable.seek(start);
            else await writable.truncate(0);
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
            };
            const reader = response.body.getReader();
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer.push(value);
                buffered += value.length;
                onBytes(value.length);
                if (buffered >= WRITE_BUFFER_BYTES) await flush();
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
        } finally {
          release();
        }
      }
      state.written = written;
      state.phase = "verifying";
      report(true);
      if (file.sha256) digest = hasher.hex();
    }

    const gitSha1 =
      !file.sha256 && file.gitOid
        ? await gitBlobSha1(await partial.getFile())
        : null;
    const verdict = verifyDigest(file, written, digest, gitSha1);
    if (!verdict.ok) {
      await parent.removeEntry(partial.name).catch(() => undefined);
      manifest = patchFile(manifest, file.path, {
        status: "failed",
        bytesWritten: 0,
        hashState: undefined,
        segments: undefined,
      });
      live.delete(file.path);
      await save();
      throw new Error(`${file.path}: ${verdict.reason}`);
    }
    state.phase = "finalizing";
    report(true);
    await parent.removeEntry(name).catch(() => undefined);
    await finalizeName(parent, partial, name);
    manifest = patchFile(manifest, file.path, {
      status: "complete",
      bytesWritten: file.size,
      verified: verdict.kind,
      hashState: undefined,
      segments: undefined,
      usesPartialName: false,
    });
    live.delete(file.path);
    finishedFiles += 1;
    await save();
    report(true);
  };

  // Several files of the same model at once (config, tokenizer and shards
  // overlap); the shared connection budget keeps the total in check.
  const queue = [...pending];
  const lanes = new AbortController();
  const onAbort = () => lanes.abort(signal.reason);
  signal.addEventListener("abort", onAbort);
  try {
    const results = await Promise.allSettled(
      Array.from(
        { length: Math.min(FILES_AT_ONCE, queue.length) },
        async () => {
          for (let file = queue.shift(); file; file = queue.shift()) {
            lanes.signal.throwIfAborted();
            try {
              await downloadFile(file);
            } catch (error) {
              lanes.abort(error);
              throw error;
            }
          }
        },
      ),
    );
    const failed = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failed) throw signal.aborted ? signal.reason : failed.reason;
  } finally {
    signal.removeEventListener("abort", onAbort);
  }

  manifest = { ...manifest, completedAt: new Date().toISOString() };
  await save();
  return manifest;
}
