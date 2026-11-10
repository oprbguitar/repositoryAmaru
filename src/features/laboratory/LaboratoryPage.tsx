import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Beaker,
  CalendarClock,
  CheckCircle2,
  Coins,
  Copy,
  Crown,
  Dices,
  Download,
  FileJson,
  FolderOpen,
  Info,
  Lock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type {
  Alternative,
  ExpectedResult,
  PrivacyLevel,
  ProjectInputs,
} from "../../../lib/laboratory/engine";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { formatDate } from "../observatory/format";
import {
  archiveProject,
  getProject,
  type LaboratoryProjectSummary,
  listProjects,
  recommendProject,
  saveProject,
} from "./api";
import { LaboratoryTimeline } from "./LaboratoryTimeline";
import { randomProjectInputs } from "./randomProject";

const DEFAULT_INPUTS: ProjectInputs = {
  name: "",
  problem: "",
  domain: "",
  region: "Perú",
  users: {
    internal: true,
    external: false,
    estimatedCount: 5,
    technicalLevel: "basic",
    languages: ["es"],
  },
  dataTypes: [],
  dailyVolumeDocuments: 10,
  averageDocumentPages: 5,
  sensitiveData: false,
  personalData: false,
  privacy: "public_cloud",
  monthlyBudgetUsd: 50,
  freeOnly: false,
  hardware: {
    cpu: "",
    ramGb: 16,
    gpu: "",
    vramGb: 0,
    storageGb: 512,
    os: "Windows",
    dockerAvailable: false,
  },
  expectedResults: [],
};

const DATA_TYPES = [
  "Texto",
  "PDF",
  "DOCX",
  "XLSX",
  "Imágenes",
  "Audio",
  "Video",
  "Base de datos",
  "API",
  "Sitio web",
  "Carpeta local",
];

const RESULTS: Array<{ id: ExpectedResult; label: string }> = [
  { id: "chat", label: "Asistente de chat" },
  { id: "rag", label: "RAG sobre documentos" },
  { id: "document_analysis", label: "Análisis documental" },
  { id: "transcription", label: "Transcripción" },
  { id: "ocr", label: "OCR" },
  { id: "classification", label: "Clasificación" },
  { id: "dashboard", label: "Dashboard" },
  { id: "agent", label: "Agente" },
  { id: "voice", label: "Asistente de voz" },
  { id: "image_analysis", label: "Análisis de imágenes" },
  { id: "automation", label: "Automatización" },
];

const PRIVACY_OPTIONS: Array<{ id: PrivacyLevel; label: string }> = [
  { id: "public_cloud", label: "Nube pública permitida" },
  { id: "private_cloud", label: "Nube privada" },
  { id: "local_preferred", label: "Preferencia por procesamiento local" },
  { id: "fully_offline", label: "Totalmente sin conexión" },
  { id: "confidential", label: "Confidencial / datos regulados" },
];

const STEPS = [
  "Problema",
  "Usuarios",
  "Datos",
  "Privacidad",
  "Presupuesto",
  "Hardware",
  "Resultado",
];

function exportMarkdown(name: string, alternatives: Alternative[]): string {
  const lines = [`# ${name}`, ""];
  for (const alternative of alternatives) {
    lines.push(`## ${alternative.title}`, "");
    lines.push(`- Dificultad: ${alternative.difficulty}`);
    lines.push(`- Privacidad: ${alternative.privacyLevel}`);
    lines.push(
      `- Costo mensual estimado: ${alternative.totalMonthlyUsd === null ? "sin datos" : `US$ ${alternative.totalMonthlyUsd}`}${alternative.costComplete ? "" : " (Costo parcial — faltan datos de determinados componentes)"}`,
    );
    lines.push(`- Arquitectura: ${alternative.architecture.join(" → ")}`);
    for (const model of alternative.models)
      lines.push(
        `- Modelo: ${model.title} (${model.provider}) — ${model.reason}`,
      );
    for (const repository of alternative.repositories)
      lines.push(`- Herramienta: ${repository.title} — ${repository.url}`);
    lines.push("", "### Explicación");
    lines.push(
      ...alternative.explanation.constraintsApplied.map(
        (entry) => `- Restricción aplicada: ${entry}`,
      ),
    );
    lines.push(
      ...alternative.explanation.dataSources.map(
        (entry) => `- Fuente: ${entry}`,
      ),
    );
    lines.push(
      ...alternative.explanation.missingInformation.map(
        (entry) => `- Información faltante: ${entry}`,
      ),
    );
    lines.push("");
  }
  return lines.join("\n");
}

