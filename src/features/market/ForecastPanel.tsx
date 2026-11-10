import { useQuery } from "@tanstack/react-query";
import { ExternalLink, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type {
  ForecastResponse,
  ForecastSeries,
} from "../../../lib/market/forecast";
import type { ApiResponse } from "../../../types/api";
import { formatDate } from "../observatory/format";
import "./market.css";

const REFRESH_MS = 5 * 60_000;

async function getForecast(): Promise<ApiResponse<ForecastResponse>> {
  const response = await fetch("/api/market/forecast");
  if (!response.ok) throw new Error("No se pudo consultar las proyecciones.");
  return response.json();
}

const fmt = (value: number, digits = 2) =>
  value.toLocaleString("es-PE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
const pctFmt = (value: number | null) =>
  value === null ? "s/d" : `${value > 0 ? "+" : ""}${fmt(value * 100, 1)} %`;

function ForecastChart({ series }: { series: ForecastSeries }) {
  const analysis = series.analysis;
  const history = series.history.slice(-60);
  const forecast = analysis?.forecast?.points ?? [];
  const width = 640;
  const height = 220;
  const pad = { left: 52, right: 12, top: 12, bottom: 22 };
  const all = [
    ...history.map((p) => p.value),
    ...forecast.flatMap((p) => [p.lower, p.upper]),
  ];
  if (history.length < 2 || !all.length) return null;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const total = history.length + forecast.length - 1;
  const x = (i: number) =>
    pad.left + (i / Math.max(total, 1)) * (width - pad.left - pad.right);
  const y = (v: number) =>
    pad.top + (1 - (v - min) / span) * (height - pad.top - pad.bottom);
  const histPath = history
    .map(
      (p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`,
    )
    .join("");
  const last = history.length - 1;
  const projPath = forecast.length
    ? `M${x(last).toFixed(1)},${y(history[last].value).toFixed(1)}${forecast
        .map(
          (p, i) => `L${x(last + 1 + i).toFixed(1)},${y(p.value).toFixed(1)}`,
        )
        .join("")}`
    : "";
  const band = forecast.length
    ? `M${x(last).toFixed(1)},${y(history[last].value).toFixed(1)}${forecast
        .map(
          (p, i) => `L${x(last + 1 + i).toFixed(1)},${y(p.upper).toFixed(1)}`,
        )
        .join("")}${[...forecast]
        .reverse()
        .map(
          (p, i) =>
            `L${x(last + forecast.length - i).toFixed(1)},${y(p.lower).toFixed(1)}`,
        )
        .join("")}Z`
    : "";
  return (
    <svg
      className="mk-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${series.label}: ${history.length} observaciones reales${forecast.length ? ` y proyección a ${forecast.length} periodos con banda del 80 %` : ""}.`}
    >
      <title>{series.label}</title>
      {[0, 0.5, 1].map((r) => (
        <g key={r}>
          <line
            className="mk-grid"
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + r * (height - pad.top - pad.bottom)}
            y2={pad.top + r * (height - pad.top - pad.bottom)}
          />
          <text
            className="mk-axis"
            x={pad.left - 6}
            y={pad.top + r * (height - pad.top - pad.bottom) + 3}
            textAnchor="end"
          >
            {fmt(max - r * span, span < 10 ? 2 : 0)}
          </text>
        </g>
      ))}
      {band ? <path className="mk-band" d={band} /> : null}
      <path className="mk-hist" d={histPath} />
      {projPath ? <path className="mk-proj" d={projPath} /> : null}
      <text className="mk-axis" x={pad.left} y={height - 6}>
        {history[0].date}
      </text>
      <text
        className="mk-axis"
        x={width - pad.right}
        y={height - 6}
        textAnchor="end"
      >
        {history[last].date}
      </text>
    </svg>
  );
}

function Signals({ series }: { series: ForecastSeries }) {
  const a = series.analysis;
  if (!a) return null;
  const rows: Array<[string, string, string]> = [
    [
      `Momentum (${a.momentumLookback} periodos)`,
      pctFmt(a.momentum),
      "Variación entre el último valor y el de hace N periodos. Positivo = la serie viene subiendo; no anticipa lo que hará después.",
    ],
    [
      "Volatilidad anualizada",
      a.volatility === null ? "s/d" : `${fmt(a.volatility * 100, 1)} %`,
      "Desviación estándar de los retornos periódicos escalada a un año. Más alta = movimientos más erráticos.",
    ],
    [
      "Caída máxima / actual",
      a.drawdown
        ? `${pctFmt(a.drawdown.max)} / ${pctFmt(a.drawdown.current)}`
        : "s/d",
      "Distancia al máximo previo de la ventana: la peor caída vista y la actual.",
    ],
    [
      "EMA corta vs larga",
      a.emaShort !== null && a.emaLong !== null
        ? `${fmt(a.emaShort)} vs ${fmt(a.emaLong)}`
        : "s/d",
      "Medias móviles exponenciales (5 y 20 periodos). Corta por encima de la larga indica sesgo alcista reciente.",
    ],
    [
      "Ajuste lineal (R²)",
      a.r2 === null ? "s/d" : fmt(a.r2, 2),
      "Cuánto de la serie explica una recta (0 a 1). Con R² bajo, la tendencia lineal es poco fiable.",
    ],
  ];
  return (
    <dl className="mk-signals">
      {rows.map(([name, value, help]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
          <p>{help}</p>
        </div>
      ))}
    </dl>
  );
}

export function ForecastPanel() {
  const [selectedId, setSelectedId] = useState<string>("");
  const query = useQuery({
    queryKey: ["market-forecast"],
    queryFn: getForecast,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });
  const data = query.data?.data;
  const series = data?.series ?? [];
  const current =
    series.find((s) => s.id === selectedId) ??
    series.find((s) => s.analysis?.forecast) ??
    series[0];
  const forecast = current?.analysis?.forecast;
  const last = forecast?.points[forecast.points.length - 1];
  return (
    <section className="panel mk-panel">
      <div className="panel-heading">
        <h2>Proyecciones y señales</h2>
        <span>
          {data ? `actualizado ${formatDate(data.generatedAt)}` : "calculando…"}
        </span>
      </div>
      <p className="mk-disclaimer" role="note">
        <TriangleAlert aria-hidden="true" />
        {data?.disclaimer ??
          "Proyección estadística sobre datos pasados. No es asesoría financiera."}
      </p>
      {query.isLoading ? <p className="mk-muted">Calculando…</p> : null}
      {query.isError ? (
        <div className="honest-empty">
          <p>No se pudieron calcular las proyecciones.</p>
        </div>
      ) : null}
      {current ? (
        <div className="mk-layout">
          <div className="mk-main">
            <label className="mk-select">
              Serie
              <select
                value={current.id}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            {forecast ? (
              <>
                <ul className="mk-key">
                  <li>
                    <i className="hist" /> Observado (
                    {current.analysis?.observations} puntos reales)
                  </li>
                  <li>
                    <i className="proj" /> PROYECCIÓN (Holt, {forecast.horizon}{" "}
                    periodos)
                  </li>
                  <li>
                    <i className="band" /> Banda del 80 % (crece con el
                    horizonte)
                  </li>
                </ul>
                <ForecastChart series={current} />
                {last ? (
                  <p className="mk-muted">
                    Proyectado a {forecast.horizon} periodos:{" "}
                    <strong className="mk-num">
                      {fmt(last.value)} {current.unit}
                    </strong>{" "}
                    (rango {fmt(last.lower)} a {fmt(last.upper)}). Es una
                    extrapolación de la tendencia reciente, no un precio
                    esperado.
                  </p>
                ) : null}
              </>
            ) : (
              <div className="honest-empty">
                <p>
                  {current.note ??
                    "Sin observaciones suficientes para proyectar."}
                </p>
              </div>
            )}
            <p className="mk-muted">
              Fuente:{" "}
              <a href={current.sourceUrl} target="_blank" rel="noreferrer">
                {current.sourceName} <ExternalLink className="inline-icon" />
              </a>
              {current.analysis
                ? ` · ${current.analysis.firstDate} a ${current.analysis.lastDate}`
                : ""}
            </p>
          </div>
          <div className="mk-side">
            <h3>Señales</h3>
            <Signals series={current} />
            <p className="mk-muted">
              Respaldo diario:{" "}
              {data?.backupProviders.some((p) => p.configured)
                ? data.backupProviders
                    .filter((p) => p.configured)
                    .map((p) => p.name)
                    .join(", ")
                : "ninguno configurado (se usan las cotizaciones guardadas)"}
              .
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
