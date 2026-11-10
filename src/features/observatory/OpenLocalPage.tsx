import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  Calendar,
  Check,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FileCode2,
  GitFork,
  Heart,
  Link2,
  Scale,
  Search,
  Star,
  Tag,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  GithubRankingEntry,
  ModelRankingEntry,
  ObservatoryRecord,
} from "../../../types/api";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { FavoriteStar } from "../favorites/FavoriteStar";
import { LocalModelManager } from "../local-models/LocalModelManager";
import { getGithubRankings, getModelRankings, getRecords } from "./api";
import { formatDate, formatNumber, missing } from "./format";
import { ResourceAvatar } from "./ResourceAvatar";

type CatalogView =
  | "projects"
  | "spaces"
  | "hf-models"
  | "open-models"
  | "datasets";

type CatalogMetric = {
  label: string;
  value: string;
  icon: "star" | "fork" | "download" | "heart" | "cpu" | "hash";
};

type CatalogItem = {
  id: string;
  title: string;
  owner: string | null;
  description: string | null;
  url: string;
  source: string;
  kind: string;
  updatedAt: string | null;
  language: string | null;
  license: string | null;
  tags: string[];
  metrics: CatalogMetric[];
};

const views: Array<{ id: CatalogView; label: string }> = [
  { id: "projects", label: "Proyectos GitHub" },
  { id: "spaces", label: "Apps y demos" },
  { id: "hf-models", label: "Modelos Hugging Face" },
  { id: "open-models", label: "Modelos OpenRouter" },
  { id: "datasets", label: "Datasets" },
];

const PAGE_SIZE = 12;

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
    owner: record.title.includes("/") ? record.title.split("/")[0] : null,
    description: record.summary,
    url: record.originalUrl,
    source: record.sourceName,
    kind,
    updatedAt: record.publishedAt,
    language: record.language,
    license: dataString(record, "license"),
    tags: dataTags(record),
    metrics: [
      { label: "Descargas", value: formatNumber(downloads), icon: "download" },
      { label: "Likes", value: formatNumber(likes), icon: "heart" },
      {
        label: "Librería",
        value: dataString(record, "library") ?? missing,
        icon: "cpu",
      },
    ],
  };
}

function githubItem(entry: GithubRankingEntry): CatalogItem {
  return {
    id: entry.id,
    title: entry.fullName,
    owner: entry.owner,
    description: entry.description,
    url: entry.url,
    source: entry.sourceName,
    kind: "Proyecto local / self-hosted",
    updatedAt: entry.pushedAt,
    language: entry.language,
    license: entry.license,
    tags: entry.topics,
    metrics: [
      { label: "Stars", value: formatNumber(entry.stars), icon: "star" },
      { label: "Forks", value: formatNumber(entry.forks), icon: "fork" },
      { label: "Issues", value: formatNumber(entry.openIssues), icon: "hash" },
    ],
  };
}

function openRouterItem(entry: ModelRankingEntry): CatalogItem {
  return {
    id: entry.modelExternalId,
    title: entry.modelTitle,
    owner: entry.modelExternalId.includes("/")
      ? entry.modelExternalId.split("/")[0]
      : null,
    description: entry.summary,
    url: entry.url ?? entry.methodologyUrl ?? "https://openrouter.ai/models",
    source: entry.sourceName,
    kind: "Modelo open-weight",
    updatedAt: entry.rankingDate,
    language: null,
    license: null,
    tags: [],
    metrics: [
      {
        label: "Contexto",
        value: formatNumber(entry.contextLength),
        icon: "cpu",
      },
      { label: "Posición", value: `#${entry.position}`, icon: "hash" },
    ],
  };
}

function popularity(record: ObservatoryRecord): number {
  return dataNumber(record, "downloads") ?? dataNumber(record, "likes") ?? 0;
}

type CatalogSort = "popular" | "recent" | "name";

function MetricIcon({ icon }: { icon: CatalogMetric["icon"] }) {
  if (icon === "star") return <Star />;
  if (icon === "fork") return <GitFork />;
  if (icon === "download") return <Download />;
  if (icon === "heart") return <Heart />;
  if (icon === "cpu") return <Cpu />;
  return <FileCode2 />;
}

