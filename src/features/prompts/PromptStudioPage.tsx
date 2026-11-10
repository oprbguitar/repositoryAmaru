import {
  BookMarked,
  Bot,
  Check,
  Copy,
  Download,
  GraduationCap,
  History,
  Layers,
  Plus,
  Search,
  Trash2,
  Wand2,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AGENT_BLUEPRINTS,
  AGENT_PATTERNS,
  type AgentBlueprint,
  blueprintToMarkdown,
  CATEGORIES,
  type CategoryId,
  CHAINS,
  chainToMarkdown,
  FRAMEWORKS,
  fillTemplate,
  MODEL_TIERS,
  type PromptChain,
  STARS_SNAPSHOT,
  TECHNIQUES,
} from "./catalog";
import {
  COMPARISONS,
  COURSE,
  COURSE_SESSIONS,
  ECOSYSTEMS,
  GOVERNANCE,
  PARAMETERS,
} from "./course";
import { addHistory, removeHistory, useHistory } from "./history";
import { saveTextFile, slugify } from "./saveFile";
import { TryFreeAi } from "./TryFreeAi";
import "./prompts.css";

const TABS = [
  { id: "cadenas", label: "Cadenas", icon: Layers },
  { id: "generador", label: "Generador", icon: Wand2 },
  { id: "agentes", label: "Agentes", icon: Bot },
  { id: "tecnicas", label: "Técnicas", icon: BookMarked },
  { id: "historico", label: "Mi histórico", icon: History },
  { id: "curso", label: "Curso de IA", icon: GraduationCap },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function categoryOf(id: CategoryId) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0];
}

function formatStars(stars?: number) {
  if (!stars) return null;
  return stars >= 1000 ? `${(stars / 1000).toFixed(1)} k` : String(stars);
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }
  return { copied, copy };
}

