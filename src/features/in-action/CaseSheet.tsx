import {
  AlertTriangle,
  Cloud,
  ExternalLink,
  HardDrive,
  Lock,
  PlayCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useHardwareProfile } from "../local-models/useHardwareProfile";
import {
  fillPrompt,
  type PracticeCase,
  type Profession,
  promptFields,
  type Specialty,
} from "./professions";
import { CopyButton, entryPaidPlan, PriceTag } from "./shared";
import {
  assistantById,
  HARDWARE_TIERS,
  OFFICE_APPS,
  TASKS,
  tierFor,
  youtubeSearch,
} from "./tools";

const LEVELS = [
  { id: 1, label: "Consultar", hint: "Preguntar y obtener un primer borrador" },
  { id: 2, label: "Investigar", hint: "Fundamentar con tus fuentes y citas" },
  { id: 3, label: "Automatizar", hint: "Repetir el trabajo sin rehacerlo" },
  { id: 4, label: "Crear", hint: "Tu propia herramienta o asistente" },
] as const;

type Level = (typeof LEVELS)[number]["id"];

function commercialStep(
  level: Level,
  item: PracticeCase,
  tool: string,
  research: string | null,
) {
  const apps = item.office?.map((app) => OFFICE_APPS[app].label).join(", ");
  switch (level) {
    case 1:
      if (tool === "Microsoft Copilot" && apps)
        return `Abre tu archivo en ${apps} y pulsa el botón Copilot de la cinta (requiere Microsoft 365 Personal o superior). Pega el prompt de abajo como instrucción.`;
      return `Abre ${tool}, pega el prompt de abajo y adjunta el material. El plan gratuito sirve para probar; para uso diario conviene el primer plan de pago.`;
    case 2:
      return research
        ? `Activa ${research} o crea un Proyecto con tus documentos para que responda sobre ellos. Pide citas y revisa cada una.`
        : "Crea un Proyecto o espacio con tus documentos y pide que cite la página de cada afirmación.";
    case 3:
      return apps
        ? `Hazlo dentro de ${apps}: Copilot trabaja sobre el archivo abierto y Claude tiene complemento para Excel y PowerPoint. Lo repetitivo, conviértelo en macro o plantilla.`
        : "Usa tareas programadas, agentes o conectores (desde Plus/Pro) para que el trabajo se repita solo cada semana.";
    case 4:
      return "Con Claude Code o Codex construye un asistente, tablero o app propia. Ojo: la API se cobra por consumo, aparte de la suscripción.";
  }
}

function localStep(level: Level, runtime: string) {
  switch (level) {
    case 1:
      return "Instala LM Studio u Ollama, descarga un modelo del escalón que soporta tu PC y pega el mismo prompt. Sin internet, sin costo por consulta.";
    case 2:
      return "Carga tus documentos en AnythingLLM u Open WebUI (RAG): el modelo busca los fragmentos pertinentes en lugar de leer todo cada vez.";
    case 3:
      return `Conecta el modelo local (${runtime}) a un script o a n8n para repetir el flujo sin pagar por token.`;
    case 4:
      return "Publica un asistente privado en tu red con Open WebUI y tus documentos: los datos nunca salen de la institución.";
  }
}

