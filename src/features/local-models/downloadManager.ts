/**
 * App-wide download queue. Jobs live at module level, so they keep running
 * while the user switches tabs or modules inside AMARU, and several models
 * can download at the same time. Closing the browser tab pauses them (the
 * manifest keeps what arrived, so they resume later).
 */
import { useSyncExternalStore } from "react";
import { type DownloadProgress, runDownload } from "./downloader";
import { type ModelManifest, manifestStatus } from "./manifest";
import { putInventory } from "./store";

export type JobStatus = "running" | "done" | "paused" | "error";

export type DownloadJob = {
  folder: string;
  repo: string;
  variant: string | null;
  totalBytes: number;
  status: JobStatus;
  progress: DownloadProgress | null;
  error: string | null;
  finishedAt: number | null;
};

const jobs = new Map<string, DownloadJob>();
const controllers = new Map<string, AbortController>();
const listeners = new Set<() => void>();
let snapshot: DownloadJob[] = [];

function emit() {
  snapshot = [...jobs.values()];
  for (const listener of listeners) listener();
}

function patch(folder: string, update: Partial<DownloadJob>) {
  const current = jobs.get(folder);
  if (!current) return;
  jobs.set(folder, { ...current, ...update });
  emit();
}

function guardUnload(event: BeforeUnloadEvent) {
  if (snapshot.some((job) => job.status === "running")) event.preventDefault();
}
if (typeof window !== "undefined")
  window.addEventListener("beforeunload", guardUnload);

export function isDownloading(folder: string): boolean {
  return jobs.get(folder)?.status === "running";
}

export function startDownload(input: {
  root: FileSystemDirectoryHandle;
  folder: string;
  manifest: ModelManifest;
}): void {
  const { root, folder, manifest } = input;
  if (isDownloading(folder)) return;
  const controller = new AbortController();
  controllers.set(folder, controller);
  jobs.set(folder, {
    folder,
    repo: manifest.repo,
    variant: manifest.variant ?? manifest.format,
    totalBytes: manifest.totalBytes,
    status: "running",
    progress: null,
    error: null,
    finishedAt: null,
  });
  emit();
  runDownload({
    root,
    folder,
    manifest,
    signal: controller.signal,
    onProgress: (progress) => patch(folder, { progress }),
  })
    .then(async (result) => {
      await putInventory({
        folder,
        repo: result.repo,
        revision: result.revision,
        variant: result.variant,
        format: result.format,
        totalBytes: result.totalBytes,
        complete: manifestStatus(result) === "complete",
        state: "stored",
        ollamaName: null,
        updatedAt: result.updatedAt,
      }).catch(() => undefined);
      patch(folder, { status: "done", finishedAt: Date.now() });
    })
    .catch((error: Error) => {
      const paused = controller.signal.aborted;
      patch(folder, {
        status: paused ? "paused" : "error",
        error: paused ? null : error.message,
        finishedAt: Date.now(),
      });
    })
    .finally(() => controllers.delete(folder));
}

export function pauseDownload(folder: string): void {
  controllers.get(folder)?.abort(new DOMException("Pausado", "AbortError"));
}

export function dismissDownload(folder: string): void {
  if (isDownloading(folder)) return;
  jobs.delete(folder);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDownloads(): DownloadJob[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
}
