import {
  CheckCircle2,
  Download,
  FolderOpen,
  HardDrive,
  Pause,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  type DownloadProgress,
  ensurePermission,
  pickRootFolder,
  readLibrary,
  runDownload,
  supportsFolderAccess,
} from "./downloader";
import {
  compareRevision,
  getCommits,
  getModelInfo,
  getTree,
  type HubCommit,
  isRepoId,
  type RevisionStatus,
} from "./hf";
import {
  createManifest,
  describeFolder,
  folderNameFor,
  type LibraryEntry,
  type ModelManifest,
  manifestProgress,
  manifestStatus,
  mergePackage,
} from "./manifest";
import { formatBytes, formatDuration, sizeProfileFor } from "./profiles";
import {
  type GgufVariant,
  listGgufVariants,
  type ModelPackage,
  type RepoFile,
  recommendVariant,
  selectGgufPackage,
  selectSafetensorsPackage,
} from "./selection";
import { loadRootHandle, putInventory, saveRootHandle } from "./store";
import "./local-models.css";

const FULL = "__full__";

type Analysis = {
  repo: string;
  sha: string;
  date: string | null;
  license: string | null;
  baseModel: string | null;
  files: RepoFile[];
  variants: GgufVariant[];
  hasFull: boolean;
};

type VersionCheck = {
  status: RevisionStatus;
  latest: HubCommit | null;
};

const STATUS_LABELS = {
  complete: "Completo",
  partial: "Incompleto (reanudable)",
  failed: "Con errores",
} as const;

/**
 * Downloads a Hugging Face model into a folder the user picks (File System
 * Access API), resumable and integrity-checked, and tracks versions of what
 * is already stored. Nothing is ever deleted automatically.
 */
