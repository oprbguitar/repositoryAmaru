import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  Cpu,
  Database,
  Download,
  ExternalLink,
  GitFork,
  Heart,
  Search,
  Star,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  GithubRankingEntry,
  ModelRankingEntry,
  ObservatoryRecord,
} from "../../../types/api";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { getGithubRankings, getModelRankings, getRecords } from "./api";
import { formatDate, formatNumber, missing } from "./format";

type CatalogView =
  | "projects"
  | "spaces"
  | "hf-models"
  | "open-models"
  | "datasets";

type CatalogItem = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  kind: string;
  updatedAt: string | null;
  language: string | null;
  license: string | null;
  tags: string[];
  metrics: Array<{ label: string; value: string }>;
};

const views: Array<{ id: CatalogView; label: string }> = [
  { id: "projects", label: "Proyectos GitHub" },
  { id: "spaces", label: "Apps y demos" },
  { id: "hf-models", label: "Modelos Hugging Face" },
  { id: "open-models", label: "Modelos OpenRouter" },
  { id: "datasets", label: "Datasets" },
];

function dataString(record: ObservatoryRecord, key: string): string | null {
  const value = record.data[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function dataNumber(record: ObservatoryRecord, key: string): number | null {
  const value = record.data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dataTags(record: ObservatoryRecord): string[] {
  return Array.isArray(record.data.tags)
    ? record.data.tags.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
}

function hubItem(record: ObservatoryRecord, kind: string): CatalogItem {
  const downloads = dataNumber(record, "downloads");
  const likes = dataNumber(record, "likes");
  return {
    id: record.id,
    title: record.title,
    description: record.summary,
    url: record.originalUrl,
    source: record.sourceName,
    kind,
    updatedAt: record.publishedAt,
    language: record.language,
    license: dataString(record, "license"),
    tags: dataTags(record),
    metrics: [
      { label: "Descargas", value: formatNumber(downloads) },
      { label: "Likes", value: formatNumber(likes) },
      { label: "Librería", value: dataString(record, "library") ?? missing },
    ],
  };
}

function githubItem(entry: GithubRankingEntry): CatalogItem {
  return {
    id: entry.id,
    title: entry.fullName,
    description: entry.description,
    url: entry.url,
    source: entry.sourceName,
    kind: "Proyecto local / self-hosted",
    updatedAt: entry.pushedAt,
    language: entry.language,
    license: entry.license,
    tags: entry.topics,
    metrics: [
      { label: "Stars", value: formatNumber(entry.stars) },
      { label: "Forks", value: formatNumber(entry.forks) },
      { label: "Issues", value: formatNumber(entry.openIssues) },
    ],
  };
}

function openRouterItem(entry: ModelRankingEntry): CatalogItem {
  return {
    id: entry.modelExternalId,
    title: entry.modelTitle,
    description: entry.summary,
    url: entry.url ?? entry.methodologyUrl ?? "https://openrouter.ai/models",
    source: entry.sourceName,
    kind: "Modelo open-weight",
    updatedAt: entry.rankingDate,
    language: null,
    license: null,
    tags: [],
    metrics: [
      { label: "Contexto", value: formatNumber(entry.contextLength) },
      { label: "Posición", value: `#${entry.position}` },
      { label: "Ranking", value: entry.scoreUnit ?? missing },
    ],
  };
}

function popularity(record: ObservatoryRecord): number {
  return dataNumber(record, "downloads") ?? dataNumber(record, "likes") ?? 0;
}

type CatalogSort = "popular" | "recent" | "name";

export function OpenLocalPage() {
  const [view, setView] = useState<CatalogView>("projects");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CatalogSort>("popular");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const github = useQuery({
    queryKey: ["github-rankings", "open-local"],
    queryFn: () => getGithubRankings("open-local"),
  });
  const hfModels = useQuery({
    queryKey: ["records", "open-local-models"],
    queryFn: () =>
      getRecords({ kind: "model", source: "hugging-face", limit: 100 }),
  });
  const spaces = useQuery({
    queryKey: ["records", "open-local-spaces"],
    queryFn: () =>
      getRecords({ kind: "space", source: "hugging-face", limit: 100 }),
  });
  const datasets = useQuery({
    queryKey: ["records", "open-local-datasets"],
    queryFn: () =>
      getRecords({ kind: "dataset", source: "hugging-face", limit: 100 }),
  });
  const openModels = useQuery({
    queryKey: ["model-rankings", "open-local"],
    queryFn: () => getModelRankings("open-local"),
  });

  const catalog = useMemo<Record<CatalogView, CatalogItem[]>>(() => {
    const sortedHub = (records: ObservatoryRecord[], kind: string) =>
      [...records]
        .sort((left, right) => popularity(right) - popularity(left))
        .map((record) => hubItem(record, kind));
    return {
      projects: (github.data?.data.entries ?? []).slice(0, 40).map(githubItem),
      spaces: sortedHub(
        (spaces.data?.data ?? []).filter(
          (record) => (dataNumber(record, "likes") ?? 0) > 0,
        ),
        "App / demo publicada",
      ),
      "hf-models": sortedHub(hfModels.data?.data ?? [], "Modelo descargable"),
      "open-models": (openModels.data?.data.entries ?? [])
        .slice(0, 60)
        .map(openRouterItem),
      datasets: sortedHub(datasets.data?.data ?? [], "Dataset abierto"),
    };
  }, [datasets.data, github.data, hfModels.data, openModels.data, spaces.data]);

  const items = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    const filtered = catalog[view].filter((item) =>
      [item.title, item.description ?? "", item.source, ...item.tags]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(normalized),
    );
    if (sort === "recent")
      return [...filtered].sort((left, right) =>
        (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""),
      );
    if (sort === "name")
      return [...filtered].sort((left, right) =>
        left.title.localeCompare(right.title, "es"),
      );
    return filtered;
  }, [catalog, query, sort, view]);
  const chosen =
    items.find((item) => item.id === selected?.id) ?? items[0] ?? null;

  const panel = chosen ? (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Boxes />
        <strong>Ficha del recurso</strong>
      </div>
      <section>
        <span className="state-badge verified">Fuente verificada</span>
        <h2 className="context-record-title">{chosen.title}</h2>
        <p>{chosen.description ?? "La fuente no publicó una descripción."}</p>
      </section>
      <section>
        <h3>Datos publicados</h3>
        <dl className="context-facts">
          <dt>Tipo</dt>
          <dd>{chosen.kind}</dd>
          <dt>Fuente</dt>
          <dd>{chosen.source}</dd>
          <dt>Actualización</dt>
          <dd>{formatDate(chosen.updatedAt)}</dd>
          <dt>Lenguaje</dt>
          <dd>{chosen.language ?? missing}</dd>
          <dt>Licencia</dt>
          <dd>{chosen.license ?? missing}</dd>
          {chosen.metrics.map((metric) => (
            <div className="contents" key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {chosen.tags.length ? (
        <section>
          <h3>Etiquetas de la fuente</h3>
          <p>{chosen.tags.slice(0, 12).join(" · ")}</p>
        </section>
      ) : null}
      <section>
        <h3>Acceso</h3>
        <a
          className="source-link-button"
          href={chosen.url}
          target="_blank"
          rel="noreferrer"
        >
          Abrir en {chosen.source} <ExternalLink />
        </a>
      </section>
    </aside>
  ) : (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Boxes />
        <strong>Ficha del recurso</strong>
      </div>
      <section>
        <p>Selecciona un recurso para revisar sus metadatos y procedencia.</p>
      </section>
    </aside>
  );

  return (
    <CollapsibleLayout storageKey="open-local" panel={panel}>
      <header className="page-heading">
        <div>
          <h1>
            <Wrench /> Open y local
          </h1>
          <p>
            Proyectos abiertos, modelos, demos publicadas y datasets obtenidos
            de GitHub, Hugging Face y OpenRouter.
          </p>
        </div>
      </header>
      <div className="stat-grid open-local-stats">
        <article className="panel">
          <GitFork />
          <span>Proyectos locales</span>
          <strong>{catalog.projects.length}</strong>
          <small>GitHub REST · ordenados por estrellas</small>
        </article>
        <article className="panel">
          <Heart />
          <span>Apps y demos</span>
          <strong>{catalog.spaces.length}</strong>
          <small>Hugging Face Spaces</small>
        </article>
        <article className="panel">
          <Cpu />
          <span>Modelos abiertos</span>
          <strong>
            {catalog["hf-models"].length + catalog["open-models"].length}
          </strong>
          <small>Hugging Face + OpenRouter</small>
        </article>
        <article className="panel">
          <Database />
          <span>Datasets</span>
          <strong>{catalog.datasets.length}</strong>
          <small>Hugging Face Hub</small>
        </article>
      </div>
      <div className="open-local-controls panel">
        <div className="ranking-tabs" role="tablist">
          {views.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={view === entry.id}
              className={view === entry.id ? "active" : ""}
              onClick={() => {
                setView(entry.id);
                setSelected(null);
              }}
            >
              {entry.label} ({catalog[entry.id].length})
            </button>
          ))}
        </div>
        <label className="module-search">
          <Search />
          <input
            aria-label="Buscar recursos abiertos"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar proyecto, modelo, autor o etiqueta…"
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
        <label className="open-local-sort">
          <span>Orden</span>
          <select
            aria-label="Ordenar recursos"
            value={sort}
            onChange={(event) => setSort(event.target.value as CatalogSort)}
          >
            <option value="popular">Popularidad</option>
            <option value="recent">Más recientes</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </label>
      </div>
      <p className="open-catalog-count" aria-live="polite">
        {items.length} recursos{query ? ` para «${query.trim()}»` : ""}
      </p>
      <section className="open-catalog-grid" aria-label="Catálogo abierto">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.id}
              className={`panel open-catalog-card ${chosen?.id === item.id ? "selected" : ""}`}
              onClick={() => setSelected(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter") setSelected(item);
              }}
            >
              <div className="open-catalog-source">
                <span>{item.source}</span>
                <span>{item.kind}</span>
              </div>
              <h2>{item.title}</h2>
              <p>
                {item.description ?? "Descripción no publicada por la fuente."}
              </p>
              <div className="open-catalog-metrics">
                {item.metrics.slice(0, 2).map((metric) => (
                  <span key={metric.label}>
                    {metric.label === "Stars" ? <Star /> : <Download />}
                    {metric.label}: {metric.value}
                  </span>
                ))}
              </div>
              <div className="open-catalog-footer">
                <span>{formatDate(item.updatedAt)}</span>
                <button type="button" onClick={() => setSelected(item)}>
                  Ver ficha
                </button>
                <a href={item.url} target="_blank" rel="noreferrer">
                  Abrir fuente <ExternalLink />
                </a>
              </div>
            </article>
          ))
        ) : (
          <div className="honest-empty panel">
            <h2>
              {catalog[view].length
                ? "No hay resultados para esta búsqueda"
                : "Esta pestaña aún no tiene datos sincronizados"}
            </h2>
            <p>
              {catalog[view].length
                ? "Prueba otra pestaña, otro orden o un término distinto."
                : "Ejecuta la sincronización de fuentes públicas desde Administración para poblar este catálogo."}
            </p>
          </div>
        )}
      </section>
    </CollapsibleLayout>
  );
}