/** Copies the resource URL and confirms it inline, without leaving the page. */
function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <div className="resource-share">
      <a
        className="icon-button"
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir enlace original"
        title="Abrir enlace original"
      >
        <Link2 />
      </a>
      <button
        type="button"
        className="icon-button"
        aria-label={copied ? "Enlace copiado" : "Copiar enlace"}
        title={copied ? "Enlace copiado" : "Copiar enlace"}
        onClick={() => {
          navigator.clipboard?.writeText(url).then(
            () => setCopied(true),
            () => setCopied(false),
          );
        }}
      >
        {copied ? <Check /> : <Copy />}
      </button>
      {copied ? (
        <span role="status" className="resource-share-note">
          Enlace copiado
        </span>
      ) : null}
    </div>
  );
}

export function OpenLocalPage() {
  const [view, setView] = useState<CatalogView>("projects");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CatalogSort>("popular");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [page, setPage] = useState(1);

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

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  // Keep the page in range when filters shrink the result set.
  const currentPage = Math.min(page, pageCount);
  const visible = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const chosen =
    items.find((item) => item.id === selected?.id) ?? visible[0] ?? null;

  function changeView(next: CatalogView) {
    setView(next);
    setSelected(null);
    setPage(1);
  }

  const panel = chosen ? (
    <aside className="context-panel scroll-region resource-panel">
      <div className="context-title">
        <Boxes />
        <strong>Ficha del recurso</strong>
        <button
          type="button"
          className="icon-button context-close"
          aria-label="Cerrar ficha"
          onClick={() => setSelected(null)}
        >
          <X />
        </button>
      </div>
      <section>
        <span className="state-badge verified">
          <Check /> Fuente verificada
        </span>
        <h2 className="context-record-title">{chosen.title}</h2>
        <p>{chosen.description ?? "La fuente no publicó una descripción."}</p>
      </section>
      <section>
        <h3>Datos publicados</h3>
        <ul className="resource-facts">
          <li>
            <Boxes />
            <span>Tipo</span>
            <strong>{chosen.kind}</strong>
          </li>
          <li>
            <Database />
            <span>Fuente</span>
            <strong>{chosen.source}</strong>
          </li>
          <li>
            <Calendar />
            <span>Actualización</span>
            <strong>{formatDate(chosen.updatedAt)}</strong>
          </li>
          <li>
            <FileCode2 />
            <span>Lenguaje</span>
            <strong>{chosen.language ?? missing}</strong>
          </li>
          <li>
            <Scale />
            <span>Licencia</span>
            <strong>{chosen.license ?? missing}</strong>
          </li>
          {chosen.metrics.map((metric) => (
            <li key={metric.label}>
              <MetricIcon icon={metric.icon} />
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </li>
          ))}
        </ul>
      </section>
      {chosen.tags.length ? (
        <section>
          <h3>
            <Tag /> Etiquetas de la fuente
          </h3>
          <ul className="resource-tags">
            {chosen.tags.slice(0, 12).map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
            {chosen.tags.length > 12 ? (
              <li className="resource-tags-more">
                +{chosen.tags.length - 12} más
              </li>
            ) : null}
          </ul>
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
      <section>
        <h3>Compartir</h3>
        <ShareLink url={chosen.url} />
      </section>
    </aside>
  ) : (
    <aside className="context-panel scroll-region resource-panel">
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
      <header className="page-heading resource-heading">
        <span className="page-icon">
          <Wrench />
        </span>
        <div>
          <h1>Open y local</h1>
          <p>
            Qué es: el catálogo de IA que puedes descargar y ejecutar en tu
            propia computadora, sin depender de una API de pago. Aquí ves
            proyectos abiertos, modelos, demos y datasets de GitHub, Hugging
            Face y OpenRouter, y puedes descargar un modelo a tu carpeta.
          </p>
        </div>
      </header>
      <LocalModelManager />

      <div className="resource-stats">
        {[
          {
            icon: GitFork,
            label: "Proyectos locales",
            value: catalog.projects.length,
            hint: "GitHub REST · ordenados por estrellas",
            accent: "var(--info)",
          },
          {
            icon: Heart,
            label: "Apps y demos",
            value: catalog.spaces.length,
            hint: "Hugging Face Spaces",
            accent: "var(--purple)",
          },
          {
            icon: Cpu,
            label: "Modelos abiertos",
            value: catalog["hf-models"].length + catalog["open-models"].length,
            hint: "Hugging Face + OpenRouter",
            accent: "var(--ok)",
          },
          {
            icon: Database,
            label: "Datasets",
            value: catalog.datasets.length,
            hint: "Hugging Face Hub",
            accent: "var(--warn)",
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
              <strong>{formatNumber(stat.value)}</strong>
              <small>{stat.hint}</small>
              <span className="resource-stat-bar" aria-hidden="true" />
            </article>
          );
        })}
      </div>

      <div className="resource-controls">
        <div className="resource-tabs" role="tablist">
          {views.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={view === entry.id}
              className={view === entry.id ? "active" : ""}
              onClick={() => changeView(entry.id)}
            >
              {entry.label} <em>{catalog[entry.id].length}</em>
            </button>
          ))}
        </div>
        <label className="module-search resource-search">
          <Search />
          <input
            aria-label="Buscar recursos abiertos"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar proyecto, modelo, autor o etiqueta…"
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
            >
              <X />
            </button>
          ) : null}
        </label>
        <label className="resource-sort">
          <span>Orden</span>
          <select
            aria-label="Ordenar recursos"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as CatalogSort);
              setPage(1);
            }}
          >
            <option value="popular">Popularidad</option>
            <option value="recent">Más recientes</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </label>
      </div>

      <p className="resource-count" aria-live="polite">
        {items.length} recursos{query ? ` para «${query.trim()}»` : ""}
      </p>

      <section className="resource-grid" aria-label="Catálogo abierto">
        {visible.length ? (
          visible.map((item) => (
            <article
              key={item.id}
              className={`panel resource-card${chosen?.id === item.id ? " selected" : ""}`}
            >
              <div className="resource-card-badges">
                <span className="resource-chip">{item.source}</span>
                <span className="resource-chip is-kind">{item.kind}</span>
              </div>
              <div className="resource-card-title">
                <ResourceAvatar
                  name={item.title}
                  owner={item.owner}
                  source={item.source}
                />
                <h2>{item.title}</h2>
                <FavoriteStar
                  kind={
                    item.source.toLowerCase().includes("github")
                      ? "repo"
                      : "model"
                  }
                  id={item.id}
                  label={item.title}
                  url={item.url}
                />
              </div>
              <p>
                {item.description ?? "Descripción no publicada por la fuente."}
              </p>
              <div className="resource-card-metrics">
                {item.metrics.slice(0, 2).map((metric) => (
                  <span key={metric.label} title={metric.label}>
                    <MetricIcon icon={metric.icon} />
                    {metric.value}
                  </span>
                ))}
              </div>
              <div className="resource-card-footer">
                <span>{formatDate(item.updatedAt)}</span>
                <button
                  type="button"
                  className="resource-card-open"
                  onClick={() => setSelected(item)}
                >
                  Ver ficha
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="icon-button"
                  aria-label={`Abrir ${item.title} en ${item.source}`}
                  title={`Abrir en ${item.source}`}
                >
                  <ExternalLink />
                </a>
              </div>
            </article>
          ))
        ) : (
          <div className="honest-empty panel resource-empty">
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

      {pageCount > 1 ? (
        <nav
          className="resource-pagination"
          aria-label="Paginación del catálogo"
        >
          <button
            type="button"
            className="icon-button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            ‹
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1)
            .filter(
              (number) =>
                number === 1 ||
                number === pageCount ||
                Math.abs(number - currentPage) <= 1,
            )
            .map((number, index, list) => (
              <span key={number} className="resource-page-slot">
                {index > 0 && number - list[index - 1] > 1 ? (
                  <span className="resource-page-gap">…</span>
                ) : null}
                <button
                  type="button"
                  className={number === currentPage ? "active" : ""}
                  aria-current={number === currentPage ? "page" : undefined}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              </span>
            ))}
          <button
            type="button"
            className="icon-button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            aria-label="Página siguiente"
          >
            ›
          </button>
        </nav>
      ) : null}
    </CollapsibleLayout>
  );
}
