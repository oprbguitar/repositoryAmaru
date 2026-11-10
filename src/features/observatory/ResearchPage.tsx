import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownUp,
  BookOpen,
  CalendarDays,
  CircleAlert,
  Database,
  ExternalLink,
  FileType2,
  FilterX,
  LayoutGrid,
  List,
  Quote,
  Search,
  Shapes,
  Unlock,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ObservatoryRecord, SourceHealth } from "../../../types/api";
import { useIsAdmin } from "../admin/AdminNote";
import { getRecords, getSources } from "./api";
import { formatDate, verificationLabel } from "./format";
import { RecordContext } from "./RecordContext";
import {
  evidenceType,
  evidenceTypeLabel,
  filterResearchRecords,
  isFuturePublication,
  type ResearchDateRange,
  type ResearchSort,
} from "./researchFilters";
import { SyncButton } from "./SyncButton";

type ViewMode = "grid" | "list";

function authorsOf(record: ObservatoryRecord): string[] {
  return Array.isArray(record.data.authors)
    ? record.data.authors.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
}

/**
 * Tarjeta de un resultado. Cada dato mostrado viene del índice de origen; los
 * que la fuente no entrega se declaran en lugar de omitirse en silencio.
 */
function ResearchCard({
  record,
  selected,
  onSelect,
}: {
  record: ObservatoryRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const authors = authorsOf(record);
  const citations = record.data.citationCount;
  const future = isFuturePublication(record);
  return (
    <article className={`panel research-card${selected ? " selected" : ""}`}>
      <header className="research-card-head">
        <span className="research-card-source">{record.sourceName}</span>
        <span
          className={`state-badge ${record.verificationStatus === "verified" ? "verified" : "provisional"}`}
        >
          {verificationLabel(record)}
        </span>
        {record.data.openAccess === true ? (
          <span className="research-chip open">
            <Unlock /> Acceso abierto
          </span>
        ) : null}
      </header>
      <h3>{record.title}</h3>
      <p className="research-card-abstract">
        {record.summary ??
          "El índice de origen no proporcionó un resumen reutilizable."}
      </p>
      <ul className="research-card-facts">
        <li title={authors.join(", ") || undefined}>
          <UserRound />
          {authors.length
            ? `${authors.slice(0, 3).join(", ")}${authors.length > 3 ? ", …" : ""}`
            : "Autoría no informada"}
        </li>
        <li className={future ? "research-fact-flagged" : ""}>
          <CalendarDays />
          {formatDate(record.publishedAt)}
          {future ? (
            <em title="La fuente informa una fecha posterior a hoy; se muestra tal cual, sin corregirla.">
              <CircleAlert /> fecha futura informada por la fuente
            </em>
          ) : null}
        </li>
        <li>
          <FileType2 />
          {evidenceTypeLabel(evidenceType(record))}
        </li>
        {typeof citations === "number" ? (
          <li>
            <Quote />
            {citations.toLocaleString("es-PE")} citas
          </li>
        ) : null}
      </ul>
      <footer className="research-card-actions">
        <button type="button" className="ghost-link" onClick={onSelect}>
          Ver contexto
        </button>
        <a
          className="source-link-button compact"
          href={record.originalUrl}
          target="_blank"
          rel="noreferrer"
        >
          Fuente original <ExternalLink />
        </a>
      </footer>
    </article>
  );
}

function SourceTile({ source }: { source: SourceHealth }) {
  const connected = source.status === "connected" || source.status === "ready";
  return (
    <a
      className="panel research-source-card"
      href={source.endpoint ?? undefined}
      target="_blank"
      rel="noreferrer"
    >
      <span className="research-source-icon">
        <Database />
      </span>
      <div className="research-source-body">
        <strong>{source.name}</strong>
        <small className="research-source-meta">
          API oficial ·{" "}
          {connected ? "Conectada" : source.status.replaceAll("_", " ")}
        </small>
      </div>
      <div className="research-source-count">
        <strong>{source.recordCount}</strong>
        <small>registros</small>
      </div>
      <div className="research-source-sync">
        <small>Última sincronización:</small>
        <small>
          {formatDate(source.lastSuccessAt)}
          <i className={connected ? "ok" : "warn"} />
        </small>
      </div>
    </a>
  );
}

export function ResearchPage() {
  const isAdmin = useIsAdmin();
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState<ResearchDateRange>("all");
  const [type, setType] = useState("all");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState<ResearchSort>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<ObservatoryRecord | null>(null);
  const records = useQuery({
    queryKey: ["records", "research"],
    queryFn: () => getRecords({ kind: "paper", limit: 400 }),
  });
  const sources = useQuery({
    queryKey: ["sources", "research"],
    queryFn: getSources,
  });
  const allRecords = records.data?.data ?? [];
  const allResearchSources = useMemo(
    () =>
      (sources.data?.data ?? [])
        .filter((item) => item.category === "research")
        .sort((left, right) => left.name.localeCompare(right.name, "es")),
    [sources.data],
  );
  /** Solo las fuentes que han devuelto registros llegan a las fichas y al filtro. */
  const activeSources = useMemo(
    () =>
      allResearchSources.filter(
        (item) =>
          item.isOfficial &&
          (item.status === "connected" || item.status === "ready") &&
          item.recordCount > 0,
      ),
    [allResearchSources],
  );
  const pendingSources = useMemo(
    () =>
      allResearchSources.filter(
        (item) => !item.credentialConfigured && item.recordCount === 0,
      ),
    [allResearchSources],
  );
  const types = useMemo(
    () =>
      [...new Set(allRecords.map(evidenceType))].sort((left, right) =>
        evidenceTypeLabel(left).localeCompare(evidenceTypeLabel(right), "es"),
      ),
    [allRecords],
  );
  const filtered = useMemo(
    () =>
      filterResearchRecords(allRecords, {
        query,
        dateRange,
        evidenceType: type,
        source,
        sort,
      }),
    [allRecords, dateRange, query, sort, source, type],
  );
  const chosen =
    filtered.find((record) => record.id === selected?.id) ??
    filtered[0] ??
    null;
  const filtersActive =
    Boolean(query) || dateRange !== "all" || type !== "all" || source !== "all";
  const resetFilters = () => {
    setQuery("");
    setDateRange("all");
    setType("all");
    setSource("all");
    setSort("newest");
  };

  return (
    <div className="module-layout observatory-layout">
      <section className="module-main scroll-region">
        <header className="page-heading">
          <div>
            <h1>
              <BookOpen /> Investigación
            </h1>
            <p>
              Preprints y metadatos académicos recuperados de{" "}
              {activeSources.length
                ? activeSources.map((item) => item.name).join(", ")
                : "los índices oficiales configurados"}
              .
            </p>
          </div>
          <SyncButton
            scope="research"
            label="Actualizar investigación"
            onRefetch={async () => {
              await Promise.all([records.refetch(), sources.refetch()]);
            }}
          />
        </header>

        <section className="research-sources" aria-label="Fuentes académicas">
          {activeSources.map((item) => (
            <SourceTile key={item.id} source={item} />
          ))}
        </section>

        {isAdmin && pendingSources.length ? (
          <div className="panel status-banner">
            <Database />
            <div>
              <strong>
                {pendingSources.length} índice
                {pendingSources.length === 1 ? "" : "s"} académico
                {pendingSources.length === 1 ? "" : "s"} sin credencial
              </strong>
              <p>
                {pendingSources.map((item) => item.name).join(", ")} necesita
                {pendingSources.length === 1 ? "" : "n"} una clave gratuita.{" "}
                <Link to="/admin/sources">Configurar integraciones</Link> para
                añadirla y ampliar la cobertura.
              </p>
            </div>
          </div>
        ) : null}

        <section
          className="research-toolbar panel"
          aria-label="Filtros de investigación"
        >
          <label className="module-search research-query">
            <Search />
            <input
              aria-label="Buscar investigaciones"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Título, autor o identificador…"
            />
          </label>
          <label>
            <CalendarDays />
            <span>Fecha</span>
            <select
              aria-label="Filtrar por fecha"
              value={dateRange}
              onChange={(event) =>
                setDateRange(event.target.value as ResearchDateRange)
              }
            >
              <option value="all">Todas las fechas</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="365d">Últimos 12 meses</option>
            </select>
          </label>
          <label>
            <Shapes />
            <span>Tipo</span>
            <select
              aria-label="Filtrar por tipo"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="all">Todos los tipos</option>
              {types.map((item) => (
                <option value={item} key={item}>
                  {evidenceTypeLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <Database />
            <span>Fuente</span>
            <select
              aria-label="Filtrar por fuente"
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              <option value="all">Todas las fuentes</option>
              {activeSources.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <ArrowDownUp />
            <span>Orden</span>
            <select
              aria-label="Ordenar por fecha"
              value={sort}
              onChange={(event) => setSort(event.target.value as ResearchSort)}
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
            </select>
          </label>
          <button
            className="research-reset"
            type="button"
            onClick={resetFilters}
            disabled={!filtersActive && sort === "newest"}
          >
            <FilterX /> Limpiar
          </button>
        </section>

        <div className="research-results-bar">
          <span>
            {filtered.length} de {allRecords.length} registros · ordenados por
            fecha
          </span>
          {/* `fieldset` en lugar de un div con role="group": agrupa los dos
              controles con semántica nativa y sin ARIA redundante. */}
          <fieldset className="research-view-toggle">
            <legend className="visually-hidden">Vista de resultados</legend>
            <button
              type="button"
              className={view === "grid" ? "active" : ""}
              aria-pressed={view === "grid"}
              title="Vista de cuadrícula"
              onClick={() => setView("grid")}
            >
              <LayoutGrid />
              <span className="visually-hidden">Cuadrícula</span>
            </button>
            <button
              type="button"
              className={view === "list" ? "active" : ""}
              aria-pressed={view === "list"}
              title="Vista de lista"
              onClick={() => setView("list")}
            >
              <List />
              <span className="visually-hidden">Lista</span>
            </button>
          </fieldset>
        </div>

        {filtered.length ? (
          <div className={`research-results ${view}`}>
            {filtered.map((record) => (
              <ResearchCard
                key={record.id}
                record={record}
                selected={chosen?.id === record.id}
                onSelect={() => setSelected(record)}
              />
            ))}
          </div>
        ) : (
          <div className="panel honest-empty">
            <h2>
              {allRecords.length
                ? "No hay resultados con estos filtros"
                : "No hay investigaciones sincronizadas"}
            </h2>
            <p>
              {allRecords.length
                ? "Prueba otra fecha, tipo, fuente o término de búsqueda."
                : "La interfaz permanece vacía hasta que una fuente académica responda correctamente."}
            </p>
          </div>
        )}
      </section>
      <RecordContext record={chosen} />
    </div>
  );
}