export function CaseSheet({
  profession,
  specialty,
  item,
}: {
  profession: Profession;
  specialty: Specialty;
  item: PracticeCase;
}) {
  const [level, setLevel] = useState<Level>(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const task = TASKS[item.kind];
  const fields = useMemo(() => promptFields(item.prompt), [item.prompt]);
  const filled = fillPrompt(item.prompt, values);
  const { profile } = useHardwareProfile();
  const myTier = profile ? tierFor(profile.ramGib, profile.vramGib) : null;
  const lead = assistantById(task.commercial[0]?.id ?? "");
  const videos = item.videos ?? [];

  return (
    <article className="ia-sheet" aria-labelledby={`ia-case-${item.id}`}>
      <header className="ia-sheet-head">
        <p className="ia-kicker">
          {profession.label} · {specialty.label}
        </p>
        <h2 id={`ia-case-${item.id}`}>{item.title}</h2>
        <div className="ia-tags">
          <span className="ia-tag" data-kind={item.kind}>
            {task.label}
          </span>
          {item.office?.map((app) => (
            <span key={app} className="ia-tag" data-kind="office">
              {OFFICE_APPS[app].label}
            </span>
          ))}
          {item.sensitive ? (
            <span className="ia-tag" data-kind="sensitive">
              <Lock aria-hidden="true" /> Datos sensibles
            </span>
          ) : null}
        </div>
      </header>

      <dl className="ia-brief">
        <div>
          <dt>Qué necesitas</dt>
          <dd>{item.need}</dd>
        </div>
        <div>
          <dt>Material</dt>
          <dd>{item.materials}</dd>
        </div>
        <div>
          <dt>Resultado</dt>
          <dd>{item.output}</dd>
        </div>
      </dl>

      {item.sensitive ? (
        <p className="ia-callout" data-tone="privacy">
          <Lock aria-hidden="true" />
          <span>
            Este caso maneja datos personales o reservados. Anonimiza antes de
            usar un servicio en la nube, o usa la ruta <strong>IA local</strong>{" "}
            para que nada salga de tu equipo (Ley 29733 de protección de datos
            personales).
          </span>
        </p>
      ) : null}

      <section aria-labelledby={`ia-levels-${item.id}`}>
        <h3 id={`ia-levels-${item.id}`} className="ia-h3">
          ¿Hasta dónde quieres llegar?
        </h3>
        <fieldset className="ia-levels">
          <legend className="ia-visually-hidden">Nivel</legend>
          {LEVELS.map((entry) => (
            <label key={entry.id} data-checked={level === entry.id}>
              <input
                type="radio"
                name={`ia-level-${item.id}`}
                className="ia-visually-hidden"
                checked={level === entry.id}
                onChange={() => setLevel(entry.id)}
              />
              <span className="ia-level-num">{entry.id}</span>
              <span>
                <strong>{entry.label}</strong>
                <small>{entry.hint}</small>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      <div className="ia-routes">
        <section className="ia-route" aria-labelledby={`ia-com-${item.id}`}>
          <h3 id={`ia-com-${item.id}`}>
            <Cloud aria-hidden="true" /> IA comercial
            <small>en la nube, por suscripción</small>
          </h3>
          <p className="ia-step">
            {commercialStep(
              level,
              item,
              lead?.name ?? "el asistente",
              lead?.research ?? null,
            )}
          </p>
          <ol className="ia-picks">
            {task.commercial.map((pick) => {
              const assistant = assistantById(pick.id);
              if (!assistant) return null;
              const plan = entryPaidPlan(assistant);
              return (
                <li key={pick.id}>
                  <div className="ia-pick-row">
                    <a href={assistant.url} target="_blank" rel="noreferrer">
                      {assistant.name}
                    </a>
                    {plan ? (
                      <span className="ia-pick-plan">
                        {plan.name} <PriceTag usd={plan.usd} />
                      </span>
                    ) : null}
                  </div>
                  <p>{pick.why}</p>
                  <details>
                    <summary>Estilo y precauciones</summary>
                    <p>{assistant.style}</p>
                    <p className="ia-watch">
                      <AlertTriangle aria-hidden="true" /> {assistant.watchOut}
                    </p>
                  </details>
                </li>
              );
            })}
          </ol>
        </section>

        <section
          className="ia-route"
          data-route="local"
          aria-labelledby={`ia-loc-${item.id}`}
        >
          <h3 id={`ia-loc-${item.id}`}>
            <HardDrive aria-hidden="true" /> IA local
            <small>en tu PC, privada</small>
          </h3>
          <p className="ia-step">{localStep(level, task.local.runtime)}</p>
          <dl className="ia-local">
            <div>
              <dt>Programa</dt>
              <dd>{task.local.runtime}</dd>
            </div>
            <div>
              <dt>Modelos de ejemplo</dt>
              <dd>{task.local.models}</dd>
            </div>
            {item.local ? (
              <div>
                <dt>Especializado</dt>
                <dd>{item.local}</dd>
              </div>
            ) : null}
          </dl>
          <p className="ia-note">{task.local.note}</p>
          <div className="ia-pc">
            {myTier ? (
              <p>
                <strong>Tu PC:</strong> {profile?.ramGib ?? "?"} GB de RAM
                {profile?.vramGib
                  ? ` · ${profile.vramGib} GB de VRAM`
                  : " · VRAM sin dato"}{" "}
                → <em>{myTier.label}</em>. {myTier.can}
              </p>
            ) : (
              <p>
                <strong>Requisito orientativo:</strong> desde{" "}
                {HARDWARE_TIERS[1]?.ramGib} GB de RAM y una GPU de{" "}
                {HARDWARE_TIERS[1]?.vramGib} GB para trabajar con fluidez.{" "}
                <Link to="/in-action?tab=local">Revisa tu PC</Link>.
              </p>
            )}
          </div>
        </section>
      </div>

      {item.office?.length ? (
        <section className="ia-office" aria-labelledby={`ia-off-${item.id}`}>
          <h3 id={`ia-off-${item.id}`} className="ia-h3">
            En la oficina:{" "}
            {item.office.map((app) => OFFICE_APPS[app].label).join(" · ")}
          </h3>
          <p className="ia-lead">
            Si ya pagas Microsoft 365, <strong>Copilot</strong> trabaja dentro
            del archivo abierto. Si tu equipo vive en Google Drive,{" "}
            <strong>Gemini</strong> lo hace en Docs y Sheets en línea.{" "}
            <strong>ChatGPT</strong> y <strong>Claude</strong> te devuelven un
            archivo nuevo listo para descargar.{" "}
            <Link to="/in-action?tab=oficina">Comparar en detalle</Link>
          </p>
          <ul className="ia-videos">
            {(videos.length
              ? videos
              : item.office.map(
                  (app) =>
                    `Copilot en ${OFFICE_APPS[app].label} ${profession.label}`,
                )
            )
              .slice(0, 3)
              .map((query) => (
                <li key={query}>
                  <a
                    href={youtubeSearch(query)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <PlayCircle aria-hidden="true" />
                    {query}
                    <ExternalLink aria-hidden="true" />
                  </a>
                </li>
              ))}
          </ul>
          <p className="ia-note">
            Abre una búsqueda en YouTube; elige videos cortos y recientes, de
            canales que muestren la pantalla.
          </p>
        </section>
      ) : null}

      <section className="ia-prompt" aria-labelledby={`ia-pr-${item.id}`}>
        <h3 id={`ia-pr-${item.id}`} className="ia-h3">
          Prompt listo para adaptar
        </h3>
        {fields.length ? (
          <div className="ia-fields">
            {fields.map((field) => (
              <label key={field}>
                <span>{field}</span>
                <input
                  type="text"
                  value={values[field] ?? ""}
                  placeholder={field}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
        <pre className="ia-prompt-text">{filled}</pre>
        <div className="ia-prompt-actions">
          <CopyButton
            id={`prompt-${item.id}`}
            text={filled}
            label="Copiar prompt"
          />
          <Link
            className="ia-button"
            data-variant="ghost"
            to="/prompts?tab=generador"
          >
            Mejorarlo en Prompts
          </Link>
        </div>
        <p className="ia-note">
          Fuentes oficiales para tu profesión: {profession.sources.join(" · ")}.
        </p>
      </section>

      {item.caution ? (
        <p className="ia-callout" data-tone="warn">
          <AlertTriangle aria-hidden="true" />
          <span>{item.caution}</span>
        </p>
      ) : null}
    </article>
  );
}
