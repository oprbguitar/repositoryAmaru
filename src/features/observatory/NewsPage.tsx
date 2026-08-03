import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Newspaper } from "lucide-react";
import { useMemo, useState } from "react";
import type { ObservatoryRecord } from "../../../types/api";
import { getRecords } from "./api";
import { formatDate, verificationLabel } from "./format";
import { newestNewsFirst } from "./newsSort";
import { RecordContext } from "./RecordContext";
import { SyncButton } from "./SyncButton";

/**
 * Un feed oficial del proveedor y un artículo de prensa no tienen el mismo
 * valor probatorio: la etiqueta lo dice en lugar de llamar «fuente oficial» a
 * todo lo que llega al módulo.
 */
function originLabel(record: ObservatoryRecord): string {
  return record.sourceType === "official_feed"
    ? "Fuente oficial"
    : "Prensa (agregador)";
}

export function NewsPage() {
  const [selected, setSelected] = useState<ObservatoryRecord | null>(null);
  const [source, setSource] = useState("all");
  const records = useQuery({
    queryKey: ["records", "news"],
    queryFn: () => getRecords({ kind: "news", limit: 200 }),
  });
  const all = useMemo(
    () => newestNewsFirst(records.data?.data ?? []),
    [records.data],
  );
  const sourceOptions = useMemo(() => {
    const counts = new Map<
      string,
      { id: string; label: string; count: number }
    >();
    for (const record of all) {
      const current = counts.get(record.sourceId);
      if (current) current.count += 1;
      else
        counts.set(record.sourceId, {
          id: record.sourceId,
          // NewsAPI nombra la fuente por medio; el prefijo identifica la API.
          label: record.sourceName.split(" · ")[0],
          count: 1,
        });
    }
    return [...counts.values()].sort((left, right) => right.count - left.count);
  }, [all]);
  const items = useMemo(
    () => (source === "all" ? all : all.filter((r) => r.sourceId === source)),
    [all, source],
  );
  const chosen =
    items.find((item) => item.id === selected?.id) ?? items[0] ?? null;
  return (
    <div className="module-layout observatory-layout">
      <section className="module-main scroll-region">
        <header className="page-heading">
          <div>
            <h1>
              <Newspaper /> Noticias
            </h1>
            <p>
              Comunicados y changelogs oficiales vía RSS y Atom, más prensa
              recuperada de agregadores con licencia de uso personal.
            </p>
          </div>
          <SyncButton
            scope="news"
            label="Actualizar noticias"
            onRefetch={() => records.refetch()}
          />
        </header>
        {sourceOptions.length > 1 ? (
          <fieldset className="news-source-filter">
            <legend className="visually-hidden">Filtrar por fuente</legend>
            <button
              type="button"
              className={source === "all" ? "active" : ""}
              onClick={() => setSource("all")}
            >
              Todas <span className="tab-count">{all.length}</span>
            </button>
            {sourceOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={source === option.id ? "active" : ""}
                onClick={() => setSource(option.id)}
              >
                {option.label} <span className="tab-count">{option.count}</span>
              </button>
            ))}
          </fieldset>
        ) : null}
        <section className="record-list panel">
          <div className="panel-heading">
            <h2>Más recientes primero</h2>
            <span>{items.length} registros · ordenados por publicación</span>
          </div>
          {items.length ? (
            items.map((record) => (
              <article
                key={record.id}
                className={chosen?.id === record.id ? "selected" : ""}
              >
                <div className="record-source">
                  <span>{record.sourceName}</span>
                  <span
                    className={`state-badge ${record.sourceType === "official_feed" ? "verified" : "provisional"}`}
                  >
                    {originLabel(record)}
                  </span>
                  <span className="state-badge verified">
                    {verificationLabel(record)}
                  </span>
                </div>
                <h2>{record.title}</h2>
                <p>
                  {record.summary ??
                    "La fuente no publicó un extracto reutilizable."}
                </p>
                <div className="record-meta">
                  <button type="button" onClick={() => setSelected(record)}>
                    Ver contexto
                  </button>
                  <span>Publicación: {formatDate(record.publishedAt)}</span>
                  <span>Detección: {formatDate(record.detectedAt)}</span>
                  <a
                    href={record.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Abrir original <ExternalLink />
                  </a>
                </div>
              </article>
            ))
          ) : (
            <div className="honest-empty">
              <h2>No hay noticias sincronizadas</h2>
              <p>
                Solo se mostrarán entradas recuperadas de fuentes registradas.
              </p>
            </div>
          )}
        </section>
      </section>
      <RecordContext record={chosen} />
    </div>
  );
}