export function LocalModelManager() {
  const [params] = useSearchParams();
  const [root, setRoot] = useState<FileSystemDirectoryHandle | null>(null);
  const [repo, setRepo] = useState(params.get("model") ?? "");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [choice, setChoice] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [checks, setChecks] = useState<Record<string, VersionCheck>>({});
  const abortRef = useRef<AbortController | null>(null);
  const supported = supportsFolderAccess();

  const refreshLibrary = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      setLibrary(await readLibrary(handle));
    },
    [],
  );

  useEffect(() => {
    if (!supported) return;
    loadRootHandle()
      .then(async (handle) => {
        if (handle && (await ensurePermission(handle, false))) {
          setRoot(handle);
          await refreshLibrary(handle);
        }
      })
      .catch(() => undefined);
  }, [supported, refreshLibrary]);

  async function chooseFolder() {
    setError(null);
    try {
      const handle = await pickRootFolder();
      await saveRootHandle(handle);
      setRoot(handle);
      await refreshLibrary(handle);
    } catch (cause) {
      if ((cause as Error).name !== "AbortError")
        setError((cause as Error).message);
    }
  }

  async function analyze(target = repo) {
    const id = target.trim();
    if (!isRepoId(id)) {
      setError("Escribe un repositorio con el formato organización/modelo.");
      return;
    }
    setBusy(true);
    setError(null);
    setAnalysis(null);
    try {
      const info = await getModelInfo(id);
      const [files, commits] = await Promise.all([
        getTree(id, info.sha),
        getCommits(id).catch(() => [] as HubCommit[]),
      ]);
      const variants = listGgufVariants(files);
      const hasFull = selectSafetensorsPackage(files) !== null;
      if (!variants.length && !hasFull)
        throw new Error(
          "Este repositorio no publica pesos GGUF ni safetensors descargables.",
        );
      setAnalysis({
        repo: id,
        sha: info.sha,
        date: commits[0]?.date ?? info.updatedAt,
        license: info.meta.license ?? null,
        baseModel: info.meta.baseModel ?? null,
        files,
        variants,
        hasFull,
      });
      setChoice(recommendVariant(variants)?.id ?? FULL);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Analyze automatically when arriving from a model sheet (?model=).
  const initial = useRef(params.get("model"));
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    if (initial.current) analyze(initial.current);
  }, []);

  function packageFor(a: Analysis): ModelPackage | null {
    return choice === FULL
      ? selectSafetensorsPackage(a.files)
      : selectGgufPackage(a.files, choice);
  }

  async function download(manifestOverride?: LibraryEntry) {
    if (!root) return;
    setError(null);
    if (!(await ensurePermission(root, true))) {
      setError("Sin permiso de escritura en la carpeta elegida.");
      return;
    }
    let folder: string;
    let manifest: ModelManifest;
    if (manifestOverride) {
      folder = manifestOverride.folder;
      manifest = manifestOverride.manifest;
    } else {
      if (!analysis) return;
      const pkg = packageFor(analysis);
      if (!pkg) return;
      const now = new Date().toISOString();
      const context = describeFolder(library, analysis.repo, analysis.sha);
      folder =
        context.sameRevision?.folder ??
        folderNameFor(analysis.repo, analysis.sha);
      manifest = context.sameRevision
        ? mergePackage(context.sameRevision.manifest, pkg, now).manifest
        : createManifest({
            repo: analysis.repo,
            revision: analysis.sha,
            revisionDate: analysis.date,
            license: analysis.license,
            baseModel: analysis.baseModel,
            pkg,
            now,
          });
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    try {
      const result = await runDownload({
        root,
        folder,
        manifest,
        signal: controller.signal,
        onProgress: setProgress,
      });
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
      });
    } catch (cause) {
      if ((cause as Error).name !== "AbortError")
        setError((cause as Error).message);
    } finally {
      abortRef.current = null;
      setBusy(false);
      setProgress(null);
      await refreshLibrary(root);
    }
  }

  async function checkVersion(entry: LibraryEntry) {
    try {
      const [info, commits] = await Promise.all([
        getModelInfo(entry.manifest.repo),
        getCommits(entry.manifest.repo).catch(() => [] as HubCommit[]),
      ]);
      setChecks((current) => ({
        ...current,
        [entry.folder]: {
          status: compareRevision(entry.manifest.revision, info.sha),
          latest: commits[0] ?? null,
        },
      }));
    } catch {
      setChecks((current) => ({
        ...current,
        [entry.folder]: { status: "unknown", latest: null },
      }));
    }
  }

  const pkg = analysis ? packageFor(analysis) : null;
  const pct = progress?.total ? (progress.done / progress.total) * 100 : 0;
  const eta =
    progress && progress.bytesPerSecond > 0
      ? (progress.total - progress.done) / progress.bytesPerSecond
      : null;

  return (
    <section className="lm-manager" aria-labelledby="lm-title">
      <header className="lm-head">
        <div>
          <h2 id="lm-title">
            <HardDrive aria-hidden /> Descargar modelo a mi carpeta
          </h2>
          <p>
            Descarga todos los archivos necesarios desde Hugging Face a una
            carpeta tuya. Se puede pausar y reanudar, verifica SHA-256 y no
            duplica archivos. Nunca borra versiones anteriores.
          </p>
        </div>
        {supported ? (
          <button type="button" className="lm-btn" onClick={chooseFolder}>
            <FolderOpen aria-hidden />
            {root ? `Carpeta: ${root.name}` : "Elegir carpeta"}
          </button>
        ) : null}
      </header>

      {!supported ? (
        <p className="lm-note" role="status">
          Este navegador no permite elegir carpetas. Usa Chrome o Edge de
          escritorio para descargar modelos.
        </p>
      ) : (
        <>
          <form
            className="lm-form"
            onSubmit={(event) => {
              event.preventDefault();
              analyze();
            }}
          >
            <Search aria-hidden />
            <input
              aria-label="Repositorio de Hugging Face"
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="organización/modelo · ej. Qwen/Qwen3-4B-GGUF"
            />
            <button type="submit" className="lm-btn" disabled={busy}>
              Analizar
            </button>
          </form>

          {error ? (
            <p className="lm-error" role="alert">
              {error}
            </p>
          ) : null}

          {analysis ? (
            <div className="lm-analysis">
              <p className="lm-mono">
                {analysis.repo} @ {analysis.sha.slice(0, 8)}
                {analysis.date ? ` · ${analysis.date.slice(0, 10)}` : ""}
                {analysis.license ? ` · licencia ${analysis.license}` : ""}
              </p>
              <label>
                Paquete
                <select
                  value={choice}
                  onChange={(event) => setChoice(event.target.value)}
                >
                  {analysis.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      GGUF {v.id} · {formatBytes(v.bytes)} ·{" "}
                      {sizeProfileFor(v.bytes).label}
                    </option>
                  ))}
                  {analysis.hasFull ? (
                    <option value={FULL}>
                      Modelo completo (safetensors, todos los archivos)
                    </option>
                  ) : null}
                </select>
              </label>
              {pkg ? (
                <p className="lm-note">
                  {pkg.files.length} archivos · {formatBytes(pkg.totalBytes)} ·
                  perfil {sizeProfileFor(pkg.totalBytes).label} (
                  {sizeProfileFor(pkg.totalBytes).range})
                </p>
              ) : null}
              <div className="lm-actions">
                <button
                  type="button"
                  className="lm-btn lm-btn-primary"
                  disabled={!root || !pkg || busy}
                  onClick={() => download()}
                >
                  <Download aria-hidden />
                  {root ? "Descargar" : "Elige una carpeta primero"}
                </button>
                {busy && abortRef.current ? (
                  <button
                    type="button"
                    className="lm-btn"
                    onClick={() => abortRef.current?.abort()}
                  >
                    <Pause aria-hidden /> Pausar
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {progress ? (
            <div className="lm-progress" aria-live="polite">
              <div className="lm-bar">
                <i style={{ inlineSize: `${pct}%` }} />
              </div>
              <p className="lm-mono">
                {progress.phase === "verifying" ? "Verificando" : "Descargando"}{" "}
                {progress.fileIndex + 1}/{progress.fileCount} · {progress.file}{" "}
                · {formatBytes(progress.done)} / {formatBytes(progress.total)} ·{" "}
                {formatBytes(progress.bytesPerSecond)}/s · faltan{" "}
                {formatDuration(eta)}
              </p>
            </div>
          ) : null}

          {root ? (
            <div className="lm-library">
              <h3>Mi biblioteca de modelos ({library.length})</h3>
              {library.length === 0 ? (
                <p className="lm-note">
                  Aún no hay modelos descargados en esta carpeta.
                </p>
              ) : (
                <ul>
                  {library.map((entry) => {
                    const status = manifestStatus(entry.manifest);
                    const p = manifestProgress(entry.manifest);
                    const check = checks[entry.folder];
                    return (
                      <li key={entry.folder}>
                        <div>
                          <strong>{entry.manifest.repo}</strong>
                          <small className="lm-mono">
                            {entry.manifest.variant ?? entry.manifest.format} ·
                            rev {entry.manifest.revision.slice(0, 8)} ·{" "}
                            {formatBytes(entry.manifest.totalBytes)}
                          </small>
                        </div>
                        <span className={`lm-state lm-${status}`}>
                          {status === "complete" ? (
                            <CheckCircle2 aria-hidden />
                          ) : null}
                          {STATUS_LABELS[status]}
                          {status !== "complete"
                            ? ` · ${Math.round((p.done / Math.max(p.total, 1)) * 100)}%`
                            : ""}
                        </span>
                        <div className="lm-row-actions">
                          {status !== "complete" ? (
                            <button
                              type="button"
                              className="lm-btn"
                              disabled={busy}
                              onClick={() => download(entry)}
                            >
                              Reanudar
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="lm-btn"
                            onClick={() => checkVersion(entry)}
                          >
                            <RefreshCw aria-hidden /> Versión
                          </button>
                        </div>
                        {check ? (
                          <p className={`lm-version lm-v-${check.status}`}>
                            {check.status === "current"
                              ? "Al día con la última revisión publicada."
                              : check.status === "update-available"
                                ? `Hay una revisión nueva${check.latest ? `: «${check.latest.title}»${check.latest.date ? ` (${check.latest.date.slice(0, 10)})` : ""}` : ""}. Tu versión se conserva.`
                                : "No se pudo comprobar la versión."}
                            {check.status === "update-available" ? (
                              <button
                                type="button"
                                className="lm-link"
                                onClick={() => {
                                  setRepo(entry.manifest.repo);
                                  analyze(entry.manifest.repo);
                                }}
                              >
                                Preparar descarga de la nueva versión
                              </button>
                            ) : null}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
