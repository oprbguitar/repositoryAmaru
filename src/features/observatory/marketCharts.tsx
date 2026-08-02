import { formatDate } from "./format";

/**
 * Gráficos del módulo «Mercado IA». Todo lo que se dibuja proviene de una
 * observación real indexada: no hay interpolación, ni relleno de periodos
 * faltantes, ni valores estimados. Cuando una serie es corta se dibuja corta.
 */

const SERIES_COLORS = [
  "var(--accent)",
  "var(--info)",
  "var(--ok)",
  "var(--purple)",
  "var(--warn)",
  "var(--danger)",
];

export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

export function billions(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (absolute >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export type CompanyBar = {
  company: string;
  revenue: number | null;
  netIncome: number | null;
};

/**
 * Barras agrupadas por empresa: ingresos y utilidad neta del último periodo
 * reportado. Una métrica que la empresa no informó se omite, no se dibuja en 0.
 */
export function CompanyBars({ rows }: { rows: CompanyBar[] }) {
  const values = rows.flatMap((row) =>
    [row.revenue, row.netIncome].filter(
      (value): value is number => value !== null,
    ),
  );
  const max = Math.max(...values, 0) || 1;
  const rowHeight = 46;
  const height = rows.length * rowHeight + 26;
  const labelWidth = 150;
  const width = 640;
  const plotWidth = width - labelWidth - 70;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      className="market-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Ingresos y utilidad neta por empresa. ${rows
        .map(
          (row) =>
            `${row.company}: ingresos ${row.revenue === null ? "no informados" : billions(row.revenue)}, utilidad neta ${row.netIncome === null ? "no informada" : billions(row.netIncome)}`,
        )
        .join("; ")}.`}
    >
      <title>Ingresos y utilidad neta por empresa</title>
      {ticks.map((ratio) => (
        <g key={ratio}>
          <line
            className="trend-grid"
            x1={labelWidth + plotWidth * ratio}
            x2={labelWidth + plotWidth * ratio}
            y1={0}
            y2={height - 22}
          />
          <text
            className="trend-axis"
            x={labelWidth + plotWidth * ratio}
            y={height - 8}
            textAnchor="middle"
          >
            {billions(max * ratio)}
          </text>
        </g>
      ))}
      {rows.map((row, index) => {
        const top = index * rowHeight + 4;
        return (
          <g key={row.company}>
            <text className="market-chart-label" x={0} y={top + 22}>
              {row.company.length > 24
                ? `${row.company.slice(0, 23)}…`
                : row.company}
            </text>
            {row.revenue === null ? (
              <text className="trend-axis" x={labelWidth + 4} y={top + 13}>
                ingresos no informados
              </text>
            ) : (
              <>
                <rect
                  className="market-bar revenue"
                  x={labelWidth}
                  y={top + 3}
                  width={Math.max((row.revenue / max) * plotWidth, 1)}
                  height={13}
                  rx={2}
                />
                <text
                  className="market-bar-value"
                  x={
                    labelWidth +
                    Math.max((row.revenue / max) * plotWidth, 1) +
                    6
                  }
                  y={top + 14}
                >
                  {billions(row.revenue)}
                </text>
              </>
            )}
            {row.netIncome === null ? (
              <text className="trend-axis" x={labelWidth + 4} y={top + 32}>
                utilidad neta no informada
              </text>
            ) : (
              <>
                <rect
                  className="market-bar income"
                  x={labelWidth}
                  y={top + 21}
                  width={Math.max((row.netIncome / max) * plotWidth, 1)}
                  height={13}
                  rx={2}
                />
                <text
                  className="market-bar-value"
                  x={
                    labelWidth +
                    Math.max((row.netIncome / max) * plotWidth, 1) +
                    6
                  }
                  y={top + 32}
                >
                  {billions(row.netIncome)}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export type PeriodPoint = {
  periodEnd: string;
  revenue: number | null;
  netIncome: number | null;
};

/** Evolución por periodo reportado (fin de trimestre o de ejercicio). */
export function PeriodTrend({ points }: { points: PeriodPoint[] }) {
  const width = 640;
  const height = 240;
  const pad = { top: 18, right: 20, bottom: 42, left: 62 };
  const values = points.flatMap((point) =>
    [point.revenue, point.netIncome].filter(
      (value): value is number => value !== null,
    ),
  );
  const max = Math.max(...values, 0) || 1;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const x = (index: number) =>
    pad.left +
    (points.length === 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
  const y = (value: number) => pad.top + plotH - (value / max) * plotH;

  // Un periodo sin dato corta la línea en lugar de unir dos puntos distantes
  // como si hubiera continuidad: el siguiente tramo reinicia con «M».
  const line = (key: "revenue" | "netIncome") => {
    let path = "";
    let restart = true;
    for (const [index, point] of points.entries()) {
      const value = point[key];
      if (value === null) {
        restart = true;
        continue;
      }
      path += `${restart ? "M" : "L"}${x(index)},${y(value)} `;
      restart = false;
    }
    return path.trim();
  };

  return (
    <svg
      className="market-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Evolución por periodo reportado en ${points.length} periodos, de ${points[0]?.periodEnd ?? ""} a ${points.at(-1)?.periodEnd ?? ""}.`}
    >
      <title>Evolución por periodo reportado</title>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <g key={ratio}>
          <line
            className="trend-grid"
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + plotH * ratio}
            y2={pad.top + plotH * ratio}
          />
          <text
            className="trend-axis"
            x={pad.left - 8}
            y={pad.top + plotH * ratio + 3}
            textAnchor="end"
          >
            {billions(max * (1 - ratio))}
          </text>
        </g>
      ))}
      <path className="market-line revenue" d={line("revenue")} />
      <path className="market-line income" d={line("netIncome")} />
      {points.map((point, index) => (
        <g key={point.periodEnd}>
          {point.revenue === null ? null : (
            <circle
              className="market-dot revenue"
              cx={x(index)}
              cy={y(point.revenue)}
              r={3.4}
            />
          )}
          {point.netIncome === null ? null : (
            <circle
              className="market-dot income"
              cx={x(index)}
              cy={y(point.netIncome)}
              r={3.4}
            />
          )}
          <text
            className="trend-axis"
            x={x(index)}
            y={height - 14}
            textAnchor={
              index === 0
                ? "start"
                : index === points.length - 1
                  ? "end"
                  : "middle"
            }
          >
            {formatDate(point.periodEnd)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export type DonutSlice = { label: string; count: number };

/** Distribución por tipo de métrica sobre el total de observaciones indexadas. */
export function MetricDonut({
  slices,
  total,
}: {
  slices: DonutSlice[];
  total: number;
}) {
  const size = 190;
  const radius = 68;
  const stroke = 26;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg
      className="market-donut"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Distribución de ${total} observaciones: ${slices
        .map(
          (slice) =>
            `${slice.label} ${slice.count} (${((slice.count / total) * 100).toFixed(1)}%)`,
        )
        .join("; ")}.`}
    >
      <title>Distribución por tipo de métrica</title>
      <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
        {slices.map((slice, index) => {
          const fraction = total ? slice.count / total : 0;
          const dash = fraction * circumference;
          const element = (
            <circle
              key={slice.label}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              stroke={seriesColor(index)}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return element;
        })}
      </g>
      <text className="market-donut-value" x={size / 2} y={size / 2 - 2}>
        {total}
      </text>
      <text className="market-donut-caption" x={size / 2} y={size / 2 + 16}>
        observaciones
      </text>
    </svg>
  );
}
