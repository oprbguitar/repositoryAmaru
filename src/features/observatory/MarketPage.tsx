import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Banknote,
  BarChart3,
  Building2,
  ExternalLink,
  FileText,
  Landmark,
  LineChart,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { MarketQuote, ObservatoryRecord } from "../../../types/api";
import { SyncActionButton } from "../../components/common/SyncActionButton";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { getMarketQuotes, getRecords, synchronize } from "./api";
import { formatDate, missing } from "./format";
import {
  billions,
  type CompanyBar,
  CompanyBars,
  MetricDonut,
  PeriodTrend,
  seriesColor,
} from "./marketCharts";
import { RecordContext } from "./RecordContext";

const QUOTE_REFRESH_MS = 60_000;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function money(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function QuoteCard({ quote }: { quote: MarketQuote }) {
  const up = (quote.changePercent ?? 0) > 0;
  const down = (quote.changePercent ?? 0) < 0;
  const range =
    quote.dayLow !== null &&
    quote.dayHigh !== null &&
    quote.dayHigh > quote.dayLow
      ? ((quote.price - quote.dayLow) / (quote.dayHigh - quote.dayLow)) * 100
      : null;
  return (
    <article className="panel quote-card">
      <header>
        <strong>{quote.symbol}</strong>
        <span>{quote.companyName}</span>
      </header>
      <div className="quote-price">
        <span>{money(quote.price)}</span>
        {/* En una cotización, subir es alza: no se reusa .delta-up, que en el
            resto de la aplicación marca un precio pagado que empeora. */}
        <em className={up ? "quote-up" : down ? "quote-down" : "quote-flat"}>
          {up ? <TrendingUp /> : down ? <TrendingDown /> : <Activity />}
          {quote.changePercent === null
            ? "variación no informada"
            : `${up ? "+" : ""}${quote.changePercent.toFixed(2)}%`}
          {quote.changeAbsolute === null
            ? ""
            : ` (${up ? "+" : ""}${quote.changeAbsolute.toFixed(2)})`}
        </em>
      </div>
      {range === null ? (
        <p className="quote-range-missing">Rango del día no informado</p>
      ) : (
        <div className="quote-range">
          <span className="quote-range-track">
            <i style={{ left: `${Math.min(Math.max(range, 0), 100)}%` }} />
          </span>
          <small>
            {money(quote.dayLow as number)} — {money(quote.dayHigh as number)}
          </small>
        </div>
      )}
      <footer>
        <span>
          <Timer /> {formatDate(quote.quotedAt)}
        </span>
        <a href={quote.originalUrl} target="_blank" rel="noreferrer">
          {quote.sourceName} <ExternalLink />
        </a>
      </footer>
    </article>
  );
}

export function MarketPage() {
  const [selected, setSelected] = useState<ObservatoryRecord | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [company, setCompany] = useState("");

  const records = useQuery({
    queryKey: ["records", "market"],
    queryFn: () =>
      getRecords({ kind: "economic_indicator,filing", limit: 400 }),
  });
  // Las cotizaciones se refrescan solas: el Worker sirve caché de 60 s, así que
  // este intervalo no consume cuota adicional de la API.
  const quotes = useQuery({
    queryKey: ["market-quotes"],
    queryFn: () => getMarketQuotes(),
    refetchInterval: QUOTE_REFRESH_MS,
    refetchOnWindowFocus: true,
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
  /** Última observación publicada de cada serie macro de FRED. */
  const macroSeries = useMemo(() => {
    const latest = new Map<string, ObservatoryRecord>();
    for (const record of items) {
      if (record.data.indicatorType !== "macro_series") continue;
      const seriesId = text(record.data.seriesId);
      if (!seriesId) continue;
      const current = latest.get(seriesId);
      if (
        !current ||
        String(record.data.referenceDate ?? "") >
          String(current.data.referenceDate ?? "")
      )
        latest.set(seriesId, record);
    }
    return [...latest.values()];
  }, [items]);
  const chosen = selected ?? fundamentals[0] ?? fxBcrp[0] ?? filings[0] ?? null;

  const companies = useMemo(
    () =>
      [
        ...new Set(
          fundamentals
            .map((record) => text(record.data.company))
            .filter((value): value is string => value !== null),
        ),
      ].sort(),
    [fundamentals],
  );

  /** Último periodo reportado por empresa, por métrica. */
  const companyBars = useMemo<CompanyBar[]>(() => {
    const byCompany = new Map<string, CompanyBar>();
    const latestPeriod = new Map<string, string>();
    for (const record of fundamentals) {
      const name = text(record.data.company);
      const label = text(record.data.metricLabel);
      const value = record.data.value;
      const periodEnd = text(record.data.periodEnd);
      if (!name || !label || typeof value !== "number" || !periodEnd) continue;
      const current = byCompany.get(name) ?? {
        company: name,
        revenue: null,
        netIncome: null,
      };
      // Se conserva la observación de periodo más reciente por métrica.
      const key = label === "Ingresos" ? "revenue" : "netIncome";
      const existing = latestPeriod.get(`${name}:${key}`);
      if (!existing || periodEnd > existing) {
        latestPeriod.set(`${name}:${key}`, periodEnd);
        current[key] = value;
      }
      byCompany.set(name, current);
    }
    return [...byCompany.values()];
  }, [fundamentals]);

  // Los ejercicios fiscales no coinciden entre empresas (NVIDIA cierra en
  // enero, Microsoft en junio), así que sumar periodos de varias empresas
  // produciría una curva que ninguna fuente reporta: la evolución es siempre
  // de una sola empresa.
  const selectedCompany = company || companies[0] || "";
  const periodPoints = useMemo(() => {
    const filtered = fundamentals.filter(
      (record) => text(record.data.company) === selectedCompany,
    );
    const byPeriod = new Map<
      string,
      { periodEnd: string; revenue: number | null; netIncome: number | null }
    >();
    for (const record of filtered) {
      const periodEnd = text(record.data.periodEnd);
      const label = text(record.data.metricLabel);
      const value = record.data.value;
      if (!periodEnd || !label || typeof value !== "number") continue;
      const current = byPeriod.get(periodEnd) ?? {
        periodEnd,
        revenue: null,
        netIncome: null,
      };
      if (label === "Ingresos") current.revenue = value;
      else current.netIncome = value;
      byPeriod.set(periodEnd, current);
    }
    return [...byPeriod.values()]
      .sort((left, right) => left.periodEnd.localeCompare(right.periodEnd))
      .slice(-8);
  }, [fundamentals, selectedCompany]);

  const metricSlices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of items) {
      const label =
        text(record.data.metricLabel) ??
        (record.recordKind === "filing"
          ? "Filings SEC"
          : record.data.indicatorType === "fx_reference_rate"
            ? "Tipo de cambio (BCE)"
            : record.sourceId === "bcrp"
              ? "Tipo de cambio (BCRP)"
              : "Otras métricas");
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count);
  }, [items]);

  const lastSync = items.reduce<string | null>(
    (latest, record) =>
      !latest || record.lastSuccessfulSyncAt > latest
        ? record.lastSuccessfulSyncAt
        : latest,
    null,
  );

  async function runSync() {
    setSyncing(true);
    try {
      await synchronize("market");
      await Promise.all([records.refetch(), quotes.refetch()]);
    } finally {
      setSyncing(false);
    }
  }

  const quoteData = quotes.data?.data;

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
            Cotizaciones intradía (Finnhub), fundamentos oficiales (SEC XBRL),
            filings y tipos de cambio del BCRP y del BCE. Cada dato enlaza a su
            fuente original.
          </p>
        </div>
        <SyncActionButton
          label="Sincronizar mercado"
          busy={syncing}
          onClick={runSync}
        />
      </header>

      <div className="market-kpis">
        <article className="panel market-kpi">
          <BarChart3 />
          <div>
            <span>Total observaciones</span>
            <strong>{items.length}</strong>
            <small>oficiales</small>
          </div>
        </article>
        <article className="panel market-kpi">
          <Building2 />
          <div>
            <span>Empresas rastreadas</span>
            <strong>{companies.length}</strong>
            <small>con fundamentos indexados</small>
          </div>
        </article>
        <article className="panel market-kpi">
          <FileText />
          <div>
            <span>Filings verificados</span>
            <strong>{filings.length}</strong>
            <small>SEC EDGAR</small>
          </div>
        </article>
        <article className="panel market-kpi">
          <Timer />
          <div>
            <span>Última sincronización</span>
            <strong className="market-kpi-date">
              {lastSync ? formatDate(lastSync) : missing}
            </strong>
            <small>
              {quoteData?.refreshedAt
                ? `cotizaciones ${formatDate(quoteData.refreshedAt)}`
                : "cotizaciones no configuradas"}
            </small>
          </div>
        </article>
      </div>

      <section className="panel quotes-panel">
        <div className="panel-heading">
          <h2>
            <Activity className="inline-icon" /> Cotizaciones en tiempo real
          </h2>
          <span>
            {quoteData?.configured
              ? `${quoteData.quotes.length} símbolos · actualiza cada 60 s${quoteData.fromCache ? " · desde caché" : ""}`
              : "Finnhub no configurado"}
          </span>
        </div>
        {quoteData?.configured ? (
          <>
            <div className="quotes-grid">
              {quoteData.quotes.map((quote) => (
                <QuoteCard key={quote.symbol} quote={quote} />
              ))}
            </div>
            {quoteData.reason ? (
              <p className="coverage-note">{quoteData.reason}</p>
            ) : null}
          </>
        ) : (
          <div className="honest-empty">
            <h2>Cotizaciones intradía no configuradas</h2>
            <p>
              {quoteData?.reason ??
                "Se requiere una clave de Finnhub para mostrar precios verificables."}{" "}
              No se muestran precios sin una respuesta real de la fuente.
            </p>
            <Link className="source-link-button" to="/admin/sources">
              Configurar integraciones
            </Link>
          </div>
        )}
      </section>

      <div className="market-chart-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Utilidad neta e ingresos por empresa</h2>
            <span>Último periodo reportado, en USD</span>
          </div>
          {companyBars.length ? (
            <>
              <ul className="market-legend">
                <li>
                  <i className="revenue" /> Ingresos
                </li>
                <li>
                  <i className="income" /> Utilidad neta
                </li>
              </ul>
              <CompanyBars rows={companyBars} />
            </>
          ) : (
            <div className="honest-empty">
              <p>
                Ejecuta «Sincronizar mercado» para indexar ingresos y utilidad
                neta reportados oficialmente ante la SEC.
              </p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Evolución por periodo reportado</h2>
            <select
              value={selectedCompany}
              onChange={(event) => setCompany(event.target.value)}
              aria-label="Empresa"
            >
              {companies.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </div>
          {periodPoints.length > 1 ? (
            <>
              <ul className="market-legend">
                <li>
                  <i className="revenue" /> Ingresos
                </li>
                <li>
                  <i className="income" /> Utilidad neta
                </li>
              </ul>
              <PeriodTrend points={periodPoints} />
              <p className="coverage-note">
                Cada punto es un fin de periodo informado a la SEC por{" "}
                {selectedCompany} (10-K o 10-Q). No se interpola ningún periodo
                sin reporte ni se combinan ejercicios de empresas distintas.
              </p>
            </>
          ) : (
            <div className="honest-empty">
              <p>
                Se necesitan al menos dos periodos reportados para dibujar la
                evolución. Sincroniza el módulo de mercado.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="market-chart-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Distribución por tipo de métrica</h2>
            <span>{items.length} observaciones</span>
          </div>
          {items.length ? (
            <div className="market-donut-layout">
              <MetricDonut slices={metricSlices} total={items.length} />
              <table className="observatory-table compact-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Observaciones</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {metricSlices.map((slice, index) => (
                    <tr key={slice.label}>
                      <td>
                        <i
                          className="legend-dot"
                          style={{ background: seriesColor(index) }}
                        />
                        {slice.label}
                      </td>
                      <td>{slice.count}</td>
                      <td>
                        {((slice.count / items.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="honest-empty">
              <p>Sin observaciones indexadas todavía.</p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>
              <LineChart className="inline-icon" /> Series macroeconómicas
            </h2>
            <span>FRED · última observación publicada</span>
          </div>
          {macroSeries.length ? (
            <div className="macro-grid">
              {macroSeries.map((record) => (
                <button
                  type="button"
                  key={record.id}
                  className={`macro-card${chosen?.id === record.id ? " selected" : ""}`}
                  onClick={() => setSelected(record)}
                >
                  <span>{text(record.data.seriesTitle) ?? record.title}</span>
                  <strong>
                    {typeof record.data.value === "number"
                      ? record.data.value.toLocaleString("es-PE", {
                          maximumFractionDigits: 2,
                        })
                      : missing}
                  </strong>
                  <small>{text(record.data.unit) ?? ""}</small>
                  <small className="macro-card-date">
                    {formatDate(text(record.data.referenceDate))}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <div className="honest-empty">
              <p>
                Sin series de FRED indexadas. Configura FRED_API_KEY en
                Configuración › Integraciones y ejecuta «Sincronizar mercado».
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="market-chart-grid">
        <section className="panel record-list">
          <div className="panel-heading">
            <h2>
              <Banknote className="inline-icon" /> Tipo de cambio
            </h2>
            <span>BCRP y BCE</span>
          </div>
          {fxBcrp.slice(0, 3).map((record) => (
            <article
              key={record.id}
              className={chosen?.id === record.id ? "selected" : ""}
            >
              <h2>{record.title}</h2>
              <div className="market-value">
                {text(record.data.value) ?? missing}{" "}
                <small>{text(record.data.unit) ?? ""}</small>
              </div>
              <div className="record-meta">
                <button type="button" onClick={() => setSelected(record)}>
                  Ver contexto
                </button>
                <span>
                  BCRPData · recuperado {formatDate(record.retrievedAt)}
                </span>
                <a href={record.originalUrl} target="_blank" rel="noreferrer">
                  BCRP <ExternalLink />
                </a>
              </div>
            </article>
          ))}
          {fxEcb.slice(0, 6).map((record) => (
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
                <small>{text(record.data.unit) ?? ""}</small>
              </div>
              <div className="record-meta">
                <button type="button" onClick={() => setSelected(record)}>
                  Ver contexto
                </button>
                <span>
                  Frankfurter (BCE) · {formatDate(record.publishedAt)}
                </span>
                <a href={record.originalUrl} target="_blank" rel="noreferrer">
                  Fuente <ExternalLink />
                </a>
              </div>
            </article>
          ))}
          {!fxBcrp.length && !fxEcb.length ? (
            <div className="honest-empty">
              <p>Sin series cambiarias sincronizadas.</p>
            </div>
          ) : null}
        </section>
      </div>

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
                {fundamentals.slice(0, 60).map((record) => (
                  <tr
                    key={record.id}
                    className={chosen?.id === record.id ? "selected" : ""}
                    onClick={() => setSelected(record)}
                  >
                    <td>
                      <strong>{text(record.data.company) ?? missing}</strong>
                    </td>
                    <td>{text(record.data.metricLabel) ?? missing}</td>
                    <td>
                      <span className="market-value">
                        {typeof record.data.value === "number"
                          ? billions(record.data.value)
                          : missing}
                      </span>
                    </td>
                    <td>
                      {text(record.data.periodEnd)
                        ? formatDate(record.data.periodEnd as string)
                        : missing}
                    </td>
                    <td>{text(record.data.form) ?? missing}</td>
                    <td>
                      {text(record.data.filedAt)
                        ? formatDate(record.data.filedAt as string)
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

      <section className="panel data-table-panel">
        <div className="panel-heading">
          <h2>Últimos filings verificados</h2>
          <span>{filings.length} documentos</span>
        </div>
        {filings.length ? (
          <div className="data-table-scroll">
            <table className="observatory-table compact-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Publicado</th>
                  <th>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {filings.slice(0, 24).map((record) => (
                  <tr
                    key={record.id}
                    className={chosen?.id === record.id ? "selected" : ""}
                    onClick={() => setSelected(record)}
                  >
                    <td>
                      <strong>{record.title}</strong>
                      <small>{record.summary ?? ""}</small>
                    </td>
                    <td>{formatDate(record.publishedAt)}</td>
                    <td>
                      <a
                        href={record.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        SEC <ExternalLink />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="honest-empty">
            <p>Sin filings sincronizados.</p>
          </div>
        )}
      </section>
    </CollapsibleLayout>
  );
}