function download(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ArchitectureDiagram({ nodes }: { nodes: string[] }) {
  return (
    <div className="architecture-diagram">
      {nodes.map((node, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: los nodos de arquitectura pueden repetirse
        <span key={`${node}-${index}`} className="architecture-node-wrap">
          <span className="architecture-node">{node}</span>
          {index < nodes.length - 1 ? (
            <span className="architecture-arrow" aria-hidden="true">
              →
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

/**
 * Un icono y un acento por tipo de alternativa. El texto descriptivo ya viene
 * en el título que produce el motor, así que aquí no se añade ninguno.
 */
const ALTERNATIVE_STYLE: Record<
  Alternative["kind"],
  { icon: typeof Coins; accent: string }
> = {
  economic: { icon: Coins, accent: "var(--ok)" },
  local: { icon: Lock, accent: "var(--info)" },
  professional: { icon: Crown, accent: "var(--purple)" },
};

function AlternativeCard({ alternative }: { alternative: Alternative }) {
  const style = ALTERNATIVE_STYLE[alternative.kind];
  const Icon = style.icon;
  return (
    <article
      className="panel alternative-card"
      style={{ "--card-accent": style.accent } as React.CSSProperties}
    >
      <header className="alternative-head">
        <span className="alternative-icon">
          <Icon />
        </span>
        <h2>{alternative.title}</h2>
      </header>
      <div className="alternative-metrics">
        <div>
          <span>Costo mensual estimado</span>
          <strong
            className={alternative.totalMonthlyUsd === null ? "unknown" : ""}
          >
            {alternative.totalMonthlyUsd === null
              ? "Sin datos suficientes"
              : `US$ ${alternative.totalMonthlyUsd}`}
          </strong>
          {alternative.costComplete ? null : (
            <em>Costo parcial — faltan datos de determinados componentes</em>
          )}
        </div>
        <div>
          <span>Dificultad</span>
          <strong>{alternative.difficulty}</strong>
        </div>
        <div>
          <span>Despliegue</span>
          <strong>{alternative.privacyLevel}</strong>
          <em>{alternative.hardwareRequirement}</em>
        </div>
      </div>
      <h3>Arquitectura</h3>
      <ArchitectureDiagram nodes={alternative.architecture} />
      {alternative.models.length ? (
        <>
          <h3>Modelos seleccionados</h3>
          {alternative.models.map((model) => (
            <p key={model.id}>
              <strong>{model.title}</strong> — {model.provider}
              <br />
              <small>{model.reason}</small>
            </p>
          ))}
        </>
      ) : (
        <p>
          Sin modelos indexados que cumplan las restricciones. Sincroniza
          modelos para obtener candidatos reales.
        </p>
      )}
      {alternative.repositories.length ? (
        <>
          <h3>Herramientas (repositorios indexados)</h3>
          {alternative.repositories.map((repository) => (
            <p key={repository.url}>
              <a href={repository.url} target="_blank" rel="noreferrer">
                {repository.title}
              </a>{" "}
              · {repository.stars.toLocaleString("es-PE")} ★
            </p>
          ))}
        </>
      ) : null}
      <h3>Costos</h3>
      {alternative.costItems.map((item) => (
        <p key={item.concept}>
          {item.concept}:{" "}
          <strong>
            {item.monthlyUsd === null ? "sin datos" : `US$ ${item.monthlyUsd}`}
          </strong>
          <br />
          <small>
            {item.formula}
            {item.source ? ` · ${item.source}` : ""}
          </small>
        </p>
      ))}
      <details open>
        <summary>Ventajas, limitaciones y riesgos</summary>
        <ul>
          {alternative.advantages.map((entry) => (
            <li key={entry}>✔ {entry}</li>
          ))}
          {alternative.limitations.map((entry) => (
            <li key={entry}>◻ {entry}</li>
          ))}
          {alternative.risks.map((entry) => (
            <li key={entry}>⚠ {entry}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary>Transparencia de la recomendación</summary>
        <ul>
          {alternative.explanation.constraintsApplied.map((entry) => (
            <li key={entry}>Restricción: {entry}</li>
          ))}
          {alternative.explanation.dataSources.map((entry) => (
            <li key={entry}>Fuente: {entry}</li>
          ))}
          {alternative.explanation.missingInformation.map((entry) => (
            <li key={entry}>Faltante: {entry}</li>
          ))}
          <li>Confianza: {alternative.explanation.confidence}</li>
        </ul>
      </details>
      <h3>Etapas</h3>
      <ol>
        {alternative.stages.map((stage) => (
          <li key={stage}>{stage}</li>
        ))}
      </ol>
    </article>
  );
}

export function LaboratoryPage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<ProjectInputs>(DEFAULT_INPUTS);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const projects = useQuery({
    queryKey: ["laboratory-projects"],
    queryFn: listProjects,
  });
  const activeProject = useQuery({
    queryKey: ["laboratory-project", activeProjectId],
    queryFn: () => getProject(activeProjectId ?? ""),
    enabled: Boolean(activeProjectId),
  });

  const save = useMutation({
    mutationFn: (payload: {
      id?: string;
      name: string;
      inputs: ProjectInputs;
    }) => saveProject(payload),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["laboratory-projects"],
      });
      const id = result.data?.id;
      if (id) {
        setActiveProjectId(id);
        await recommendProject(id);
        await queryClient.invalidateQueries({
          queryKey: ["laboratory-project", id],
        });
      }
      setWizardOpen(false);
      setStep(0);
    },
  });
  const recalculate = useMutation({
    mutationFn: (id: string) => recommendProject(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["laboratory-project", activeProjectId],
      }),
  });
  const archive = useMutation({
    mutationFn: (id: string) => archiveProject(id),
    onSuccess: () => {
      setActiveProjectId(null);
      queryClient.invalidateQueries({ queryKey: ["laboratory-projects"] });
    },
  });

  function update<K extends keyof ProjectInputs>(
    key: K,
    value: ProjectInputs[K],
  ) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function startNew() {
    setInputs(DEFAULT_INPUTS);
    setEditingId(undefined);
    setStep(0);
    setWizardOpen(true);
  }

  function startRandom() {
    const generated = randomProjectInputs();
    setInputs(generated);
    setEditingId(undefined);
    setWizardOpen(false);
    save.mutate({ name: generated.name, inputs: generated });
  }

  function startEdit(project: LaboratoryProjectSummary) {
    if (project.inputs) setInputs(project.inputs);
    setEditingId(project.id);
    setStep(0);
    setWizardOpen(true);
  }

  function duplicate(project: LaboratoryProjectSummary) {
    if (project.inputs)
      setInputs({ ...project.inputs, name: `${project.inputs.name} (copia)` });
    setEditingId(undefined);
    setStep(0);
    setWizardOpen(true);
  }

  const savedProjects = projects.data?.data ?? [];
  const activeCount = savedProjects.filter(
    (project) => project.status === "active",
  ).length;
  const totalAlternatives = savedProjects.reduce(
    (sum, project) => sum + project.alternativeCount,
    0,
  );
  const averageAlternatives = savedProjects.length
    ? (totalAlternatives / savedProjects.length).toFixed(1).replace(".0", "")
    : "0";
  const lastUpdatedAt = savedProjects.reduce<string | null>(
    (latest, project) =>
      !latest || project.updatedAt > latest ? project.updatedAt : latest,
    null,
  );

  const detail = activeProject.data?.data;
  const alternatives = (detail?.alternatives ?? [])
    .map((entry) => entry.recommendation)
    .filter((entry): entry is Alternative => entry !== null);

  const panel = (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Info />
        <strong>Información contextual</strong>
      </div>
      <section>
        <h3>Cómo funciona</h3>
        <p>
          El motor de recomendación es determinista (versión de reglas visible
          en cada resultado) y usa exclusivamente precios de proveedores y
          modelos indexados en la base local. Cuando falta información, se
          declara.
        </p>
      </section>
      {detail ? (
        <section>
          <h3>Proyecto activo</h3>
          <dl className="context-facts">
            <dt>Nombre</dt>
            <dd>{detail.name}</dd>
            <dt>Estado</dt>
            <dd>{detail.status === "active" ? "Activo" : "Archivado"}</dd>
            <dt>Actualizado</dt>
            <dd>{formatDate(detail.updatedAt)}</dd>
            <dt>Motor</dt>
            <dd>{detail.alternatives[0]?.engineVersion ?? "—"}</dd>
            <dt>Calculado</dt>
            <dd>{formatDate(detail.alternatives[0]?.calculatedAt ?? null)}</dd>
          </dl>
        </section>
      ) : null}
    </aside>
  );

  return (
    <CollapsibleLayout storageKey="laboratory" panel={panel}>
      <header className="page-heading">
        <div>
          <h1>
            <Beaker /> Mi laboratorio
          </h1>
          <p>Tus proyectos, su historia y alternativas con datos reales.</p>
        </div>
        <div className="heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={startRandom}
            disabled={save.isPending}
            title="Genera un proyecto completo con datos aleatorios, lo guarda y calcula las tres alternativas con sus riesgos"
          >
            <Dices className={save.isPending ? "spin" : ""} />
            {save.isPending ? "Generando…" : "Proyecto aleatorio"}
          </button>
          <button type="button" className="primary-button" onClick={startNew}>
            Nuevo proyecto
          </button>
        </div>
      </header>

      <div className="laboratory-kpis">
        <article className="panel market-kpi">
          <FolderOpen />
          <div>
            <span>Total de proyectos</span>
            <strong>{savedProjects.length}</strong>
            <small>guardados en la base local</small>
          </div>
        </article>
        <article className="panel market-kpi">
          <CheckCircle2 />
          <div>
            <span>Proyectos activos</span>
            <strong>{activeCount}</strong>
            <small>
              {savedProjects.length
                ? `${Math.round((activeCount / savedProjects.length) * 100)}% del total`
                : "sin proyectos"}
            </small>
          </div>
        </article>
        <article className="panel market-kpi">
          <Sparkles />
          <div>
            <span>Alternativas calculadas</span>
            <strong>{totalAlternatives}</strong>
            <small>
              {savedProjects.length
                ? `${averageAlternatives} por proyecto`
                : "sin cálculos"}
            </small>
          </div>
        </article>
        <article className="panel market-kpi">
          <CalendarClock />
          <div>
            <span>Última actualización</span>
            <strong className="market-kpi-date">
              {lastUpdatedAt ? formatDate(lastUpdatedAt) : "—"}
            </strong>
            <small>del proyecto más reciente</small>
          </div>
        </article>
      </div>

      <section className="panel data-table-panel">
        <div className="panel-heading">
          <h2>Proyectos guardados</h2>
          <span>{savedProjects.length} proyectos</span>
        </div>
        {savedProjects.length ? (
          <div className="data-table-scroll">
            <table className="observatory-table compact-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Estado</th>
                  <th>Alternativas</th>
                  <th>Actualizado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {savedProjects.map((project) => (
                  <tr
                    key={project.id}
                    className={activeProjectId === project.id ? "selected" : ""}
                    onClick={() => setActiveProjectId(project.id)}
                  >
                    <td>
                      <strong>{project.name}</strong>
                      <small>{project.inputs?.domain ?? ""}</small>
                    </td>
                    <td>
                      <span
                        className={`state-badge ${project.status === "active" ? "verified" : "provisional"}`}
                      >
                        {project.status === "active" ? "Activo" : "Archivado"}
                      </span>
                    </td>
                    <td>{project.alternativeCount}</td>
                    <td>{formatDate(project.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          title="Editar"
                          onClick={(event) => {
                            event.stopPropagation();
                            startEdit(project);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          title="Duplicar"
                          onClick={(event) => {
                            event.stopPropagation();
                            duplicate(project);
                          }}
                        >
                          <Copy />
                        </button>
                        <button
                          type="button"
                          title="Archivar"
                          onClick={(event) => {
                            event.stopPropagation();
                            archive.mutate(project.id);
                          }}
                        >
                          <Archive />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="honest-empty">
            <h2>Aún no hay proyectos</h2>
            <p>
              Crea tu primer proyecto con el asistente: describe el problema y
              obtendrás tres alternativas con costos calculados desde precios
              indexados.
            </p>
          </div>
        )}
      </section>

      <LaboratoryTimeline
        projects={savedProjects}
        activeId={activeProjectId}
        onSelect={setActiveProjectId}
      />

      {wizardOpen ? (
        <section className="panel wizard-panel">
          <div className="panel-heading">
            <h2>
              {editingId ? "Editar proyecto" : "Nuevo proyecto"} — paso{" "}
              {step + 1} de {STEPS.length}: {STEPS[step]}
            </h2>
            <button
              type="button"
              className="secondary-button compact"
              onClick={() => setWizardOpen(false)}
            >
              Cancelar
            </button>
          </div>
          <div className="wizard-steps">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                className={
                  index === step ? "active" : index < step ? "done" : ""
                }
                onClick={() => setStep(index)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="wizard-body">
            {step === 0 ? (
              <div className="wizard-grid">
                <label>
                  Nombre del proyecto
                  <input
                    value={inputs.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="Ej. Asistente de expedientes"
                  />
                </label>
                <label>
                  Dominio
                  <input
                    value={inputs.domain}
                    onChange={(event) => update("domain", event.target.value)}
                    placeholder="Ej. Legal, Salud, Educación"
                  />
                </label>
                <label>
                  Región
                  <input
                    value={inputs.region}
                    onChange={(event) => update("region", event.target.value)}
                  />
                </label>
                <label className="wizard-wide">
                  Descripción del problema
                  <textarea
                    value={inputs.problem}
                    onChange={(event) => update("problem", event.target.value)}
                    rows={3}
                    placeholder="¿Qué proceso quieres mejorar y cuál es el dolor principal?"
                  />
                </label>
              </div>
            ) : null}
            {step === 1 ? (
              <div className="wizard-grid">
                <label>
                  <input
                    type="checkbox"
                    checked={inputs.users.internal}
                    onChange={(event) =>
                      update("users", {
                        ...inputs.users,
                        internal: event.target.checked,
                      })
                    }
                  />
                  Usuarios internos
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={inputs.users.external}
                    onChange={(event) =>
                      update("users", {
                        ...inputs.users,
                        external: event.target.checked,
                      })
                    }
                  />
                  Usuarios externos
                </label>
                <label>
                  Número estimado
                  <input
                    type="number"
                    min={1}
                    value={inputs.users.estimatedCount}
                    onChange={(event) =>
                      update("users", {
                        ...inputs.users,
                        estimatedCount: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Nivel técnico
                  <select
                    value={inputs.users.technicalLevel}
                    onChange={(event) =>
                      update("users", {
                        ...inputs.users,
                        technicalLevel: event.target
                          .value as ProjectInputs["users"]["technicalLevel"],
                      })
                    }
                  >
                    <option value="basic">Básico</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </label>
              </div>
            ) : null}
            {step === 2 ? (
              <div className="wizard-grid">
                <fieldset className="wizard-wide">
                  <legend>Tipos de datos de entrada</legend>
                  <div className="checkbox-grid">
                    {DATA_TYPES.map((type) => (
                      <label key={type}>
                        <input
                          type="checkbox"
                          checked={inputs.dataTypes.includes(type)}
                          onChange={(event) =>
                            update(
                              "dataTypes",
                              event.target.checked
                                ? [...inputs.dataTypes, type]
                                : inputs.dataTypes.filter(
                                    (entry) => entry !== type,
                                  ),
                            )
                          }
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label>
                  Documentos por día
                  <input
                    type="number"
                    min={0}
                    value={inputs.dailyVolumeDocuments}
                    onChange={(event) =>
                      update("dailyVolumeDocuments", Number(event.target.value))
                    }
                  />
                </label>
                <label>
                  Páginas promedio por documento
                  <input
                    type="number"
                    min={1}
                    value={inputs.averageDocumentPages}
                    onChange={(event) =>
                      update("averageDocumentPages", Number(event.target.value))
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={inputs.sensitiveData}
                    onChange={(event) =>
                      update("sensitiveData", event.target.checked)
                    }
                  />
                  Contiene información sensible
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={inputs.personalData}
                    onChange={(event) =>
                      update("personalData", event.target.checked)
                    }
                  />
                  Contiene datos personales (Ley peruana de protección de datos)
                </label>
              </div>
            ) : null}
            {step === 3 ? (
              <div className="wizard-grid">
                <fieldset className="wizard-wide">
                  <legend>Nivel de privacidad requerido</legend>
                  {PRIVACY_OPTIONS.map((option) => (
                    <label key={option.id}>
                      <input
                        type="radio"
                        name="privacy"
                        checked={inputs.privacy === option.id}
                        onChange={() => update("privacy", option.id)}
                      />
                      {option.label}
                    </label>
                  ))}
                </fieldset>
              </div>
            ) : null}
            {step === 4 ? (
              <div className="wizard-grid">
                <label>
                  Presupuesto mensual (US$)
                  <input
                    type="number"
                    min={0}
                    value={inputs.monthlyBudgetUsd}
                    onChange={(event) =>
                      update("monthlyBudgetUsd", Number(event.target.value))
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={inputs.freeOnly}
                    onChange={(event) =>
                      update("freeOnly", event.target.checked)
                    }
                  />
                  Solo opciones gratuitas
                </label>
              </div>
            ) : null}
            {step === 5 ? (
              <div className="wizard-grid">
                <label>
                  CPU
                  <input
                    value={inputs.hardware.cpu}
                    onChange={(event) =>
                      update("hardware", {
                        ...inputs.hardware,
                        cpu: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  RAM (GB)
                  <input
                    type="number"
                    min={0}
                    value={inputs.hardware.ramGb}
                    onChange={(event) =>
                      update("hardware", {
                        ...inputs.hardware,
                        ramGb: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  GPU
                  <input
                    value={inputs.hardware.gpu}
                    onChange={(event) =>
                      update("hardware", {
                        ...inputs.hardware,
                        gpu: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  VRAM (GB)
                  <input
                    type="number"
                    min={0}
                    value={inputs.hardware.vramGb}
                    onChange={(event) =>
                      update("hardware", {
                        ...inputs.hardware,
                        vramGb: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Sistema operativo
                  <input
                    value={inputs.hardware.os}
                    onChange={(event) =>
                      update("hardware", {
                        ...inputs.hardware,
                        os: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={inputs.hardware.dockerAvailable}
                    onChange={(event) =>
                      update("hardware", {
                        ...inputs.hardware,
                        dockerAvailable: event.target.checked,
                      })
                    }
                  />
                  Docker disponible
                </label>
              </div>
            ) : null}
            {step === 6 ? (
              <fieldset className="wizard-wide">
                <legend>Resultado esperado</legend>
                <div className="checkbox-grid">
                  {RESULTS.map((result) => (
                    <label key={result.id}>
                      <input
                        type="checkbox"
                        checked={inputs.expectedResults.includes(result.id)}
                        onChange={(event) =>
                          update(
                            "expectedResults",
                            event.target.checked
                              ? [...inputs.expectedResults, result.id]
                              : inputs.expectedResults.filter(
                                  (entry) => entry !== result.id,
                                ),
                          )
                        }
                      />
                      {result.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </div>
          <div className="wizard-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={step === 0}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
            >
              Anterior
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => setStep((value) => value + 1)}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                disabled={!inputs.name.trim() || save.isPending}
                onClick={() =>
                  save.mutate({ id: editingId, name: inputs.name, inputs })
                }
              >
                {save.isPending
                  ? "Guardando…"
                  : "Guardar y generar alternativas"}
              </button>
            )}
          </div>
        </section>
      ) : null}

      {detail && alternatives.length ? (
        <section className="alternatives-section">
          <div className="panel-heading">
            <h2>Alternativas para «{detail.name}»</h2>
            <div className="heading-actions">
              <button
                type="button"
                className="secondary-button compact"
                onClick={() => recalculate.mutate(detail.id)}
                disabled={recalculate.isPending}
              >
                <RefreshCw className={recalculate.isPending ? "spin" : ""} />
                Recalcular costos
              </button>
              <button
                type="button"
                className="secondary-button compact"
                onClick={() =>
                  download(
                    `${detail.name}.md`,
                    exportMarkdown(detail.name, alternatives),
                    "text/markdown",
                  )
                }
              >
                <Download /> Markdown
              </button>
              <button
                type="button"
                className="secondary-button compact"
                onClick={() =>
                  download(
                    `${detail.name}.json`,
                    JSON.stringify({ project: detail, alternatives }, null, 2),
                    "application/json",
                  )
                }
              >
                <FileJson /> JSON
              </button>
            </div>
          </div>
          <div className="alternatives-grid">
            {alternatives.map((alternative) => (
              <AlternativeCard
                key={alternative.kind}
                alternative={alternative}
              />
            ))}
          </div>
        </section>
      ) : detail ? (
        <div className="panel honest-empty">
          <h2>Proyecto sin alternativas calculadas</h2>
          <p>Usa «Recalcular costos» para generar las tres alternativas.</p>
        </div>
      ) : null}
    </CollapsibleLayout>
  );
}
