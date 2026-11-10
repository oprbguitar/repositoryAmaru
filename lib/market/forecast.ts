/**
 * Pure forecasting and indicator helpers for the market module.
 * Every output is a PROJECTION derived from real observations; nothing here is
 * investment advice. Functions never mutate their input and return null when
 * the series is too short to support the calculation.
 */

export type SeriesPoint = { date: string; value: number };

export type ForecastPoint = {
  step: number;
  value: number;
  lower: number;
  upper: number;
};

export type Forecast = {
  method: "linear-regression" | "holt";
  horizon: number;
  /** z-score used for the band (1.28 is roughly an 80% interval). */
  z: number;
  residualStd: number;
  points: ForecastPoint[];
};

const Z_80 = 1.2816;

export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - m) ** 2, 0) /
      (values.length - 1),
  );
}

/** Simple returns between consecutive values. */
export function returns(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1] !== 0) out.push(values[i] / values[i - 1] - 1);
  }
  return out;
}

/** Ordinary least squares over x = 0..n-1. */
export function linearFit(
  values: number[],
): { slope: number; intercept: number; r2: number } | null {
  const n = values.length;
  if (n < 3) return null;
  const xm = (n - 1) / 2;
  const ym = mean(values);
  let sxy = 0;
  let sxx = 0;
  let sst = 0;
  for (let i = 0; i < n; i += 1) {
    sxy += (i - xm) * (values[i] - ym);
    sxx += (i - xm) ** 2;
    sst += (values[i] - ym) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = ym - slope * xm;
  const sse = values.reduce(
    (sum, value, i) => sum + (value - (intercept + slope * i)) ** 2,
    0,
  );
  return { slope, intercept, r2: sst === 0 ? 0 : 1 - sse / sst };
}

export function linearForecast(
  values: number[],
  horizon: number,
): Forecast | null {
  const fit = linearFit(values);
  if (!fit || horizon < 1) return null;
  const n = values.length;
  const residuals = values.map((v, i) => v - (fit.intercept + fit.slope * i));
  const residualStd = Math.sqrt(
    residuals.reduce((s, r) => s + r * r, 0) / Math.max(n - 2, 1),
  );
  const xm = (n - 1) / 2;
  const sxx = values.reduce((s, _, i) => s + (i - xm) ** 2, 0);
  const points: ForecastPoint[] = [];
  for (let step = 1; step <= horizon; step += 1) {
    const x = n - 1 + step;
    const value = fit.intercept + fit.slope * x;
    // Prediction interval widens with distance from the sample mean.
    const se = residualStd * Math.sqrt(1 + 1 / n + (x - xm) ** 2 / sxx);
    points.push({
      step,
      value,
      lower: value - Z_80 * se,
      upper: value + Z_80 * se,
    });
  }
  return { method: "linear-regression", horizon, z: Z_80, residualStd, points };
}

/** Holt's double exponential smoothing (level + trend). */
export function holtForecast(
  values: number[],
  horizon: number,
  alpha = 0.5,
  beta = 0.3,
): Forecast | null {
  if (values.length < 4 || horizon < 1) return null;
  let level = values[0];
  let trend = values[1] - values[0];
  const errors: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    const predicted = level + trend;
    errors.push(values[i] - predicted);
    const nextLevel = alpha * values[i] + (1 - alpha) * predicted;
    trend = beta * (nextLevel - level) + (1 - beta) * trend;
    level = nextLevel;
  }
  const residualStd = Math.sqrt(
    errors.reduce((s, e) => s + e * e, 0) / errors.length,
  );
  const points: ForecastPoint[] = [];
  for (let step = 1; step <= horizon; step += 1) {
    const value = level + step * trend;
    const se = residualStd * Math.sqrt(step);
    points.push({
      step,
      value,
      lower: value - Z_80 * se,
      upper: value + Z_80 * se,
    });
  }
  return { method: "holt", horizon, z: Z_80, residualStd, points };
}

export function ema(values: number[], period: number): number | null {
  if (values.length < period || period < 1) return null;
  const k = 2 / (period + 1);
  let current = mean(values.slice(0, period));
  for (let i = period; i < values.length; i += 1) {
    current = values[i] * k + current * (1 - k);
  }
  return current;
}

/** Relative change over the last `lookback` observations. */
export function momentum(values: number[], lookback: number): number | null {
  if (values.length <= lookback || lookback < 1) return null;
  const base = values[values.length - 1 - lookback];
  return base === 0 ? null : values[values.length - 1] / base - 1;
}

/** Std dev of simple returns, annualized with `periodsPerYear`. */
export function volatility(
  values: number[],
  periodsPerYear = 252,
): number | null {
  const r = returns(values);
  if (r.length < 2) return null;
  return stdDev(r) * Math.sqrt(periodsPerYear);
}

/** Maximum peak-to-trough decline (negative) and the current one. */
export function drawdown(
  values: number[],
): { max: number; current: number } | null {
  if (values.length < 2) return null;
  let peak = values[0];
  let max = 0;
  let current = 0;
  for (const value of values) {
    if (value > peak) peak = value;
    const dd = peak === 0 ? 0 : value / peak - 1;
    if (dd < max) max = dd;
    current = dd;
  }
  return { max, current };
}

export type SeriesAnalysis = {
  observations: number;
  firstDate: string;
  lastDate: string;
  last: number;
  momentum: number | null;
  momentumLookback: number;
  volatility: number | null;
  drawdown: { max: number; current: number } | null;
  emaShort: number | null;
  emaLong: number | null;
  r2: number | null;
  forecast: Forecast | null;
  linear: Forecast | null;
  /** Why no forecast was produced, if so. */
  note: string | null;
};

export const MIN_FORECAST_POINTS = 8;

export function analyzeSeries(
  points: SeriesPoint[],
  options: { horizon?: number; periodsPerYear?: number } = {},
): SeriesAnalysis | null {
  const sorted = [...points]
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;
  const values = sorted.map((p) => p.value);
  const horizon = options.horizon ?? 5;
  const lookback = Math.min(5, values.length - 1);
  const enough = values.length >= MIN_FORECAST_POINTS;
  const fit = linearFit(values);
  return {
    observations: values.length,
    firstDate: sorted[0].date,
    lastDate: sorted[sorted.length - 1].date,
    last: values[values.length - 1],
    momentum: momentum(values, lookback),
    momentumLookback: lookback,
    volatility: volatility(values, options.periodsPerYear ?? 252),
    drawdown: drawdown(values),
    emaShort: ema(values, Math.min(5, values.length)),
    emaLong: ema(values, Math.min(20, values.length)),
    r2: fit?.r2 ?? null,
    forecast: enough ? holtForecast(values, horizon) : null,
    linear: enough ? linearForecast(values, horizon) : null,
    note: enough
      ? null
      : `Se requieren al menos ${MIN_FORECAST_POINTS} observaciones reales para proyectar (hay ${values.length}).`,
  };
}

export type ForecastSeries = {
  id: string;
  label: string;
  kind: "equity" | "macro";
  unit: string;
  sourceName: string;
  sourceUrl: string;
  frequency: "daily" | "monthly" | "quarterly";
  history: SeriesPoint[];
  analysis: SeriesAnalysis | null;
  /** Explicit reason when there is no analysis or the history is thin. */
  note: string | null;
};

export type ForecastResponse = {
  generatedAt: string;
  disclaimer: string;
  backupProviders: Array<{ name: string; configured: boolean }>;
  series: ForecastSeries[];
};
