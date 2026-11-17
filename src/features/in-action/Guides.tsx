import { AlertTriangle, Cpu, ExternalLink, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  detectMyPc,
  useHardwareProfile,
} from "../local-models/useHardwareProfile";
import { CopyButton, PriceTag } from "./shared";
import {
  ASSISTANTS,
  assistantById,
  HARDWARE_TIERS,
  IGV_RATE,
  LOCAL_RUNTIMES,
  OFFICE_APPS,
  OFFICE_COMPARISON,
  type OfficeApp,
  PRICES_CHECKED_AT,
  tierFor,
  youtubeSearch,
} from "./tools";

/* ------------------------------ Planes ---------------------------------- */

export function PlansGuide({
  rate,
  period,
  onRate,
}: {
  rate: number | null;
  period: string | null;
  onRate: (value: number | null) => void;
}) {
  return (
    <div className="ia-guide">
      <p className="ia-lead">
        Precios de lista mensuales en dólares y su equivalente aproximado en
        soles <strong>con IGV ({IGV_RATE * 100} %)</strong>, que se cobra en
        Perú a servicios digitales del extranjero. Tu banco puede sumar una
        comisión por consumo en moneda extranjera. Consultados el{" "}
        {PRICES_CHECKED_AT}: verifica en la página oficial antes de pagar.
      </p>
      <label className="ia-fx">
        <span>Tipo de cambio (S/ por US$)</span>
        <input
          type="number"
          step="0.001"
          min="1"
          value={rate ?? ""}
          placeholder="sin dato"
          onChange={(event) => {
            const value = Number(event.target.value);
            onRate(Number.isFinite(value) && value > 0 ? value : null);
          }}
        />
        <small>
          {period
            ? `BCRPData, ${period}. Puedes cambiarlo.`
            : "BCRPData aún no tiene dato: escribe uno."}
        </small>
      </label>

      <div className="ia-concepts">
        <p>
          <strong>Suscripción</strong> = pagas el chat cada mes, con límites de
          uso.
        </p>
        <p>
          <strong>API</strong> = pagas por consumo (tokens) para tus propias
          apps; una suscripción <em>no</em> incluye créditos de API.
        </p>
        <p>
          <strong>Local</strong> = pagas el equipo y la electricidad; la app de
          escritorio de ChatGPT o Claude <em>no</em> es local, sigue usando la
          nube.
        </p>
      </div>

      <div className="ia-plans">
        {ASSISTANTS.map((assistant) => (
          <section
            key={assistant.id}
            className="ia-plan"
            aria-labelledby={`ia-plan-${assistant.id}`}
          >
            <header>
              <h3 id={`ia-plan-${assistant.id}`}>{assistant.name}</h3>
              <small>
                {assistant.maker} · {assistant.origin}
              </small>
            </header>
            <p>{assistant.style}</p>
            <table>
              <tbody>
                {assistant.plans.map((plan) => (
                  <tr key={plan.name}>
                    <th scope="row">{plan.name}</th>
                    <td>
                      <PriceTag usd={plan.usd} />
                    </td>
                    <td>{plan.gain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ia-note">
              <strong>Alcance:</strong> {assistant.reach}
            </p>
            <p className="ia-watch">
              <AlertTriangle aria-hidden="true" /> {assistant.watchOut}
            </p>
            <a
              className="ia-link"
              href={assistant.pricingUrl}
              target="_blank"
              rel="noreferrer"
            >
              Precios oficiales <ExternalLink aria-hidden="true" />
            </a>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Oficina --------------------------------- */

const OFFICE_VIDEOS: Record<OfficeApp, ReadonlyArray<string>> = {
  excel: [
    "Copilot en Excel tutorial en español",
    "Copilot Excel contabilidad fórmulas",
    "crear macros VBA con Copilot o ChatGPT",
  ],
  word: [
    "Copilot en Word redactar y resumir documentos",
    "Copilot Word documentos legales",
  ],
  powerpoint: [
    "Copilot PowerPoint crear presentación desde Word",
    "Claude PowerPoint complemento",
  ],
  outlook: ["Copilot Outlook resumir correos y responder"],
};

export function OfficeGuide() {
  return (
    <div className="ia-guide">
      <p className="ia-lead">
        Para profesiones de oficina (contabilidad, derecho, administración,
        gestión pública) la pregunta no es «qué IA es mejor», sino{" "}
        <strong>dónde viven tus archivos</strong>.
      </p>
      <div className="ia-table-wrap">
        <table className="ia-table">
          <thead>
            <tr>
              <th scope="col">Asistente</th>
              <th scope="col">Dónde trabaja</th>
              <th scope="col">Conviene si…</th>
              <th scope="col">Ojo con</th>
              <th scope="col">Desde</th>
            </tr>
          </thead>
          <tbody>
            {OFFICE_COMPARISON.map((row) => {
              const assistant = assistantById(row.id);
              const plan = assistant?.plans.find((p) => p.usd !== 0);
              return (
                <tr key={row.id}>
                  <th scope="row">{assistant?.name}</th>
                  <td>{row.where}</td>
                  <td>{row.best}</td>
                  <td>{row.limit}</td>
                  <td>
                    {plan ? (
                      <>
                        {plan.name} <PriceTag usd={plan.usd} />
                      </>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="ia-decide">
        <h3 className="ia-h3">¿Copilot, ChatGPT o Claude para Excel?</h3>
        <ul>
          <li>
            <strong>Copilot</strong>: tu libro ya está abierto y quieres una
            fórmula, tabla dinámica o gráfico ahí mismo.
          </li>
          <li>
            <strong>Claude</strong>: necesitas un libro nuevo bien armado
            (modelo financiero, conciliación, macros) o trabajar con el
            complemento sin salir de Excel.
          </li>
          <li>
            <strong>ChatGPT</strong>: quieres que analice un archivo grande con
            código, grafique y te devuelva el resultado.
          </li>
          <li>
            <strong>Gemini</strong>: tu equipo comparte todo en Google Sheets.
          </li>
        </ul>
      </div>

      <div className="ia-apps">
        {(Object.keys(OFFICE_APPS) as OfficeApp[]).map((app) => (
          <section
            key={app}
            className="ia-app"
            aria-labelledby={`ia-app-${app}`}
          >
            <h3 id={`ia-app-${app}`}>{OFFICE_APPS[app].label}</h3>
            <ul className="ia-bullets">
              {OFFICE_APPS[app].tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
            <ul className="ia-videos">
              {OFFICE_VIDEOS[app].map((query) => (
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
          </section>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Local ----------------------------------- */

export function LocalGuide() {
  const { profile, update } = useHardwareProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const myTier = profile ? tierFor(profile.ramGib, profile.vramGib) : null;

  async function detect() {
    setBusy(true);
    setError(null);
    try {
      await detectMyPc();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ia-guide">
      <p className="ia-lead">
        La IA local corre en tu computadora: <strong>tus datos no salen</strong>{" "}
        y no pagas por consulta. A cambio, necesitas un equipo con memoria
        suficiente y los modelos son algo menos capaces que los comerciales de
        punta. Ideal para historias clínicas, expedientes, planillas o código
        confidencial.
      </p>

      <section className="ia-mypc" aria-labelledby="ia-mypc-title">
        <h3 id="ia-mypc-title">
          <Cpu aria-hidden="true" /> ¿Qué soporta mi PC?
        </h3>
        {profile ? (
          <div className="ia-mypc-grid">
            <label>
              <span>RAM (GB)</span>
              <input
                type="number"
                min="1"
                value={profile.ramGib ?? ""}
                onChange={(event) =>
                  update({ ramGib: Number(event.target.value) || null })
                }
              />
            </label>
            <label>
              <span>VRAM de la GPU (GB)</span>
              <input
                type="number"
                min="0"
                value={profile.vramGib ?? ""}
                onChange={(event) =>
                  update({ vramGib: Number(event.target.value) || null })
                }
              />
            </label>
            <p>
              {myTier ? (
                <>
                  Escalón: <strong>{myTier.label}</strong>. {myTier.can}
                </>
              ) : (
                "Con menos de 8 GB de RAM conviene usar la IA comercial."
              )}
            </p>
          </div>
        ) : (
          <p>El navegador estima tu hardware; nada se envía al servidor.</p>
        )}
        <div className="ia-row">
          <button
            type="button"
            className="ia-button"
            onClick={detect}
            disabled={busy}
          >
            {busy
              ? "Detectando…"
              : profile
                ? "Volver a detectar"
                : "Detectar mi PC"}
          </button>
          <Link className="ia-button" data-variant="ghost" to="/models">
            Ver modelos compatibles
          </Link>
        </div>
        {error ? (
          <p className="ia-note" data-tone="error">
            {error}
          </p>
        ) : null}
        <p className="ia-note">
          Los navegadores limitan la RAM informada a 8 GB: corrígela a mano si
          tienes más.
        </p>
      </section>

      <div className="ia-table-wrap">
        <table className="ia-table">
          <thead>
            <tr>
              <th scope="col">Escalón</th>
              <th scope="col">RAM</th>
              <th scope="col">GPU (VRAM)</th>
              <th scope="col">Qué puedes hacer</th>
              <th scope="col">Modelos de ejemplo (Ollama)</th>
            </tr>
          </thead>
          <tbody>
            {HARDWARE_TIERS.map((tier) => (
              <tr
                key={tier.id}
                aria-current={myTier?.id === tier.id ? "true" : undefined}
              >
                <th scope="row">{tier.label}</th>
                <td>{tier.ramGib} GB</td>
                <td>{tier.vramGib ? `${tier.vramGib} GB` : "No necesaria"}</td>
                <td>{tier.can}</td>
                <td>
                  <code>{tier.examples}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ia-note">
        Regla práctica: un modelo cuantizado a 4 bits ocupa ≈ 0,6 GB por cada
        mil millones de parámetros, más el contexto. LM Studio recomienda en
        Windows 16 GB de RAM y 4 GB de VRAM como punto de partida.
      </p>

      <h3 className="ia-h3">Programas para empezar</h3>
      <ul className="ia-runtimes">
        {LOCAL_RUNTIMES.map((runtime) => (
          <li key={runtime.id}>
            <a href={runtime.url} target="_blank" rel="noreferrer">
              {runtime.name}
            </a>
            <small>{runtime.kind}</small>
            <code>{runtime.start}</code>
            {runtime.start.startsWith("ollama") ? (
              <CopyButton id={`rt-${runtime.id}`} text={runtime.start} />
            ) : null}
          </li>
        ))}
      </ul>
      <p className="ia-note">
        Catálogos:{" "}
        <a href="https://ollama.com/library" target="_blank" rel="noreferrer">
          Ollama
        </a>{" "}
        ·{" "}
        <a
          href="https://huggingface.co/models"
          target="_blank"
          rel="noreferrer"
        >
          Hugging Face
        </a>{" "}
        · y el explorador de <Link to="/models">Modelos</Link> de AMARU, que
        revisa si cada uno cabe en tu PC.
      </p>
    </div>
  );
}

/* ------------------------------ Documentos ------------------------------ */

const FORMATS = [
  [
    "Markdown .md",
    "Apuntes, manuales, capítulos",
    "Conserva la estructura con poco formato extra.",
  ],
  ["Texto .txt", "Contenido simple", "Casi sin sobrecarga."],
  [
    "CSV .csv",
    "Tablas, registros, estadísticas",
    "Incluye la definición y unidad de cada columna.",
  ],
  [
    "JSON .json",
    "Datos para apps e integraciones",
    "Útil, pero sus claves también cuestan tokens.",
  ],
  [
    "PDF .pdf",
    "Artículos, normas, libros, planos",
    "Si se procesa como imagen (escaneado o con gráficos) cuesta bastante más.",
  ],
  [
    "DOCX / XLSX",
    "Documentos y hojas editables",
    "Depende de cada plataforma; Copilot los lee directamente.",
  ],
] as const;

const KINDS = [
  { id: "text", label: "Texto en español", tokensPerWord: 1.4 },
  { id: "pdf", label: "PDF con imágenes", tokensPerWord: 2.2 },
  { id: "table", label: "Tablas / CSV", tokensPerWord: 1.8 },
] as const;

export function DocsGuide() {
  const [words, setWords] = useState(5000);
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("text");
  const [price, setPrice] = useState(3);
  const factor = KINDS.find((k) => k.id === kind)?.tokensPerWord ?? 1.4;
  const tokens = Math.round(words * factor);
  const cost = (tokens / 1_000_000) * price;

  return (
    <div className="ia-guide">
      <p className="ia-lead">
        Lo que subes a la IA se mide en <strong>tokens</strong> (trozos de
        texto). Más tokens = más consumo del límite de tu plan o más costo de
        API. Preparar bien el material rinde más que pagar un plan mayor.
      </p>
      <div className="ia-table-wrap">
        <table className="ia-table">
          <thead>
            <tr>
              <th scope="col">Formato</th>
              <th scope="col">Cuándo usarlo</th>
              <th scope="col">A tener en cuenta</th>
            </tr>
          </thead>
          <tbody>
            {FORMATS.map(([format, when, note]) => (
              <tr key={format}>
                <th scope="row">{format}</th>
                <td>{when}</td>
                <td>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ia-note">
        Markdown no siempre es lo más barato: depende del texto, del tokenizador
        y de si el proveedor también analiza la página como imagen.
      </p>

      <section className="ia-estimator" aria-labelledby="ia-est-title">
        <h3 id="ia-est-title">Estimador didáctico de contexto</h3>
        <div className="ia-est-grid">
          <label>
            <span>Tipo de material</span>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as typeof kind)}
            >
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Número de palabras</span>
            <input
              type="number"
              min="0"
              step="500"
              value={words}
              onChange={(event) =>
                setWords(Math.max(0, Number(event.target.value) || 0))
              }
            />
          </label>
          <label>
            <span>Tarifa de entrada API (US$ por millón)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={price}
              onChange={(event) =>
                setPrice(Math.max(0, Number(event.target.value) || 0))
              }
            />
          </label>
        </div>
        <div className="ia-est-out">
          <p>
            <small>Tokens estimados</small>
            <strong>{tokens.toLocaleString("es-PE")}</strong>
          </p>
          <p>
            <small>Costo de entrada estimado</small>
            <strong>US$ {cost.toFixed(4)}</strong>
          </p>
        </div>
        <p className="ia-note">
          Supuesto: {factor} tokens por palabra. No incluye la respuesta, el
          razonamiento, la caché, herramientas ni impuestos. Las tarifas por
          modelo están en <Link to="/models">Modelos</Link>.
        </p>
      </section>

      <section className="ia-rag">
        <h3 className="ia-h3">RAG en una línea</h3>
        <p>
          En lugar de reenviar el libro entero en cada pregunta, se indexa una
          vez y la IA recupera solo los fragmentos pertinentes. Ahorra contexto
          y permite trabajar con bibliotecas grandes, aunque suma un costo de
          preparación y almacenamiento. NotebookLM, los Proyectos de ChatGPT y
          Claude, y AnythingLLM en local hacen esto por ti.
        </p>
      </section>
    </div>
  );
}
