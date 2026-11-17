import { useQuery } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormatPackage, HubModel } from "../../../lib/models/hub";
import {
  accelFor,
  conversionSearchUrl,
  suggestRuntimes,
} from "../../../lib/models/runtime";
import { COMPAT_LABELS } from "../local-models/compat";
import { isDownloading, useDownloads } from "../local-models/downloadManager";
import { listInventory } from "../local-models/store";
import {
  detectMyPc,
  type StoredHardware,
  useHardwareProfile,
} from "../local-models/useHardwareProfile";
import { type FitOption, fitOptions, quickFit, recommendOption } from "./fit";
import { fmtGb, fmtParams, ModelIdentity } from "./shared";
import "./models-hub.css";
import "./models-fit.css";

const PLATFORM_LABEL: Record<string, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  android: "Android",
  ios: "iOS",
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/* ------------------------------------------------------------------------ */

/**
 * Download call-to-action. It reflects the real state of the model in the
 * local library (downloading with %, paused, stored) and animates the hand-off
 * to «Open y local», where the download actually happens.
 */
export function DownloadCta({ model }: { model: HubModel }) {
  const navigate = useNavigate();
  const jobs = useDownloads();
  const [launching, setLaunching] = useState(false);
  const inventory = useQuery({
    queryKey: ["local-inventory"],
    queryFn: () => listInventory().catch(() => []),
    staleTime: 15_000,
  });
  const job = jobs.find((j) => j.repo === model.id);
  const stored = inventory.data?.find((i) => i.repo === model.id && i.complete);
  const running = job ? isDownloading(job.folder) : false;
  const total = job?.progress?.total ?? job?.totalBytes ?? 0;
  const pct = job?.progress && total ? (job.progress.done / total) * 100 : 0;

  const state = launching
    ? "launching"
    : running
      ? "downloading"
      : job?.status === "paused"
        ? "paused"
        : stored || job?.status === "done"
          ? "stored"
          : "idle";

  const label = {
    idle: "Descargar a mi PC",
    launching: "Abriendo Open y local…",
    downloading: `Descargando · ${pct.toFixed(0)} %`,
    paused: "Descarga en pausa · reanudar",
    stored: "Ya está en tu biblioteca",
  }[state];
  const sub = {
    idle: "Elige cuantización y carpeta en el siguiente paso",
    launching: "Preparando el análisis del repositorio",
    downloading: job?.variant ?? "",
    paused: job?.variant ?? "",
    stored: stored?.variant ?? job?.variant ?? "Ver o actualizar versión",
  }[state];

  function go() {
    const target = `/open-local?model=${encodeURIComponent(model.id)}#descargar`;
    if (prefersReducedMotion()) {
      navigate(target);
      return;
    }
    setLaunching(true);
    window.setTimeout(() => navigate(target), 520);
  }

  return (
    <div className="mh-dl-wrap">
      <button
        type="button"
        className="mh-dl"
        data-state={state}
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
        aria-busy={state === "launching" || state === "downloading"}
        onClick={go}
      >
        <span className="mh-dl-icon" aria-hidden>
          {state === "stored" ? (
            <CheckCircle2 />
          ) : state === "downloading" ? (
            <Loader2 className="mh-spin" />
          ) : (
            <Download />
          )}
          <i className="mh-dl-tray" />
        </span>
        <span className="mh-dl-text">
          <strong>{label}</strong>
          {sub ? <small>{sub}</small> : null}
        </span>
      </button>
      <p className="mh-dl-where">
        <HardDrive aria-hidden />
        <span>
          Se descarga en <Link to="/open-local#descargar">Open y local</Link>,
          en la carpeta que elijas · reanudable y verificada.
        </span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function HardwareChips({ profile }: { profile: StoredHardware }) {
  return (
    <ul className="mh-hw-chips">
      <li>
        <small>Sistema</small>
        <strong>
          {profile.platform ? PLATFORM_LABEL[profile.platform] : "Sin dato"}
        </strong>
      </li>
      <li>
        <small>CPU</small>
        <strong>{profile.cores ? `${profile.cores} hilos` : "Sin dato"}</strong>
      </li>
      <li>
        <small>GPU</small>
        <strong title={profile.gpuName ?? undefined}>
          {profile.gpuVendor
            ? profile.gpuVendor.toUpperCase()
            : "No identificada"}
        </strong>
      </li>
      <li>
        <small>Aceleración</small>
        <strong>{accelFor(profile.gpuVendor, profile.platform)}</strong>
      </li>
    </ul>
  );
}

function GibInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  hint: string;
}) {
  return (
    <label className="mh-hw-input">
      <span>{label}</span>
      <span className="mh-hw-field">
        <input
          type="number"
          min={0}
          max={1024}
          step={1}
          inputMode="numeric"
          value={value ?? ""}
          placeholder="?"
          onChange={(event) => {
            const parsed = Number.parseFloat(event.target.value);
            onChange(Number.isFinite(parsed) && parsed >= 0 ? parsed : null);
          }}
        />
        <em>GB</em>
      </span>
      <small>{hint}</small>
    </label>
  );
}

