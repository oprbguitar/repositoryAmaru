import type { PriceHistoryResponse } from "../../../types/api";
import { formatDate } from "../observatory/format";

const WIDTH = 760;
const HEIGHT = 220;
const PAD = { top: 16, right: 18, bottom: 30, left: 54 };

/** One hue per line, drawn from the semantic palette rather than new colours. */
const SERIES_COLORS = [
  "var(--ok)",
  "var(--purple)",
  "var(--info)",
  "var(--warn)",
  "var(--danger)",
];

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

/**
 * Input price per million tokens, one line per model and one point per real
 * synchronization date. Nothing between dates is interpolated and no earlier
 * history is simulated, so a sparse series is shown as sparse.
 */
export function PriceTrend({
  history,
  emptyLabel,
}: {
  history: PriceHistoryResponse | undefined;
  emptyLabel: string;
}) {
  const dates = history?.dates ?? [];
  const series = (history?.series ?? []).slice(0, SERIES_COLORS.length);

  if (!history || !history.available) {
    return (
      <div className="honest-empty compact-empty">
        <p>{history?.reason ?? emptyLabel}</p>
      </div>
    );
  }

  const values = series.flatMap((entry) =>
    entry.points.map((point) => point.pricePerMillion),
  );
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || max || 1;
  const top = max + span * 0.18;
  const bottom = Math.max(0, min - span * 0.18);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left +
    (dates.length === 1 ? plotW / 2 : (index / (dates.length - 1)) * plotW);
  const y = (value: number) =>
    PAD.top + plotH - ((value - bottom) / (top - bottom || 1)) * plotH;

  return (
    <div className="trend">
      <svg
        className="trend-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Precio de entrada por millón de tokens de ${series.length} modelos en ${dates.length} fechas de sincronización, entre ${formatDate(dates[0])} y ${formatDate(dates[dates.length - 1])}. ${series
          .map(
            (entry) =>
              `${entry.modelTitle}: ${money(entry.first)} a ${money(entry.current)}`,
          )
          .join("; ")}.`}
      >
        <title>Precio de entrada por millón de tokens</title>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
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

        {/* A vertical guide per real observation makes the sparsity explicit. */}
        {dates.map((date, index) => (
          <line
            key={date}
            x1={x(index)}
            x2={x(index)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            className="trend-guide"
          />
        ))}

        {series.map((entry, seriesIndex) => {
          const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
          const path = entry.points
            .map(
              (point, index) =>
                `${index ? "L" : "M"}${x(index)},${y(point.pricePerMillion)}`,
            )
            .join(" ");
          return (
            <g key={entry.modelExternalId}>
              <path d={path} className="trend-line" style={{ stroke: color }} />
              {entry.points.map((point, index) => (
                <circle
                  key={point.date}
                  cx={x(index)}
                  cy={y(point.pricePerMillion)}
                  r="3.2"
                  className="trend-dot"
                  style={{ fill: color }}
                />
              ))}
            </g>
          );
        })}

        {dates.map((date, index) => (
          <text
            key={date}
            x={x(index)}
            y={HEIGHT - 10}
            className="trend-axis"
            textAnchor={
              index === 0
                ? "start"
                : index === dates.length - 1
                  ? "end"
                  : "middle"
            }
          >
            {formatDate(date)}
          </text>
        ))}
      </svg>

      <ul className="trend-legend">
        {series.map((entry, index) => (
          <li key={entry.modelExternalId}>
            <i
              style={{
                background: SERIES_COLORS[index % SERIES_COLORS.length],
              }}
            />
            {entry.modelTitle}
          </li>
        ))}
      </ul>

      <p className="trend-method">
        {history.methodology} {history.observations} observación
        {history.observations === 1 ? "" : "es"} real
        {history.observations === 1 ? "" : "es"} sobre {history.trackedModels}{" "}
        modelos con histórico completo.
      </p>
    </div>
  );
}
