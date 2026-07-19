import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Newspaper } from "lucide-react";
import { useMemo, useState } from "react";
import type { ObservatoryRecord } from "../../../types/api";
import { getRecords } from "./api";
import { formatDate, verificationLabel } from "./format";
import { newestNewsFirst } from "./newsSort";
import { RecordContext } from "./RecordContext";

export function NewsPage() {
  const [selected, setSelected] = useState<ObservatoryRecord | null>(null);
  const records = useQuery({
    queryKey: ["records", "news"],
    queryFn: () => getRecords({ kind: "news", limit: 120 }),
  });
  const items = useMemo(
    () => newestNewsFirst(records.data?.data ?? []),
    [records.data],
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
              Actualizaciones oficiales recuperadas desde RSS, Atom y changelogs
              registrados.
            </p>
          </div>
        </header>
        <section className="record-list panel">
          <div className="panel-heading">
            <h2>Actualizaciones oficiales — más recientes primero</h2>
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
                  <span className="state-badge verified">Fuente oficial</span>
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