function verdictText(option: FitOption) {
  const where =
    option.result.target === "gpu"
      ? "en la GPU"
      : option.result.target === "hybrid"
        ? "entre GPU y RAM"
        : option.result.target === "cpu"
          ? "en CPU"
          : "";
  return `${COMPAT_LABELS[option.result.level]}${where ? ` · ${where}` : ""}`;
}

/** Short family keyword used to search related videos («Qwen», «phi»…). */
export function videoTopic(model: HubModel): string {
  const source = model.baseModels[0]?.split("/").pop() ?? model.name;
  return source.match(/^[A-Za-z]+/)?.[0] ?? source;
}

/**
 * «¿Corre en mi PC?»: optional hardware detection, verdict per quantization,
 * the programs that can run it on this machine and lighter alternatives.
 */
export function PcFit({
  model,
  packages,
  alternatives,
  onSelect,
}: {
  model: HubModel;
  packages: FormatPackage[] | null;
  alternatives: HubModel[];
  onSelect?: (id: string) => void;
}) {
  const { profile, update, forget } = useHardwareProfile();
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showAllRuntimes, setShowAllRuntimes] = useState(false);

  async function detect() {
    setDetecting(true);
    setError(null);
    try {
      await detectMyPc();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setDetecting(false);
    }
  }

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  const hardware = {
    ramGib: profile?.ramGib ?? null,
    vramGib: profile?.vramGib ?? null,
  };
  const options = profile ? fitOptions(model, packages, hardware) : [];
  const best = recommendOption(options);
  const formats = packages?.length
    ? [...new Set(packages.map((p) => p.format))]
    : model.formats;
  const runnableLocally = formats.some((f) => f === "gguf" || f === "mlx");
  const runtimes = suggestRuntimes({
    repo: model.id,
    formats,
    pipelineTag: model.pipelineTag,
    quant: formats.includes("gguf") ? (best?.label ?? "Q4_K_M") : null,
    hardware: {
      platform: profile?.platform ?? null,
      gpuVendor: profile?.gpuVendor ?? null,
      vramGib: profile?.vramGib ?? null,
    },
  });
  const fitting = profile
    ? alternatives
        .filter((alt) => alt.id !== model.id)
        .filter((alt) => quickFit(alt, hardware)?.level === "compatible")
        .slice(0, 3)
    : [];
  const currentFits = best?.result.level === "compatible";

  return (
    <section className="mh-sheet-section mh-fit" aria-labelledby="mh-fit-title">
      <h3 id="mh-fit-title">
        <Cpu aria-hidden /> ¿Corre en mi PC?
      </h3>

      {!profile ? (
        <div className="mh-fit-intro">
          <p>
            Te dice qué cuantización bajar, con qué programa y qué modelos te
            quedan mejor. Nada sale de tu equipo.
          </p>
          <button
            type="button"
            className="mh-btn mh-btn-primary"
            onClick={detect}
            disabled={detecting}
          >
            {detecting ? (
              <Loader2 className="mh-spin" aria-hidden />
            ) : (
              <Search aria-hidden />
            )}
            {detecting ? "Detectando…" : "Detectar mi PC"}
          </button>
          {error ? <p className="mh-muted">{error}</p> : null}
        </div>
      ) : (
        <>
          <HardwareChips profile={profile} />
          <div className="mh-hw-inputs">
            <GibInput
              label="RAM"
              value={profile.ramGib}
              onChange={(ramGib) => update({ ramGib })}
              hint={
                profile.ramCapped
                  ? "El navegador limita a 8 GB: corrige si tienes más."
                  : "Administrador de tareas → Rendimiento."
              }
            />
            <GibInput
              label={profile.gpuVendor === "apple" ? "Memoria GPU" : "VRAM"}
              value={profile.vramGib}
              onChange={(vramGib) => update({ vramGib })}
              hint={
                profile.gpuVendor === "apple"
                  ? "Memoria unificada: ~2/3 de la RAM."
                  : "0 si la GPU es integrada."
              }
            />
            <div className="mh-hw-tools">
              <button
                type="button"
                className="mh-link-btn"
                onClick={detect}
                disabled={detecting}
              >
                <RefreshCw aria-hidden /> Volver a detectar
              </button>
              <button type="button" className="mh-link-btn" onClick={forget}>
                Olvidar mi PC
              </button>
            </div>
          </div>

          {options.length === 0 ? (
            <p className="mh-muted">
              Sin parámetros ni archivos GGUF publicados: no se puede estimar la
              memoria de este modelo.
            </p>
          ) : (
            <>
              <div
                className="mh-verdict"
                data-level={best?.result.level ?? "storage-only"}
              >
                {best ? (
                  <>
                    <strong>
                      Recomendado para tu PC: {best.label} · {fmtGb(best.bytes)}
                    </strong>
                    <span>
                      {verdictText(best)}. {best.result.reason}
                    </span>
                    {best.fileName ? (
                      <small className="mh-mono">
                        Archivo: {best.fileName}
                      </small>
                    ) : (
                      <small>
                        Tamaño estimado: el repositorio no publica GGUF propio.
                      </small>
                    )}
                  </>
                ) : (
                  <>
                    <strong>No cabe en tu equipo</strong>
                    <span>
                      Ninguna cuantización entra en tu RAM + VRAM con 4 096
                      tokens de contexto. Mira las alternativas de abajo.
                    </span>
                  </>
                )}
              </div>
              <table className="mh-mini-table mh-fit-table">
                <thead>
                  <tr>
                    <th>Cuantización</th>
                    <th>Archivo</th>
                    <th>Memoria</th>
                    <th>En tu PC</th>
                  </tr>
                </thead>
                <tbody>
                  {options.slice(0, 12).map((option) => (
                    <tr
                      key={option.label}
                      aria-current={option === best ? "true" : undefined}
                    >
                      <td className="mh-mono">
                        {option.label}
                        {option === best ? " ★" : ""}
                      </td>
                      <td className="mh-mono">
                        {fmtGb(option.bytes)}
                        {option.measured ? "" : "*"}
                      </td>
                      <td className="mh-mono">
                        {fmtGb(option.result.estimate.totalBytes)}
                      </td>
                      <td>
                        <span
                          className="mh-level"
                          data-level={option.result.level}
                        >
                          <i aria-hidden /> {COMPAT_LABELS[option.result.level]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mh-muted">
                Memoria = pesos + caché de contexto (4 096 tokens) + margen del
                programa. Estimación, no medición.
                {options.some((o) => !o.measured)
                  ? " * tamaño calculado desde los parámetros."
                  : ""}
              </p>
            </>
          )}
        </>
      )}

      <h4 className="mh-h4">Con qué ejecutarlo</h4>
      {!runnableLocally ? (
        <p className="mh-fit-warn">
          Este repositorio no publica GGUF ni MLX: para usarlo en una app de
          escritorio busca una conversión.{" "}
          <a
            href={conversionSearchUrl(model.id, "gguf")}
            target="_blank"
            rel="noreferrer"
          >
            Buscar versión GGUF <ExternalLink aria-hidden />
          </a>
        </p>
      ) : null}
      {runtimes.length ? (
        <ul className="mh-runtimes">
          {runtimes.slice(0, showAllRuntimes ? 6 : 3).map((runtime, index) => (
            <li key={runtime.id} data-fits={runtime.fits || undefined}>
              <div className="mh-runtime-head">
                <strong>
                  {runtime.name}
                  {index === 0 && runtime.fits && profile ? (
                    <span className="mh-best">Ideal para tu equipo</span>
                  ) : null}
                </strong>
                <small>
                  {runtime.kind === "app"
                    ? "App de escritorio"
                    : runtime.kind === "cli"
                      ? "Línea de comandos"
                      : "Librería"}{" "}
                  · {runtime.accel}
                </small>
              </div>
              <p>
                {runtime.note}{" "}
                <span className={runtime.fits ? "" : "mh-warn-text"}>
                  {runtime.reason}
                </span>
              </p>
              <div className="mh-runtime-actions">
                {runtime.commandText ? (
                  <>
                    <code>{runtime.commandText}</code>
                    <button
                      type="button"
                      className="mh-link-btn"
                      onClick={() =>
                        copy(runtime.id, runtime.commandText ?? "")
                      }
                    >
                      {copied === runtime.id ? (
                        <Check aria-hidden />
                      ) : (
                        <Copy aria-hidden />
                      )}
                      {copied === runtime.id ? "Copiado" : "Copiar"}
                    </button>
                  </>
                ) : null}
                <a href={runtime.url} target="_blank" rel="noreferrer">
                  Descargar {runtime.name} <ExternalLink aria-hidden />
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {runtimes.length > 3 ? (
        <button
          type="button"
          className="mh-link-btn"
          onClick={() => setShowAllRuntimes((v) => !v)}
          aria-expanded={showAllRuntimes}
        >
          {showAllRuntimes
            ? "Ver menos programas"
            : `Ver ${Math.min(runtimes.length, 6) - 3} programas más`}
        </button>
      ) : null}
      {runtimes.length ? null : (
        <p className="mh-muted">
          No hay un programa local conocido para el tipo de tarea «
          {model.pipelineTag ?? "sin declarar"}» con estos formatos.
        </p>
      )}

      {profile && fitting.length ? (
        <>
          <h4 className="mh-h4">
            {currentFits
              ? "Otras opciones que también corren bien en tu PC"
              : "Modelos más adaptados a tu PC"}
          </h4>
          <ul className="mh-alts">
            {fitting.map((alt) => (
              <li key={alt.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(alt.id)}
                  disabled={!onSelect}
                >
                  <ModelIdentity model={alt} />
                  <span className="mh-mono">
                    {fmtParams(alt.parameters)} ·{" "}
                    {fmtGb(alt.estimatedPackageBytes)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
