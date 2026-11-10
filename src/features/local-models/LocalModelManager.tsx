import {
  CheckCircle2,
  Download,
  FolderOpen,
  HardDrive,
  Pause,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ensurePermission,
  pickRootFolder,
  readLibrary,
  supportsFolderAccess,
} from "./downloader";
import {
  type DownloadJob,
  dismissDownload,
  isDownloading,
  pauseDownload,
  startDownload,
  useDownloads,
} from "./downloadManager";
import { explainQuant, FORMAT_TERMS, runtimeMemoryHint } from "./glossary";
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
import { loadRootHandle, saveRootHandle } from "./store";
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
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [checks, setChecks] = useState<Record<string, VersionCheck>>({});
  const supported = supportsFolderAccess();
  const jobs = useDownloads();

  const refreshLibrary = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      setLibrary(await readLibrary(handle));
    },
    [],
  );

  // Re-read the library whenever a background job finishes or pauses.
  const finishedKey = jobs
    .filter((job) => job.status !== "running")
    .map((job) => `${job.folder}:${job.finishedAt}`)
    .join("|");
  useEffect(() => {
    if (root && finishedKey) refreshLibrary(root).catch(() => undefined);
  }, [root, finishedKey, refreshLibrary]);

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
    if (isDownloading(folder)) {
      setError("Ese modelo ya se está descargando.");
      return;
    }
    startDownload({ root, folder, manifest });
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
  const quant = choice && choice !== FULL ? explainQuant(choice) : null;
  const format = FORMAT_TERMS[choice === FULL ? "safetensors" : "gguf"];

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
              <aside className="lm-explain" aria-label="Qué significa">
                <h4>¿Qué significa?</h4>
                <dl>
                  <dt>{format.term}</dt>
                  <dd>{format.text}</dd>
                  {quant ? (
                    <>
                      <dt>{quant.term}</dt>
                      <dd>{quant.text}</dd>
                      <dt>Calidad</dt>
                      <dd>{quant.quality}</dd>
                      <dt>Recomendado para</dt>
                      <dd>{quant.use}</dd>
                    </>
                  ) : null}
                  {pkg ? (
                    <>
                      <dt>Perfil {sizeProfileFor(pkg.totalBytes).label}</dt>
                      <dd>
                        {sizeProfileFor(pkg.totalBytes).hint}{" "}
                        {runtimeMemoryHint(pkg.totalBytes)}
                      </dd>
                    </>
                  ) : null}
                </dl>
              </aside>
              <div className="lm-actions">
                <button
                  type="button"
                  className="lm-btn lm-btn-primary"
                  disabled={!root || !pkg}
                  onClick={() => download()}
                >
                  <Download aria-hidden />
                  {root ? "Descargar" : "Elige una carpeta primero"}
                </button>
                <span className="lm-note">
                  Puedes lanzar varias descargas y seguir navegando: continúan
                  en segundo plano.
                </span>
              </div>
            </div>
          ) : null}

          {jobs.length ? (
            <ul className="lm-jobs" aria-live="polite">
              {jobs.map((job) => (
                <JobRow key={job.folder} job={job} />
              ))}
            </ul>
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
                              disabled={isDownloading(entry.folder)}
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

const JOB_LABELS = {
  running: "Descargando",
  done: "Completado",
  paused: "En pausa",
  error: "Error",
} as const;

/** One background download with live progress and pause/close controls. */
function JobRow({ job }: { job: DownloadJob }) {
  const p = job.progress;
  const total = p?.total ?? job.totalBytes;
  const done = job.status === "done" ? total : (p?.done ?? 0);
  const pct = total ? (done / total) * 100 : 0;
  const eta =
    p && p.bytesPerSecond > 0 ? (p.total - p.done) / p.bytesPerSecond : null;
  const phase =
    job.status === "running" && p?.phase === "verifying"
      ? "Verificando SHA-256"
      : JOB_LABELS[job.status];
  return (
    <li className={`lm-job lm-job-${job.status}`}>
      <div className="lm-job-head">
        <strong>{job.repo}</strong>
        <small className="lm-mono">{job.variant}</small>
        <span className="lm-job-state">{phase}</span>
        {job.status === "running" ? (
          <button
            type="button"
            className="lm-btn"
            onClick={() => pauseDownload(job.folder)}
          >
            <Pause aria-hidden /> Pausar
          </button>
        ) : (
          <button
            type="button"
            className="lm-btn"
            aria-label="Quitar de la lista"
            onClick={() => dismissDownload(job.folder)}
          >
            <X aria-hidden />
          </button>
        )}
      </div>
      <div className="lm-bar">
        <i style={{ inlineSize: `${pct}%` }} />
      </div>
      <p className="lm-mono">
        {job.error
          ? job.error
          : `${formatBytes(done)} / ${formatBytes(total)} · ${pct.toFixed(1)} %${
              job.status === "running" && p
                ? ` · ${formatBytes(p.bytesPerSecond)}/s · faltan ${formatDuration(eta)} · archivo ${p.fileIndex + 1}/${p.fileCount}`
                : ""
            }`}
      </p>
    </li>
  );
}
