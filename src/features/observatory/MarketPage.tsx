import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  ExternalLink,
  Landmark,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { ObservatoryRecord } from "../../../types/api";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { getRecords, synchronize } from "./api";
import { formatDate, missing } from "./format";
import { RecordContext } from "./RecordContext";

function usdCompact(value: unknown): string {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value)
    : missing;
}

export function MarketPage() {
  const [selected, setSelected] = useState<ObservatoryRecord | null>(null);
  const [syncing, setSyncing] = useState(false);
  const records = useQuery({
    queryKey: ["records", "market"],
    queryFn: () =>
      getRecords({ kind: "economic_indicator,filing", limit: 200 }),
  });
  const items = records.data?.data ?? [];
  const fundamentals = items.filter(
    (record) => record.data.indicatorType === "sec_fundamental",
  );
  const fxEcb = items.filter(
    (record) => record.data.indicatorType === "fx_reference_rate",
  );
  const fxBcrp = items.filter((record) => record.sourceId === "bcrp");
  const filings = items.filter((record) => record.recordKind === "filing");
  const chosen = selected ?? fundamentals[0] ?? fxBcrp[0] ?? filings[0] ?? null;

  async function runSync() {
    setSyncing(true);
    try {
      await synchronize("market");
      await records.refetch();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <CollapsibleLayout
      storageKey="market"
      panel={<RecordContext record={chosen} />}
    >
      <header className="page-heading">
        <div>
          <h1>
            <Landmark /> Mercado IA
          </h1>
          <p>
            Fundamentos oficiales (SEC XBRL), filings, y tipos de cambio del
            BCRP y del BCE. Cada dato enlaza a su fuente original.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button compact"
          onClick={runSync}
          disabled={syncing}
        >
          <RefreshCw className={syncing ? "spin" : ""} /> Sincronizar mercado
        </button>
      </header>

      <section className="panel data-table-panel">
        <div className="panel-heading">
          <h2>Fundamentos reportados — empresas de IA (SEC XBRL)</h2>
          <span>{fundamentals.length} observaciones oficiales</span>
        </div>
        {fundamentals.length ? (
          <div className="data-table-scroll">
            <table className="observatory-table compact-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Métrica</th>
                  <th>Valor</th>
                  <th>Periodo al</th>
                  <th>Formulario</th>
                  <th>Presentado</th>
                  <th>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {fundamentals.map((record) => (
                  <tr
                    key={record.id}
                    className={chosen?.id === record.id ? "selected" : ""}
                    onClick={() => setSelected(record)}
                  >
                    <td>
                      <strong>
                        {typeof record.data.company === "string"
                          ? record.data.company
                          : missing}
                      </strong>
                    </td>
                    <td>
                      {typeof record.data.metricLabel === "string"
                        ? record.data.metricLabel
                        : missing}
                    </td>
                    <td>
                      <span className="market-value">
                        {usdCompact(record.data.value)}
                      </span>
                    </td>
                    <td>
                      {typeof record.data.periodEnd === "string"
                        ? formatDate(record.data.periodEnd)
                        : missing}
                    </td>
                    <td>
                      {typeof record.data.form === "string"
                        ? record.data.form
                        : missing}
                    </td>
                    <td>
                      {typeof record.data.filedAt === "string"
                        ? formatDate(record.data.filedAt)
                        : missing}
                    </td>
                    <td>
                      <a
                        href={record.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        SEC XBRL <ExternalLink />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="honest-empty">
            <h2>Sin fundamentos sincronizados</h2>
            <p>
              Ejecuta «Sincronizar mercado» para indexar ingresos y utilidad
              neta reportados oficialmente ante la SEC (NVIDIA, Microsoft,
              Alphabet, Meta, AMD, Palantir).
            </p>
          </div>
        )}
      </section>

      <div className="market-real-grid">
        <section className="panel record-list">
          <div className="panel-heading">
            <h2>
              <Banknote className="inline-icon" /> Tipo de cambio
            </h2>
            <span>BCRP y BCE</span>
          </div>
          {fxBcrp.slice(0, 5).map((record) => (
            <article
              key={record.id}
              className={chosen?.id === record.id ? "selected" : ""}
            >
              <h2>{record.title}</h2>
              <div className="market-value">
                {typeof record.data.value === "string"
                  ? record.data.value
                  : missing}{" "}
                <small>
                  {typeof record.data.unit === "string" ? record.data.unit : ""}
                </small>
              </div>
              <div className="record-meta">
                <button type="button" onClick={() => setSelected(record)}>
                  Ver contexto
                </button>
                <span>
                  BCRPData · recuperado {formatDate(record.retrievedAt)}
                </span>
                <a
                  href={record.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  BCRP <ExternalLink />
                </a>
              </div>
            </article>
          ))}
          {fxEcb.slice(0, 8).map((record) => (
            <article
              key={record.id}
              className={chosen?.id === record.id ? "selected" : ""}
            >
              <h2>{record.title}</h2>
              <div className="market-value">
                {typeof record.data.value === "number"
                  ? record.data.value.toLocaleString("es-PE", {
                      maximumFractionDigits: 4,
                    })
                  : missing}{" "}
                <small>
                  {typeof record.data.unit === "string" ? record.data.unit : ""}
                </small>
              </div>
              <div className="record-meta">
                <button type="button" onClick={() => setSelected(record)}>
                  Ver contexto
                </button>
                <span>
                  Frankfurter (BCE) · {formatDate(record.publishedAt)}
                </span>
                <a
                  href={record.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  Fuente <ExternalLink />
                </a>
              </div>
            </article>
          ))}
          {!fxBcrp.length && !fxEcb.length ? (
            <div className="honest-empty">
              <h2>Sin series cambiarias sincronizadas</h2>
              <p>Ejecuta «Sincronizar mercado».</p>
            </div>
          ) : null}
        </section>

        <section className="panel record-list">
          <div className="panel-heading">
            <h2>SEC EDGAR — filings recientes</h2>
            <span>{filings.length} documentos</span>
          </div>
          {filings.slice(0, 24).map((record) => (
            <article
              key={record.id}
              className={chosen?.id === record.id ? "selected" : ""}
            >
              <h2>{record.title}</h2>
              <p>{record.summary}</p>
              <div className="record-meta">
                <button type="button" onClick={() => setSelected(record)}>
                  Ver contexto
                </button>
                <span>{formatDate(record.publishedAt)}</span>
                <a
                  href={record.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  SEC <ExternalLink />
                </a>
              </div>
            </article>
          ))}
          {!filings.length ? (
            <div className="honest-empty">
              <h2>Sin filings sincronizados</h2>
              <p>Ejecuta «Sincronizar mercado».</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="panel market-configuration">
        <TrendingUp />
        <div>
          <h2>Cotizaciones intradía no configuradas</h2>
          <p>
            Los precios de acciones en tiempo real requieren una clave de Twelve
            Data, FMP o Finnhub (variables ya previstas en .dev.vars.example).
            No se muestran precios ni variaciones sin una respuesta verificable;
            los fundamentos y tipos de cambio de arriba sí son datos oficiales
            en vivo.
          </p>
        </div>
      </section>
    </CollapsibleLayout>
  );
}
