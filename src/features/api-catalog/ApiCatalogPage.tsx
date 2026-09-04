import {
  AlertTriangle,
  Boxes,
  Calculator,
  Coins,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Layers,
  Mic,
  Percent,
  Search,
  Server,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import {
  type Category,
  catalogStats,
  PLATFORMS,
  type Platform,
  PRICING_ASOF,
  PROJECTS,
  type Project,
  type ProjectKind,
  projectMargin,
  type Rate,
  textRates,
  textRunCost,
  unitRates,
  voiceRates,
} from "./catalog";

type Tab = "plataformas" | "proyectos" | "calculadora";
type CategoryFilter = Category | "all";
type KindFilter = ProjectKind | "all";

const CATEGORY_LABEL: Record<Category, string> = {
  hyperscaler: "Nube corporativa",
  directo: "Proveedor directo",
  especialista: "Especialista",
  agregador: "Agregador",
  borde: "Borde",
};

const CATEGORY_TINT: Record<Category, string> = {
  hyperscaler: "var(--info)",
  directo: "var(--accent)",
  especialista: "var(--purple)",
  agregador: "var(--ok)",
  borde: "var(--warn)",
};

const KIND_LABEL: Record<ProjectKind, string> = {
  voz: "Voz",
  texto: "Texto",
  imagen: "Imagen",
  mixto: "Mixto",
};

const usd = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/** Precios pequeños necesitan más decimales para no colapsar a cero. */
function money(value: number): string {
  if (value === 0) return "—";
  if (value < 0.01) return `$${value.toFixed(5)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return usd.format(value);
}

/** Cada modalidad se cobra distinto: token, minuto de audio o unidad generada. */
function rateLabel(rate: Rate): string {
  if (rate.perUnit !== undefined) {
    return `${money(rate.perUnit)} / ${rate.unitLabel ?? "unidad"}`;
  }
  if (rate.perAudioMinute !== null) {
    return `${money(rate.perAudioMinute)} / min de audio`;
  }
  return `${money(rate.inputPerMTok ?? 0)} entrada · ${money(rate.outputPerMTok ?? 0)} salida / M tokens`;
}

export function ApiCatalogPage() {
  const [tab, setTab] = useState<Tab>("plataformas");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    PLATFORMS[0].id,
  );
  const [selectedProject, setSelectedProject] = useState<string>(
    PROJECTS[0].id,
  );

  // Parámetros de la calculadora de consumo.
  const [volume, setVolume] = useState(10_000);
  const [inputTokens, setInputTokens] = useState(2_000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [price, setPrice] = useState(0.05);

  const stats = useMemo(catalogStats, []);
  const normalized = query.trim().toLocaleLowerCase("es");

  const platforms = useMemo(
    () =>
      PLATFORMS.filter(
        (platform) =>
          (category === "all" || platform.category === category) &&
          [
            platform.name,
            platform.vendor,
            platform.summary,
            ...platform.modalities,
          ]
            .join(" ")
            .toLocaleLowerCase("es")
            .includes(normalized),
      ),
    [category, normalized],
  );

  const projects = useMemo(
    () =>
      PROJECTS.filter(
        (project) =>
          (kind === "all" || project.kind === kind) &&
          [project.title, project.pitch, ...project.pipeline]
            .join(" ")
            .toLocaleLowerCase("es")
            .includes(normalized),
      ),
    [kind, normalized],
  );

  const platform =
    PLATFORMS.find((entry) => entry.id === selectedPlatform) ??
    platforms[0] ??
    null;
  const project =
    PROJECTS.find((entry) => entry.id === selectedProject) ??
    projects[0] ??
    null;

  // Comparativa de costo total por modelo con los parámetros elegidos.
  const comparison = useMemo(() => {
    const rows = textRates().map((rate) => {
      const perRun = textRunCost(rate, inputTokens, outputTokens);
      const total = perRun * volume;
      const revenue = price * volume;
      return {
        key: `${rate.platform.id}-${rate.model}`,
        platformName: rate.platform.name,
        model: rate.model,
        perRun,
        total,
        margin: revenue > 0 ? ((revenue - total) / revenue) * 100 : 0,
        profit: revenue - total,
      };
    });
    return rows.sort((left, right) => left.total - right.total);
  }, [inputTokens, outputTokens, volume, price]);

  const cheapest = comparison[0];
  const dearest = comparison[comparison.length - 1];

  const panel =
    tab === "proyectos" && project ? (
      <ProjectPanel project={project} />
    ) : tab === "calculadora" ? (
      <CalculatorPanel
        cheapest={cheapest}
        dearest={dearest}
        volume={volume}
        price={price}
      />
    ) : platform ? (
      <PlatformPanel platform={platform} />
    ) : (
      <aside className="context-panel scroll-region">
        <div className="context-title">
          <Server />
          <strong>Catálogo de APIs</strong>
        </div>
        <section>
          <p>Sin resultados para esta búsqueda.</p>
        </section>
      </aside>
    );

  return (
    <CollapsibleLayout storageKey="api-catalog" panel={panel}>
      <header className="page-heading resource-heading">
        <span className="page-icon">
          <Boxes />
        </span>
        <div>
          <h1>Catálogo de APIs y proyectos</h1>
          <p>
            Qué proveedor usar, qué se puede construir con cada uno y cuánto
            deja. Precios de lista en USD, verificados a {PRICING_ASOF}.
          </p>
        </div>
      </header>

      <div className="resource-stats">
        {[
          {
            icon: Server,
            label: "Plataformas",
            value: stats.platforms,
            hint: "proveedores comparados",
            accent: "var(--info)",
          },
          {
            icon: Workflow,
            label: "Proyectos",
            value: stats.projects,
            hint: "con costo y margen",
            accent: "var(--accent)",
          },
          {
            icon: Coins,
            label: "Tarifas",
            value: stats.rates,
            hint: "precios de referencia",
            accent: "var(--purple)",
          },
          {
            icon: Percent,
            label: "Margen mediano",
            value: `${stats.medianMargin}%`,
            hint: "sobre precio de venta",
            accent: "var(--ok)",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              className="panel resource-stat"
              key={stat.label}
              style={{ "--stat-accent": stat.accent } as React.CSSProperties}
            >
              <span className="resource-stat-head">
                <span className="resource-stat-icon">
                  <Icon />
                </span>
                {stat.label}
              </span>
              <strong>{stat.value}</strong>
              <small>{stat.hint}</small>
              <span className="resource-stat-bar" aria-hidden="true" />
            </article>
          );
        })}
      </div>

      <div className="resource-controls">
        <div className="resource-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "plataformas"}
            className={tab === "plataformas" ? "active" : ""}
            onClick={() => setTab("plataformas")}
          >
            Plataformas <em>{PLATFORMS.length}</em>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "proyectos"}
            className={tab === "proyectos" ? "active" : ""}
            onClick={() => setTab("proyectos")}
          >
            Proyectos <em>{PROJECTS.length}</em>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "calculadora"}
            className={tab === "calculadora" ? "active" : ""}
            onClick={() => setTab("calculadora")}
          >
            Consumo y margen
          </button>
        </div>

        {tab !== "calculadora" ? (
          <label className="resource-search">
            <Search />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                tab === "plataformas"
                  ? "Buscar proveedor, modalidad…"
                  : "Buscar proyecto, técnica…"
              }
            />
          </label>
        ) : null}
      </div>

      {tab === "plataformas" ? (
        <>
          <div className="resource-tabs catalog-subtabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={category === "all"}
              className={category === "all" ? "active" : ""}
              onClick={() => setCategory("all")}
            >
              Todas
            </button>
            {(Object.keys(CATEGORY_LABEL) as Category[]).map((entry) => (
              <button
                key={entry}
                type="button"
                role="tab"
                aria-selected={category === entry}
                className={category === entry ? "active" : ""}
                onClick={() => setCategory(entry)}
              >
                {CATEGORY_LABEL[entry]}
              </button>
            ))}
          </div>

          <div className="catalog-grid">
            {platforms.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`panel catalog-card ${entry.id === selectedPlatform ? "selected" : ""}`}
                onClick={() => setSelectedPlatform(entry.id)}
                style={
                  {
                    "--card-accent": CATEGORY_TINT[entry.category],
                  } as React.CSSProperties
                }
              >
                <span className="catalog-card-head">
                  <strong>{entry.name}</strong>
                  <em>{CATEGORY_LABEL[entry.category]}</em>
                </span>
                <small className="catalog-vendor">{entry.vendor}</small>
                <p>{entry.summary}</p>
                <ul className="resource-tags">
                  {entry.modalities.map((modality) => (
                    <li key={modality}>{modality}</li>
                  ))}
                </ul>
                <span className="catalog-card-foot">
                  <Coins /> {entry.billing}
                </span>
              </button>
            ))}
            {platforms.length === 0 ? (
              <p className="catalog-empty">
                Ninguna plataforma coincide con la búsqueda.
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {tab === "proyectos" ? (
        <>
          <div className="resource-tabs catalog-subtabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={kind === "all"}
              className={kind === "all" ? "active" : ""}
              onClick={() => setKind("all")}
            >
              Todos
            </button>
            {(Object.keys(KIND_LABEL) as ProjectKind[]).map((entry) => (
              <button
                key={entry}
                type="button"
                role="tab"
                aria-selected={kind === entry}
                className={kind === entry ? "active" : ""}
                onClick={() => setKind(entry)}
              >
                {KIND_LABEL[entry]}
              </button>
            ))}
          </div>

          <div className="catalog-grid">
            {projects.map((entry) => {
              const margin = projectMargin(entry);
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`panel catalog-card ${entry.id === selectedProject ? "selected" : ""}`}
                  onClick={() => setSelectedProject(entry.id)}
                  style={
                    {
                      "--card-accent":
                        margin.percent >= 80
                          ? "var(--ok)"
                          : margin.percent >= 60
                            ? "var(--accent)"
                            : "var(--warn)",
                    } as React.CSSProperties
                  }
                >
                  <span className="catalog-card-head">
                    <strong>{entry.title}</strong>
                    <em>{KIND_LABEL[entry.kind]}</em>
                  </span>
                  <small className="catalog-vendor">
                    Puesta en marcha: {entry.effort}
                  </small>
                  <p>{entry.pitch}</p>
                  <dl className="catalog-economics">
                    <div>
                      <dt>Costo</dt>
                      <dd>{money(entry.unitCost)}</dd>
                    </div>
                    <div>
                      <dt>Precio</dt>
                      <dd>{money(entry.unitPrice)}</dd>
                    </div>
                    <div>
                      <dt>Margen</dt>
                      <dd className="catalog-margin">
                        {margin.percent.toFixed(0)}%
                      </dd>
                    </div>
                  </dl>
                  <span className="catalog-card-foot">
                    <TrendingUp /> por {entry.billingUnit}
                  </span>
                </button>
              );
            })}
            {projects.length === 0 ? (
              <p className="catalog-empty">
                Ningún proyecto coincide con la búsqueda.
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {tab === "calculadora" ? (
        <section className="panel catalog-calculator">
          <h2>
            <Calculator /> Consumo y margen por modelo
          </h2>
          <p className="catalog-calculator-intro">
            Define el volumen y el tamaño de cada llamada. La tabla ordena los
            modelos de texto del catálogo por costo total y calcula el margen
            frente al precio que cobrarías.
          </p>

          <div className="catalog-inputs">
            <label>
              <span>Llamadas al mes</span>
              <input
                type="number"
                min={1}
                value={volume}
                onChange={(event) =>
                  setVolume(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </label>
            <label>
              <span>Tokens de entrada</span>
              <input
                type="number"
                min={1}
                value={inputTokens}
                onChange={(event) =>
                  setInputTokens(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </label>
            <label>
              <span>Tokens de salida</span>
              <input
                type="number"
                min={1}
                value={outputTokens}
                onChange={(event) =>
                  setOutputTokens(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </label>
            <label>
              <span>Precio por llamada (USD)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(event) =>
                  setPrice(Math.max(0, Number(event.target.value) || 0))
                }
              />
            </label>
          </div>

          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Plataforma</th>
                  <th>Por llamada</th>
                  <th>Costo mensual</th>
                  <th>Ganancia</th>
                  <th>Margen</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <strong>{row.model}</strong>
                    </td>
                    <td>{row.platformName}</td>
                    <td>{money(row.perRun)}</td>
                    <td>{money(row.total)}</td>
                    <td className={row.profit < 0 ? "catalog-negative" : ""}>
                      {money(row.profit)}
                    </td>
                    <td>
                      <span
                        className={`catalog-margin-pill ${
                          row.margin >= 70
                            ? "good"
                            : row.margin >= 40
                              ? "fair"
                              : "poor"
                        }`}
                      >
                        {row.margin.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="catalog-voice-title">
            <Mic /> Referencia de voz, por hora de audio
          </h3>
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Plataforma</th>
                  <th>Por minuto</th>
                  <th>Por hora</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {voiceRates().map((rate) => (
                  <tr key={`${rate.platform.id}-${rate.model}`}>
                    <td>
                      <strong>{rate.model}</strong>
                    </td>
                    <td>{rate.platform.name}</td>
                    <td>{money(rate.perAudioMinute ?? 0)}</td>
                    <td>{money((rate.perAudioMinute ?? 0) * 60)}</td>
                    <td>
                      <small>{rate.note}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="catalog-voice-title">
            <ImageIcon /> Referencia por unidad generada
          </h3>
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Plataforma</th>
                  <th>Precio</th>
                  <th>Por 1.000</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {unitRates().map((rate) => (
                  <tr key={`${rate.platform.id}-${rate.model}`}>
                    <td>
                      <strong>{rate.model}</strong>
                    </td>
                    <td>{rate.platform.name}</td>
                    <td>
                      {money(rate.perUnit ?? 0)} / {rate.unitLabel ?? "unidad"}
                    </td>
                    <td>{money((rate.perUnit ?? 0) * 1000)}</td>
                    <td>
                      <small>{rate.note}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </CollapsibleLayout>
  );
}

function PlatformPanel({ platform }: { platform: Platform }) {
  return (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Server />
        <strong>{platform.name}</strong>
      </div>
      <section>
        <ul className="resource-tags evo-panel-tags">
          <li>{CATEGORY_LABEL[platform.category]}</li>
          {platform.modalities.map((modality) => (
            <li key={modality}>{modality}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>
          <FileText /> Qué es
        </h3>
        <p>{platform.summary}</p>
        <p>
          <small>
            {platform.region} · {platform.billing}
          </small>
        </p>
      </section>
      <section>
        <h3>
          <Sparkles /> A favor
        </h3>
        <ul className="evo-impact">
          {platform.strengths.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>
          <AlertTriangle /> Lo que hay que asumir
        </h3>
        <ul className="evo-impact">
          {platform.tradeoffs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>
          <Coins /> Tarifas de referencia
        </h3>
        <ul className="catalog-rate-list">
          {platform.rates.map((rate) => (
            <li key={rate.model}>
              <strong>{rate.model}</strong>
              <span>{rateLabel(rate)}</span>
              <small>{rate.note}</small>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>
          <Layers /> Enlaces
        </h3>
        <ul className="evo-sources">
          <li>
            <div>
              <strong>Documentación</strong>
              <small>{platform.vendor}</small>
            </div>
            <a
              className="secondary-button compact"
              href={platform.docsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Abrir <ExternalLink />
            </a>
          </li>
          <li>
            <div>
              <strong>Precios oficiales</strong>
              <small>Verificar antes de cotizar</small>
            </div>
            <a
              className="secondary-button compact"
              href={platform.pricingUrl}
              target="_blank"
              rel="noreferrer"
            >
              Abrir <ExternalLink />
            </a>
          </li>
        </ul>
      </section>
    </aside>
  );
}

function ProjectPanel({ project }: { project: Project }) {
  const margin = projectMargin(project);
  const used = PLATFORMS.filter((platform) =>
    project.platforms.includes(platform.id),
  );
  return (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Workflow />
        <strong>{project.title}</strong>
      </div>
      <section>
        <ul className="resource-tags evo-panel-tags">
          <li>{KIND_LABEL[project.kind]}</li>
          <li>{project.effort}</li>
        </ul>
        <p>{project.pitch}</p>
      </section>
      <section>
        <h3>
          <Layers /> Cómo se arma
        </h3>
        <ol className="catalog-pipeline">
          {project.pipeline.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <section>
        <h3>
          <Percent /> Economía por {project.billingUnit}
        </h3>
        <ul className="catalog-rate-list">
          <li>
            <strong>Costo de API</strong>
            <span>{money(project.unitCost)}</span>
          </li>
          <li>
            <strong>Precio sugerido</strong>
            <span>{money(project.unitPrice)}</span>
          </li>
          <li>
            <strong>Margen bruto</strong>
            <span>
              {money(margin.profit)} · {margin.percent.toFixed(0)}% ·{" "}
              {margin.multiple.toFixed(1)}×
            </span>
          </li>
        </ul>
      </section>
      <section>
        <h3>
          <AlertTriangle /> Riesgo de margen
        </h3>
        <p>{project.marginRisk}</p>
      </section>
      <section>
        <h3>
          <Server /> Plataformas que encajan
        </h3>
        <ul className="evo-sources">
          {used.map((platform) => (
            <li key={platform.id}>
              <div>
                <strong>{platform.name}</strong>
                <small>{CATEGORY_LABEL[platform.category]}</small>
              </div>
              <a
                className="secondary-button compact"
                href={platform.docsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Docs <ExternalLink />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

function CalculatorPanel({
  cheapest,
  dearest,
  volume,
  price,
}: {
  cheapest?: { model: string; platformName: string; total: number };
  dearest?: { model: string; platformName: string; total: number };
  volume: number;
  price: number;
}) {
  const revenue = price * volume;
  const spread = cheapest && dearest ? dearest.total - cheapest.total : 0;
  return (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Calculator />
        <strong>Lectura del cálculo</strong>
      </div>
      <section>
        <h3>
          <TrendingUp /> Ingreso del escenario
        </h3>
        <p>
          {volume.toLocaleString("es-PE")} llamadas × {money(price)} ={" "}
          <strong>{money(revenue)}</strong> al mes.
        </p>
      </section>
      {cheapest ? (
        <section>
          <h3>
            <Coins /> Opción más barata
          </h3>
          <p>
            <strong>{cheapest.model}</strong> en {cheapest.platformName}, por{" "}
            {money(cheapest.total)} al mes.
          </p>
        </section>
      ) : null}
      {dearest ? (
        <section>
          <h3>
            <AlertTriangle /> Opción más cara
          </h3>
          <p>
            <strong>{dearest.model}</strong> en {dearest.platformName}, por{" "}
            {money(dearest.total)} al mes. La diferencia entre los dos extremos
            es de {money(spread)}.
          </p>
        </section>
      ) : null}
      <section>
        <h3>
          <FileText /> Qué no incluye
        </h3>
        <ul className="evo-impact">
          <li>Reintentos por error o por respuesta mal formada</li>
          <li>Almacenamiento, base vectorial y ancho de banda</li>
          <li>Descuentos por lote o por caché de prompts</li>
          <li>El costo de las personas que operan el sistema</li>
        </ul>
      </section>
      <section>
        <p>
          <small>
            Precios de lista verificados a {PRICING_ASOF}. Confirma en la página
            oficial del proveedor antes de cotizar a un cliente.
          </small>
        </p>
      </section>
    </aside>
  );
}
