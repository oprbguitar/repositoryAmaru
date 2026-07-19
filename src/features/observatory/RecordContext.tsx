import { ExternalLink, Info, ShieldCheck } from "lucide-react";
import type { ObservatoryRecord } from "../../../types/api";
import { formatDate, missing, stringDetail, verificationLabel } from "./format";

export function RecordContext({
  record,
}: {
  record: ObservatoryRecord | null;
}) {
  if (!record) {
    return (
      <aside className="context-panel scroll-region">
        <div className="context-title">
          <Info />
          <strong>Información contextual</strong>
        </div>
        <section>
          <h3>Selección</h3>
          <p>Selecciona un registro para revisar su procedencia y metadatos.</p>
        </section>
      </aside>
    );
  }
  const capabilities = Array.isArray(record.data.supportedParameters)
    ? record.data.supportedParameters.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  return (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Info />
        <strong>Información contextual</strong>
      </div>
      <section>
        <span
          className={`state-badge ${record.verificationStatus === "verified" ? "verified" : "provisional"}`}
        >
          <ShieldCheck /> {verificationLabel(record)}
        </span>
        <h2 className="context-record-title">{record.title}</h2>
        <p>{record.summary ?? missing}</p>
      </section>
      {record.recordKind === "model" ? (
        <>
          <section>
            <h3>Capacidades</h3>
            <p>{capabilities.length ? capabilities.join(", ") : missing}</p>
          </section>
          <section>
            <h3>API y licencia</h3>
            <dl className="context-facts">
              <dt>Identificador</dt>
              <dd>{stringDetail(record, "apiIdentifier")}</dd>
              <dt>Licencia</dt>
              <dd>{stringDetail(record, "license")}</dd>
              <dt>Contexto</dt>
              <dd>
                {typeof record.data.contextLength === "number"
                  ? `${record.data.contextLength.toLocaleString("es-PE")} tokens`
                  : missing}
              </dd>
            </dl>
          </section>
        </>
      ) : null}
      <section>
        <h3>Procedencia</h3>
        <dl className="context-facts">
          <dt>Fuente</dt>
          <dd>{record.sourceName}</dd>
          <dt>Publicación</dt>
          <dd>{formatDate(record.publishedAt)}</dd>
          <dt>Detección</dt>
          <dd>{formatDate(record.detectedAt)}</dd>
          <dt>Recuperación</dt>
          <dd>{formatDate(record.retrievedAt)}</dd>
          <dt>Confianza</dt>
          <dd>{record.confidenceLevel}</dd>
          <dt>Idioma</dt>
          <dd>{record.language ?? missing}</dd>
          <dt>Región</dt>
          <dd>{record.countryRegion ?? missing}</dd>
        </dl>
      </section>
      <section>
        <h3>Fuentes</h3>
        <a
          className="source-link-button"
          href={record.originalUrl}
          target="_blank"
          rel="noreferrer"
        >
          Abrir fuente original <ExternalLink />
        </a>
      </section>
    </aside>
  );
}
