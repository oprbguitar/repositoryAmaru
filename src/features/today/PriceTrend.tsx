import type { PriceHistoryResponse } from "../../../types/api";
import { formatDate } from "../observatory/format";

const WIDTH = 720;
const HEIGHT = 190;
const PAD = { top: 14, right: 16, bottom: 26, left: 46 };

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value);
}

/**
 * Median input price per million tokens, one point per real synchronization
 * date. The series is drawn only from stored ranking dates: no interpolation
 * of missing days and no simulated history.
 */
export function PriceTrend({
  history,
  emptyLabel,
}: {
  history: PriceHistoryResponse | undefined;
  emptyLabel: string;
}) {
  const points = history?.points ?? [];

  if (!history || points.length < 2) {
    return (
      <div className="honest-empty compact-empty">
        <p>{history?.reason ?? emptyLabel}</p>
        {points.length === 1 ? (
          <p className="trend-single">
            Único punto disponible: {formatDate(points[0].date)} ·{" "}
            <strong>{money(points[0].medianInputPerMillion)}</strong> /1M
            (mediana de {points[0].sampleSize} modelos)
          </p>
        ) : null}
      </div>
    );
  }

  const values = points.map((point) => point.medianInputPerMillion);
  const max = Math.max(...values);
  const min = Math.min(...values);
  // Pad the domain so a flat-ish series is not drawn as a line on the axis.
  const span = max - min || max || 1;
  const top = max + span * 0.25;
  const bottom = Math.max(0, min - span * 0.25);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left +
    (points.length === 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
  const y = (value: number) =>
    PAD.top + plotH - ((value - bottom) / (top - bottom || 1)) * plotH;

  const line = points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${x(index)},${y(point.medianInputPerMillion)}`,
    )
    .join(" ");
  const area = `${line} L${x(points.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`;

  const first = points[0].medianInputPerMillion;
  const last = points[points.length - 1].medianInputPerMillion;
  const change = first ? ((last - first) / first) * 100 : 0;

  return (
    <div className="trend">
      <div className="trend-summary">
        <div>
          <span>Mediana actual</span>
          <strong>{money(last)}</strong>
          <small>/1M tokens de entrada</small>
        </div>
        <div>
          <span>Variación</span>
          <strong className={change <= 0 ? "delta-down" : "delta-up"}>
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </strong>
          <small>desde {formatDate(points[0].date)}</small>
        </div>
        <div>
          <span>Puntos reales</span>
          <strong>{points.length}</strong>
          <small>fechas de sincronización</small>
        </div>
      </div>

      <svg
        className="trend-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Mediana del precio de entrada por millón de tokens en ${points.length} fechas: de ${money(first)} el ${formatDate(points[0].date)} a ${money(last)} el ${formatDate(points[points.length - 1].date)}.`}
      >
        <title>Mediana del precio de entrada por millón de tokens</title>
        {[0, 0.5, 1].map((ratio) => {
          const value = bottom + (top - bottom) * (1 - ratio);
          const gy = PAD.top + plotH * ratio;
          return (
            <g key={ratio}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={gy}
                y2={gy}
                className="trend-grid"
              />
              <text
                x={PAD.left - 8}
                y={gy + 3}
                className="trend-axis"
                textAnchor="end"
              >
                {money(value)}
              </text>
            </g>
          );
        })}
        <path d={area} className="trend-area" />
        <path d={line} className="trend-line" />
        {points.map((point, index) => (
          <g key={point.date}>
            <circle
              cx={x(index)}
              cy={y(point.medianInputPerMillion)}
              r="3.5"
              className="trend-dot"
            />
            <text
              x={x(index)}
              y={HEIGHT - 8}
              className="trend-axis"
              textAnchor={
                index === 0
                  ? "start"
                  : index === points.length - 1
                    ? "end"
                    : "middle"
              }
            >
              {formatDate(point.date)}
            </text>
          </g>
        ))}
      </svg>

      <p className="trend-method">{history.methodology}</p>
    </div>
  );
}