export function PromptStudioPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "cadenas";
  const setTab = (next: TabId) => {
    const copy = new URLSearchParams(params);
    copy.set("tab", next);
    setParams(copy, { replace: true });
  };

  return (
    <div className="pr-page scroll-region" data-guide="prompts">
      <header className="page-heading">
        <div>
          <h1>
            <Workflow aria-hidden="true" /> Prompts y agentes
          </h1>
          <p>
            Cadenas de prompts paso a paso, sistemas agénticos por fases y tu
            propio histórico. Todo armado sin gastar IA; la prueba gratuita es
            opcional.
          </p>
        </div>
      </header>

      <div className="pr-tabs" role="tablist" aria-label="Secciones">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`pr-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`pr-panel-${item.id}`}
              onClick={() => setTab(item.id)}
            >
              <Icon aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`pr-panel-${tab}`}
        aria-labelledby={`pr-tab-${tab}`}
        className="pr-panel"
      >
        {tab === "cadenas" ? <ChainsTab /> : null}
        {tab === "generador" ? <GeneratorTab /> : null}
        {tab === "agentes" ? <AgentsTab /> : null}
        {tab === "tecnicas" ? <TechniquesTab /> : null}
        {tab === "historico" ? <HistoryTab /> : null}
        {tab === "curso" ? <CourseTab onGo={setTab} /> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function CategoryChip({ id }: { id: CategoryId }) {
  const category = categoryOf(id);
  return (
    <span className="pr-chip" data-bubble={category.bubble}>
      {category.label}
    </span>
  );
}

function ChainsTab() {
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(CHAINS[0]?.id ?? "");
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CHAINS.filter(
      (chain) =>
        (category === "all" || chain.category === category) &&
        (!needle ||
          `${chain.title} ${chain.summary}`.toLowerCase().includes(needle)),
    );
  }, [category, query]);
  const selected =
    shown.find((chain) => chain.id === selectedId) ?? shown[0] ?? null;

  return (
    <div className="pr-layout">
      <nav className="pr-rail" aria-label="Categorías">
        <button
          type="button"
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          Todas <small>{CHAINS.length}</small>
        </button>
        {CATEGORIES.filter((item) =>
          CHAINS.some((chain) => chain.category === item.id),
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            data-bubble={item.bubble}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
            title={item.hint}
          >
            {item.label}
            <small>
              {CHAINS.filter((chain) => chain.category === item.id).length}
            </small>
          </button>
        ))}
      </nav>

      <section className="pr-list" aria-label="Cadenas de prompts">
        <label className="pr-search">
          <Search aria-hidden="true" />
          <span className="pr-visually-hidden">Buscar cadena</span>
          <input
            type="search"
            value={query}
            placeholder="Buscar cadena…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {shown.length === 0 ? (
          <p className="pr-empty">No hay cadenas con ese filtro.</p>
        ) : (
          <ul>
            {shown.map((chain, index) => (
              <li
                key={chain.id}
                style={{ animationDelay: `calc(var(--stagger) * ${index})` }}
              >
                <button
                  type="button"
                  className="pr-card"
                  aria-pressed={selected?.id === chain.id}
                  onClick={() => setSelectedId(chain.id)}
                >
                  <span className="pr-card-top">
                    <CategoryChip id={chain.category} />
                    <small>
                      {chain.steps.length} pasos · {chain.level}
                    </small>
                  </span>
                  <strong>{chain.title}</strong>
                  <span className="pr-card-text">{chain.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected ? <ChainInspector key={selected.id} chain={selected} /> : null}
    </div>
  );
}

function ChainInspector({ chain }: { chain: PromptChain }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [trialStep, setTrialStep] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);
  const { copied, copy } = useCopy();
  const markdown = chainToMarkdown(chain, values);
  const firstPrompt = fillTemplate(
    chain.steps[trialStep]?.prompt ?? "",
    values,
  );

  async function download() {
    const result = await saveTextFile(`${slugify(chain.title)}.md`, markdown);
    setSaved(
      result === "picked"
        ? "Guardado en la carpeta elegida."
        : result === "downloaded"
          ? "Descargado en tu carpeta de descargas."
          : null,
    );
  }

  return (
    <aside className="pr-inspector" aria-label={`Detalle: ${chain.title}`}>
      <header>
        <CategoryChip id={chain.category} />
        <h2>{chain.title}</h2>
        <p>{chain.summary}</p>
      </header>

      <fieldset className="pr-vars">
        <legend>Completa las variables</legend>
        {chain.variables.map((variable) => (
          <label key={variable.key}>
            <span>{variable.label}</span>
            <input
              value={values[variable.key] ?? ""}
              placeholder={variable.example}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [variable.key]: event.target.value,
                }))
              }
            />
          </label>
        ))}
      </fieldset>

      <ol className="pr-steps">
        {chain.steps.map((step, index) => {
          const text = fillTemplate(step.prompt, values);
          const key = `${chain.id}:${index}`;
          return (
            <li key={step.title}>
              <div className="pr-step-head">
                <strong>{step.title}</strong>
                <span
                  className="pr-tier"
                  title={MODEL_TIERS[step.tier].examples}
                >
                  {MODEL_TIERS[step.tier].label}
                </span>
              </div>
              <p className="pr-step-goal">{step.goal}</p>
              <pre>{text}</pre>
              <div className="pr-step-actions">
                <small>Salida: {step.output}</small>
                <button
                  type="button"
                  className="pr-button pr-button-ghost"
                  onClick={() => copy(key, text)}
                >
                  {copied === key ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Copy aria-hidden="true" />
                  )}
                  {copied === key ? "Copiado" : "Copiar"}
                </button>
                <button
                  type="button"
                  className="pr-button pr-button-ghost"
                  aria-pressed={trialStep === index}
                  onClick={() => setTrialStep(index)}
                >
                  Probar este paso
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="pr-inspector-actions">
        <button
          type="button"
          className="pr-button pr-button-primary"
          onClick={download}
        >
          <Download aria-hidden="true" /> Descargar cadena (.md)
        </button>
        <button
          type="button"
          className="pr-button"
          onClick={() => {
            addHistory({
              title: chain.title,
              category: chain.category,
              text: markdown,
              origin: "cadena",
            });
            setSaved("Guardado en Mi histórico.");
          }}
        >
          <Plus aria-hidden="true" /> Guardar en mi histórico
        </button>
        <button
          type="button"
          className="pr-button pr-button-ghost"
          onClick={() => copy(`${chain.id}:all`, markdown)}
        >
          <Copy aria-hidden="true" />
          {copied === `${chain.id}:all` ? "Copiada" : "Copiar todo"}
        </button>
      </div>
      {saved ? (
        <p className="pr-note" aria-live="polite">
          {saved}
        </p>
      ) : null}

      <TryFreeAi initialPrompt={firstPrompt} />

      <footer className="pr-sources">
        <span>Basado en</span>
        {chain.sources.map((source) => (
          <SourceLink key={source.label} source={source} />
        ))}
      </footer>
    </aside>
  );
}

function SourceLink({
  source,
}: {
  source: { label: string; url: string; stars?: number };
}) {
  const stars = formatStars(source.stars);
  if (!source.url.startsWith("http"))
    return <span className="pr-source">{source.label}</span>;
  return (
    <a className="pr-source" href={source.url} target="_blank" rel="noreferrer">
      {source.label}
      {stars ? (
        <small title={`Estrellas en GitHub al ${STARS_SNAPSHOT}`}>
          ★ {stars}
        </small>
      ) : null}
    </a>
  );
}

/* ------------------------------------------------------------------------ */

const PRODUCTS: ReadonlyArray<{
  id: string;
  label: string;
  chainId?: string;
  blueprintId?: string;
}> = [
  {
    id: "video",
    label: "Video corto",
    chainId: "video-9-capas",
    blueprintId: "fabrica-video",
  },
  { id: "imagen", label: "Imagen o afiche", chainId: "imagen-consistente" },
  {
    id: "informe",
    label: "Informe técnico",
    chainId: "informe-por-partes",
    blueprintId: "investigacion-profunda",
  },
  { id: "mapa", label: "Mapa mental", chainId: "mapa-mental" },
  { id: "juridico", label: "Análisis jurídico", chainId: "relacion-juridica" },
  {
    id: "investigacion",
    label: "Investigación académica",
    chainId: "investigacion-academica",
    blueprintId: "investigacion-profunda",
  },
  {
    id: "app",
    label: "Aplicación de software",
    chainId: "software-por-especificacion",
    blueprintId: "equipo-desarrollo",
  },
  { id: "web", label: "Página web", chainId: "web-9-puntos" },
  {
    id: "asistente",
    label: "Asistente con mis documentos",
    blueprintId: "soporte-rag",
  },
  {
    id: "estudio",
    label: "Estudiar un tema",
    chainId: "escalera-de-preguntas",
  },
  {
    id: "decision",
    label: "Decisión difícil",
    chainId: "arbol-de-pensamientos",
  },
];

const TONES = ["claro y cercano", "formal", "técnico", "divertido"] as const;
const DEPTHS = ["sencillo", "intermedio", "avanzado"] as const;

function GeneratorTab() {
  const [productId, setProductId] = useState(PRODUCTS[0]?.id ?? "video");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("claro y cercano");
  const [depth, setDepth] = useState<(typeof DEPTHS)[number]>("intermedio");
  const [note, setNote] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  const product = PRODUCTS.find((item) => item.id === productId) ?? PRODUCTS[0];
  const chain = CHAINS.find((item) => item.id === product?.chainId);
  const blueprint = AGENT_BLUEPRINTS.find(
    (item) => item.id === product?.blueprintId,
  );

  const output = useMemo(() => {
    const values: Record<string, string> = {};
    if (chain) {
      // The free-text topic fills the chain's first variable; the rest keep
      // their examples unless the person edits them in «Cadenas».
      const [first] = chain.variables;
      if (first && topic.trim()) values[first.key] = topic.trim();
    }
    const header = [
      `# Plan de prompts · ${product?.label ?? ""}`,
      "",
      `- **Tema:** ${topic.trim() || "(sin tema: usa el ejemplo de cada paso)"}`,
      `- **Público:** ${audience.trim() || "general"}`,
      `- **Tono:** ${tone}`,
      `- **Profundidad:** ${depth}`,
      "",
      "## Prompt de sistema sugerido",
      "",
      "```text",
      `Eres un asistente experto. Trabajas por pasos y no avanzas al siguiente hasta terminar el actual. Público: ${audience.trim() || "general"}. Tono: ${tone}. Nivel: ${depth}. Si falta información, pregunta antes de suponer. Nunca inventes datos ni fuentes.`,
      "```",
      "",
    ];
    const parts = [header.join("\n")];
    if (chain)
      parts.push(chainToMarkdown(chain, values).replace(/^# /, "## Cadena: "));
    if (blueprint)
      parts.push(
        blueprintToMarkdown(blueprint).replace(/^# /, "## Sistema agéntico: "),
      );
    return parts.join("\n\n");
  }, [chain, blueprint, product, topic, audience, tone, depth]);

  return (
    <div className="pr-generator">
      <form
        className="pr-gen-form"
        onSubmit={(event) => event.preventDefault()}
        aria-label="Generador de plan de prompts"
      >
        <fieldset>
          <legend>¿Qué quieres producir?</legend>
          <div className="pr-product-grid">
            {PRODUCTS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={productId === item.id}
                onClick={() => setProductId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          <span>Tema</span>
          <input
            value={topic}
            placeholder={chain?.variables[0]?.example ?? "Describe tu tema"}
            onChange={(event) => setTopic(event.target.value)}
          />
        </label>
        <label>
          <span>Público</span>
          <input
            value={audience}
            placeholder="estudiantes, clientes, gerencia…"
            onChange={(event) => setAudience(event.target.value)}
          />
        </label>
        <div className="pr-gen-row">
          <label>
            <span>Tono</span>
            <select
              value={tone}
              onChange={(event) =>
                setTone(event.target.value as (typeof TONES)[number])
              }
            >
              {TONES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Profundidad</span>
            <select
              value={depth}
              onChange={(event) =>
                setDepth(event.target.value as (typeof DEPTHS)[number])
              }
            >
              {DEPTHS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="pr-note">
          Se arma al instante con plantillas: no consume IA ni cupo.
        </p>
      </form>

      <section className="pr-gen-output" aria-label="Resultado">
        <div className="pr-inspector-actions">
          <button
            type="button"
            className="pr-button pr-button-primary"
            onClick={async () => {
              const result = await saveTextFile(
                `plan-${slugify(product?.label ?? "prompts")}.md`,
                output,
              );
              setNote(
                result === "picked"
                  ? "Guardado en la carpeta elegida."
                  : result === "downloaded"
                    ? "Descargado."
                    : null,
              );
            }}
          >
            <Download aria-hidden="true" /> Descargar (.md)
          </button>
          <button
            type="button"
            className="pr-button"
            onClick={() => {
              addHistory({
                title: `${product?.label}: ${topic.trim() || "sin tema"}`,
                category: chain?.category ?? "agentes",
                text: output,
                origin: "generador",
              });
              setNote("Guardado en Mi histórico.");
            }}
          >
            <Plus aria-hidden="true" /> Guardar
          </button>
          <button
            type="button"
            className="pr-button pr-button-ghost"
            onClick={() => copy("gen", output)}
          >
            <Copy aria-hidden="true" />{" "}
            {copied === "gen" ? "Copiado" : "Copiar"}
          </button>
        </div>
        {note ? (
          <p className="pr-note" aria-live="polite">
            {note}
          </p>
        ) : null}
        <pre className="pr-gen-pre">{output}</pre>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function AgentsTab() {
  const [selectedId, setSelectedId] = useState(AGENT_BLUEPRINTS[0]?.id ?? "");
  const selected =
    AGENT_BLUEPRINTS.find((item) => item.id === selectedId) ??
    AGENT_BLUEPRINTS[0];
  return (
    <div className="pr-agents">
      <section aria-labelledby="pr-patterns">
        <h2 id="pr-patterns" className="pr-h2">
          Patrones agénticos
        </h2>
        <ul className="pr-mini-grid">
          {AGENT_PATTERNS.map((pattern) => (
            <li key={pattern.id} className="pr-mini">
              <strong>{pattern.name}</strong>
              <span>{pattern.idea}</span>
              <small>Ej.: {pattern.use}</small>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="pr-blueprints"
        className="pr-layout pr-layout-2"
      >
        <div>
          <h2 id="pr-blueprints" className="pr-h2">
            Sistemas por producto
          </h2>
          <ul className="pr-list-plain">
            {AGENT_BLUEPRINTS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="pr-card"
                  aria-pressed={selected?.id === item.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="pr-card-top">
                    <span className="pr-chip" data-bubble={5}>
                      {item.phases.length} fases
                    </span>
                    <small>{item.pattern}</small>
                  </span>
                  <strong>{item.product}</strong>
                  <span className="pr-card-text">{item.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {selected ? <BlueprintDetail blueprint={selected} /> : null}
      </section>

      <section aria-labelledby="pr-frameworks">
        <h2 id="pr-frameworks" className="pr-h2">
          Frameworks para construirlo
        </h2>
        <ul className="pr-mini-grid">
          {FRAMEWORKS.map((framework) => (
            <li key={framework.url} className="pr-mini">
              <SourceLink source={framework} />
              <span>{framework.note}</span>
            </li>
          ))}
        </ul>
        <p className="pr-note">
          Estrellas de GitHub al {STARS_SNAPSHOT}, consultadas con la API
          pública.
        </p>
      </section>
    </div>
  );
}

function BlueprintDetail({ blueprint }: { blueprint: AgentBlueprint }) {
  const { copied, copy } = useCopy();
  const markdown = blueprintToMarkdown(blueprint);
  return (
    <article className="pr-inspector" aria-label={blueprint.product}>
      <header>
        <h2>{blueprint.product}</h2>
        <p>
          {blueprint.summary} <em>Patrón: {blueprint.pattern}.</em>
        </p>
      </header>
      <ol className="pr-steps">
        {blueprint.phases.map((phase, index) => (
          <li key={phase.name}>
            <div className="pr-step-head">
              <strong>
                Fase {index + 1} · {phase.name}
              </strong>
              <span
                className="pr-tier"
                title={MODEL_TIERS[phase.tier].examples}
              >
                {MODEL_TIERS[phase.tier].label}
              </span>
            </div>
            <pre>{phase.instructions}</pre>
            <dl className="pr-dl">
              <dt>Herramientas</dt>
              <dd>{phase.tools}</dd>
              <dt>Termina cuando</dt>
              <dd>{phase.exit}</dd>
            </dl>
          </li>
        ))}
      </ol>
      <h3 className="pr-h3">Barandas</h3>
      <ul className="pr-bullets">
        {blueprint.guardrails.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="pr-inspector-actions">
        <button
          type="button"
          className="pr-button pr-button-primary"
          onClick={() =>
            saveTextFile(`agente-${slugify(blueprint.product)}.md`, markdown)
          }
        >
          <Download aria-hidden="true" /> Descargar (.md)
        </button>
        <button
          type="button"
          className="pr-button pr-button-ghost"
          onClick={() => copy(blueprint.id, markdown)}
        >
          <Copy aria-hidden="true" />
          {copied === blueprint.id ? "Copiado" : "Copiar"}
        </button>
      </div>
      <footer className="pr-sources">
        <span>Frameworks</span>
        {blueprint.stack.map((source) => (
          <SourceLink key={source.label} source={source} />
        ))}
      </footer>
    </article>
  );
}

/* ------------------------------------------------------------------------ */

function TechniquesTab() {
  const { copied, copy } = useCopy();
  return (
    <div className="pr-techniques">
      <p className="pr-lead">
        Técnicas del curso (Unidad 2) contrastadas con la{" "}
        <a
          href="https://github.com/dair-ai/Prompt-Engineering-Guide"
          target="_blank"
          rel="noreferrer"
        >
          Prompt Engineering Guide
        </a>
        . Anatomía de un buen prompt: <strong>rol</strong>,{" "}
        <strong>tarea</strong>, <strong>contexto</strong> y{" "}
        <strong>formato</strong>.
      </p>
      <ul className="pr-mini-grid">
        {TECHNIQUES.map((technique) => (
          <li key={technique.id} className="pr-mini">
            <strong>{technique.name}</strong>
            <span>{technique.what}</span>
            <small>Cuándo: {technique.when}</small>
            <code>{technique.template}</code>
            <button
              type="button"
              className="pr-button pr-button-ghost"
              onClick={() => copy(technique.id, technique.template)}
            >
              <Copy aria-hidden="true" />
              {copied === technique.id ? "Copiado" : "Copiar"}
            </button>
          </li>
        ))}
      </ul>
      <h2 className="pr-h2">Parámetros de ejecución</h2>
      <div className="pr-table-wrap">
        <table className="pr-table">
          <thead>
            <tr>
              <th scope="col">Parámetro</th>
              <th scope="col">Valor bajo</th>
              <th scope="col">Valor alto</th>
            </tr>
          </thead>
          <tbody>
            {PARAMETERS.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{row.low}</td>
                <td>{row.high}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function HistoryTab() {
  const history = useHistory();
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [newCategory, setNewCategory] = useState<CategoryId>("razonamiento");
  const [open, setOpen] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  const shown = history.filter(
    (entry) =>
      (category === "all" || entry.category === category) &&
      (!query.trim() ||
        `${entry.title} ${entry.text}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())),
  );

  return (
    <div className="pr-history">
      <form
        className="pr-history-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || !text.trim()) return;
          addHistory({
            title: title.trim(),
            category: newCategory,
            text: text.trim(),
            origin: "manual",
          });
          setTitle("");
          setText("");
        }}
      >
        <h2 className="pr-h2">Agregar un system prompt</h2>
        <label>
          <span>Título</span>
          <input
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Revisor de contratos, tutor de cálculo…"
          />
        </label>
        <label>
          <span>Categoría</span>
          <select
            value={newCategory}
            onChange={(event) =>
              setNewCategory(event.target.value as CategoryId)
            }
          >
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Prompt</span>
          <textarea
            value={text}
            rows={5}
            onChange={(event) => setText(event.target.value)}
            placeholder="Eres…"
          />
        </label>
        <button
          type="submit"
          className="pr-button pr-button-primary"
          disabled={!title.trim() || !text.trim()}
        >
          <Plus aria-hidden="true" /> Guardar
        </button>
        <p className="pr-note">
          Se guarda solo en este navegador. Descárgalo si quieres conservarlo.
        </p>
      </form>

      <section aria-label="Histórico de prompts" className="pr-history-list">
        <div className="pr-history-filters">
          <label className="pr-search">
            <Search aria-hidden="true" />
            <span className="pr-visually-hidden">Buscar en el histórico</span>
            <input
              type="search"
              value={query}
              placeholder="Buscar…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            aria-label="Filtrar por categoría"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as CategoryId | "all")
            }
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {shown.length === 0 ? (
          <p className="pr-empty">
            {history.length === 0
              ? "Tu histórico está vacío. Guarda una cadena, un plan del generador o escribe tu propio prompt."
              : "Nada coincide con el filtro."}
          </p>
        ) : (
          <ul className="pr-tiles">
            {shown.map((entry) => (
              <li key={entry.id} className="pr-tile">
                <div className="pr-card-top">
                  <CategoryChip id={entry.category} />
                  <small>
                    {new Date(entry.createdAt).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "short",
                    })}
                  </small>
                </div>
                <strong>{entry.title}</strong>
                <p className={open === entry.id ? "" : "pr-clamp"}>
                  {entry.text}
                </p>
                <div className="pr-tile-actions">
                  <button
                    type="button"
                    className="pr-button pr-button-ghost"
                    aria-expanded={open === entry.id}
                    onClick={() => setOpen(open === entry.id ? null : entry.id)}
                  >
                    {open === entry.id ? "Menos" : "Ver todo"}
                  </button>
                  <button
                    type="button"
                    className="pr-icon-button"
                    aria-label={`Copiar ${entry.title}`}
                    onClick={() => copy(entry.id, entry.text)}
                  >
                    {copied === entry.id ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="pr-icon-button"
                    aria-label={`Descargar ${entry.title}`}
                    onClick={() =>
                      saveTextFile(`${slugify(entry.title)}.md`, entry.text)
                    }
                  >
                    <Download aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="pr-icon-button pr-danger"
                    aria-label={`Eliminar ${entry.title}`}
                    onClick={() => {
                      if (window.confirm(`¿Eliminar «${entry.title}»?`))
                        removeHistory(entry.id);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function CourseTab({ onGo }: { onGo: (tab: TabId) => void }) {
  const { copied, copy } = useCopy();
  return (
    <div className="pr-course" id="curso">
      <header className="pr-course-head">
        <h2 className="pr-h2">{COURSE.title}</h2>
        <p>
          {COURSE.origin} · {COURSE.format}
        </p>
        <p className="pr-note">{COURSE.note}</p>
      </header>

      <ol className="pr-sessions">
        {COURSE_SESSIONS.map((session) => (
          <li key={session.n} className="pr-mini">
            <span className="pr-session-n">Sesión {session.n}</span>
            <strong>{session.title}</strong>
            <ul className="pr-bullets">
              {session.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {session.link ? (
              <button
                type="button"
                className="pr-button pr-button-ghost"
                onClick={() => session.link && onGo(session.link.tab)}
              >
                {session.link.label} →
              </button>
            ) : null}
          </li>
        ))}
      </ol>

      <h2 className="pr-h2">Ecosistemas según el curso</h2>
      <div className="pr-table-wrap">
        <table className="pr-table">
          <thead>
            <tr>
              <th scope="col">Empresa</th>
              <th scope="col">Fortaleza</th>
              <th scope="col">Caso ideal</th>
            </tr>
          </thead>
          <tbody>
            {ECOSYSTEMS.map((row) => (
              <tr key={row.company}>
                <th scope="row">{row.company}</th>
                <td>{row.strength}</td>
                <td>{row.ideal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="pr-h2">Gobernanza: sistema tradicional frente a LLM</h2>
      <div className="pr-table-wrap">
        <table className="pr-table">
          <thead>
            <tr>
              <th scope="col">Aspecto</th>
              <th scope="col">Tradicional</th>
              <th scope="col">Con LLM</th>
            </tr>
          </thead>
          <tbody>
            {GOVERNANCE.map((row) => (
              <tr key={row.aspect}>
                <th scope="row">{row.aspect}</th>
                <td>{row.classic}</td>
                <td>{row.llm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="pr-h2">Ejercicios para comparar modelos</h2>
      <ul className="pr-mini-grid">
        {COMPARISONS.map((item) => (
          <li key={item.title} className="pr-mini">
            <strong>{item.title}</strong>
            <code>{item.prompt}</code>
            <small>Qué observar: {item.expect}</small>
            <button
              type="button"
              className="pr-button pr-button-ghost"
              onClick={() => copy(item.title, item.prompt)}
            >
              <Copy aria-hidden="true" />
              {copied === item.title ? "Copiado" : "Copiar"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
