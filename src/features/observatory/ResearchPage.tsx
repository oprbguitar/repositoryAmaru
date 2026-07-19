import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownUp,
  BookOpen,
  CalendarDays,
  Database,
  ExternalLink,
  FilterX,
  Search,
  Shapes,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ObservatoryRecord } from "../../../types/api";
import { getRecords, getSources } from "./api";
import { formatDate, missing, verificationLabel } from "./format";
import { RecordContext } from "./RecordContext";
import {
  evidenceType,
  evidenceTypeLabel,
  filterResearchRecords,
  type ResearchDateRange,
  type ResearchSort,
} from "./researchFilters";

export function ResearchPage() {
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState<ResearchDateRange>("all");
  const [type, setType] = useState("all");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState<ResearchSort>("newest");
  const [selected, setSelected] = useState<ObservatoryRecord | null>(null);
  const records = useQuery({
    queryKey: ["records", "research"],
    queryFn: () => getRecords({ kind: "paper", limit: 200 }),
  });
  const sources = useQuery({
    queryKey: ["sources", "research"],
    queryFn: getSources,
  });
  const allRecords = records.data?.data ?? [];
  const researchSources = useMemo(
    () =>
      (sources.data?.data ?? [])
        .filter(
          (item) =>
            item.category === "research" &&
            item.isOfficial &&
            item.status === "connected" &&
            item.recordCount > 0,
        )
        .sort((left, right) => left.name.localeCompare(right.name, "es")),
    [sources.data],
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
              Preprints y metadatos académicos recuperados de arXiv, OpenAlex y
              Crossref.
            </p>
          </div>
        </header>
        <section className="research-sources" aria-label="Fuentes académicas">
          {researchSources.map((item) => (
            <a
              className="research-source-card panel"
              href={item.endpoint ?? undefined}
              target="_blank"
              rel="noreferrer"
              key={item.id}
            >
              <span>
                <Database /> {item.name}
              </span>
              <strong>{item.recordCount} registros</strong>
              <small className="research-source-meta">
                API oficial ·{" "}
                {item.status === "connected" ? "Conectada" : item.status}
              </small>
              <small className="research-source-meta">
                Última sincronización: {formatDate(item.lastSuccessAt)}
              </small>
            </a>
          ))}
        </section>
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
              {researchSources.map((item) => (
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
        <section className="record-list panel">
          <div className="panel-heading">
            <h2>Investigaciones recientes</h2>
            <span>
              {filtered.length} de {allRecords.length} registros · ordenados por
              fecha
            </span>
          </div>
          {filtered.length ? (
            filtered.map((record) => {
              const authors = Array.isArray(record.data.authors)
                ? record.data.authors.filter(
                    (item): item is string => typeof item === "string",
                  )
                : [];
              return (
                <article
                  key={record.id}
                  className={chosen?.id === record.id ? "selected" : ""}
                >
                  <div className="record-source">
                    <span>{record.sourceName}</span>
                    <span
                      className={`state-badge ${record.verificationStatus === "verified" ? "verified" : "provisional"}`}
                    >
                      {verificationLabel(record)}
                    </span>
                  </div>
                  <h2>{record.title}</h2>
                  <p>
                    {record.summary ??
                      "El índice de origen no proporcionó un resumen reutilizable."}
                  </p>
                  <div className="record-meta">
                    <button type="button" onClick={() => setSelected(record)}>
                      Ver contexto
                    </button>
                    <span>{authors.slice(0, 4).join(", ") || missing}</span>
                    <span>{formatDate(record.publishedAt)}</span>
                    <span>
                      {typeof record.data.evidenceType === "string"
                        ? evidenceTypeLabel(record.data.evidenceType)
                        : missing}
                    </span>
                    <a
                      href={record.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Fuente original <ExternalLink />
                    </a>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="honest-empty">
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
      </section>
      <RecordContext record={chosen} />
    </div>
  );
}
