import {
  ArrowDownUp,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarRange,
  Code2,
  ExternalLink,
  FileText,
  Flag,
  GitBranch,
  LineChart,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import {
  CONCEPT_FLOW,
  ERAS,
  type EraId,
  MILESTONES,
  type Milestone,
  timelineStats,
} from "./timeline";

type EraFilter = EraId | "all";
type TimelineSort = "asc" | "desc";

/** One badge tint per milestone type, drawn from the semantic palette. */
const TYPE_TINTS: Record<Milestone["type"], string> = {
  Concepto: "var(--info)",
  Evento: "var(--ok)",
  Técnica: "var(--purple)",
  Contexto: "var(--warn)",
  Hito: "var(--accent)",
  Modelo: "var(--info)",
  Arquitectura: "var(--accent)",
  Paradigma: "var(--purple)",
  Tendencia: "var(--ok)",
};

export function EvolutionPage() {
  const [era, setEra] = useState<EraFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TimelineSort>("asc");
  const [selectedId, setSelectedId] = useState<string>("transformers");

  const stats = useMemo(timelineStats, []);

  const items = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    const filtered = MILESTONES.filter(
      (milestone) =>
        (era === "all" || milestone.era === era) &&
        [milestone.title, milestone.description, ...milestone.tags]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(normalized),
    );
    return [...filtered].sort((left, right) =>
      sort === "asc" ? left.year - right.year : right.year - left.year,
    );
  }, [era, query, sort]);

  const chosen =
    items.find((milestone) => milestone.id === selectedId) ?? items[0] ?? null;

  const panel = chosen ? (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <GitBranch />
        <strong>
          {chosen.yearLabel} · {chosen.title}
        </strong>
      </div>
      <section>
        <ul className="resource-tags evo-panel-tags">
          {chosen.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>
          <FileText /> Resumen
        </h3>
        <p>{chosen.summary}</p>
      </section>
      <section>
        <h3>
          <LineChart /> Impacto
        </h3>
        <ul className="evo-impact">
          {chosen.impact.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>
          <Brain /> Conceptos relacionados
        </h3>
        <ul className="resource-tags evo-panel-tags">
          {chosen.concepts.map((concept) => (
            <li key={concept}>{concept}</li>
          ))}
        </ul>
      </section>
      {chosen.keyModels.length ? (
        <section>
          <h3>
            <Star /> Modelos y sistemas clave
          </h3>
          <p>{chosen.keyModels.join(" · ")}</p>
        </section>
      ) : null}
      <section>
        <h3>
          <BookOpen /> Fuentes
        </h3>
        <ul className="evo-sources">
          {chosen.sources.map((source) => (
            <li key={source.url}>
              <div>
                <strong>{source.title}</strong>
                <small>{source.author}</small>
              </div>
              <a
                className="secondary-button compact"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                Abrir fuente <ExternalLink />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  ) : (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <GitBranch />
        <strong>Cronología</strong>
      </div>
      <section>
        <p>Selecciona un hito para ver su resumen, impacto y fuentes.</p>
      </section>
    </aside>
  );

  return (
    <CollapsibleLayout storageKey="evolution" panel={panel}>
      <header className="page-heading resource-heading">
        <span className="page-icon">
          <GitBranch />
        </span>
        <div>
          <h1>Evolución de la IA</h1>
          <p>
            Wiki visual y cronología explicada. Contenido curado: cada hito cita
            sus fuentes originales.
          </p>
        </div>
      </header>

      <div className="resource-stats">
        {[
          {
            icon: Flag,
            label: "Hitos",
            value: stats.milestones,
            hint: "momentos clave",
            accent: "var(--accent)",
          },
          {
            icon: CalendarRange,
            label: "Eras",
            value: stats.eras,
            hint: "períodos definidos",
            accent: "var(--info)",
          },
          {
            icon: Brain,
            label: "Modelos clave",
            value: stats.keyModels,
            hint: "referencias destacadas",
            accent: "var(--purple)",
          },
          {
            icon: ShieldCheck,
            label: "Fuentes citadas",
            value: stats.sources,
            hint: "documentos y enlaces",
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
            aria-selected={era === "all"}
            className={era === "all" ? "active" : ""}
            onClick={() => setEra("all")}
          >
            Todas <em>{MILESTONES.length}</em>
          </button>
          {ERAS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={era === entry.id}
              className={era === entry.id ? "active" : ""}
              onClick={() => setEra(entry.id)}
            >
              {entry.label}{" "}
              <em>{MILESTONES.filter((m) => m.era === entry.id).length}</em>
            </button>
          ))}
        </div>
        <label className="module-search resource-search">
          <Search />
          <input
            aria-label="Buscar hito"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar hito…"
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              aria-label="Limpiar búsqueda"
              onClick={() => setQuery("")}
            >
              <X />
            </button>
          ) : null}
        </label>
        <label className="resource-sort">
          <ArrowDownUp />
          <span>Ordenar</span>
          <select
            aria-label="Ordenar hitos por año"
            value={sort}
            onChange={(event) => setSort(event.target.value as TimelineSort)}
          >
            <option value="asc">Año ↑</option>
            <option value="desc">Año ↓</option>
          </select>
        </label>
      </div>

      <section className="panel evo-timeline" aria-label="Cronología de la IA">
        {items.length ? (
          <ol>
            {items.map((milestone) => (
              <li
                key={milestone.id}
                className={chosen?.id === milestone.id ? "selected" : ""}
              >
                <button
                  type="button"
                  aria-pressed={chosen?.id === milestone.id}
                  onClick={() => setSelectedId(milestone.id)}
                >
                  <span className="evo-dot" aria-hidden="true" />
                  <span className="evo-year">{milestone.yearLabel}</span>
                  <span className="evo-body">
                    <strong>{milestone.title}</strong>
                    <small>{milestone.description}</small>
                  </span>
                  <span
                    className="evo-type"
                    style={
                      {
                        "--type-tint": TYPE_TINTS[milestone.type],
                      } as React.CSSProperties
                    }
                  >
                    {milestone.type}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="honest-empty">
            <h2>No hay hitos para esta búsqueda</h2>
            <p>Prueba otra era u otro término.</p>
          </div>
        )}
      </section>

      {chosen ? (
        <section className="evo-explainer" aria-label="Explicación del hito">
          <article className="panel">
            <h3>
              <FileText /> Qué pasó
            </h3>
            <p>{chosen.whatHappened}</p>
          </article>
          <article className="panel">
            <h3>
              <Star /> Por qué importó
            </h3>
            <p>{chosen.whyItMattered}</p>
          </article>
          <article className="panel">
            <h3>
              <Code2 /> Ejemplo simple
            </h3>
            <p>{chosen.simpleExample}</p>
          </article>
        </section>
      ) : null}

      <section
        className="evo-concepts"
        aria-label="Evolución de conceptos clave"
      >
        <h3>Evolución de conceptos clave</h3>
        <div className="evo-concept-flow">
          {CONCEPT_FLOW.map((concept, index) => (
            <div className="evo-concept-step" key={concept.id}>
              {index > 0 ? <ArrowRight aria-hidden="true" /> : null}
              <button
                type="button"
                className={`panel evo-concept${chosen?.id === concept.milestoneId ? " active" : ""}`}
                onClick={() => {
                  setEra("all");
                  setQuery("");
                  setSelectedId(concept.milestoneId);
                }}
              >
                <strong>{concept.label}</strong>
                <small>{concept.hint}</small>
              </button>
            </div>
          ))}
        </div>
      </section>
    </CollapsibleLayout>
  );
}
