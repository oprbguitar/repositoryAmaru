/**
 * Daily-close adapters for the backup market providers. Each provider has a
 * URL builder and a pure parser returning ascending {date, value} closes.
 * Parsers return [] on any error payload (rate limit, bad key); the caller
 * reports that as "sin datos", never as a fabricated value.
 */
import type { SeriesPoint } from "./forecast";

export type DailyProvider = {
  binding: string;
  name: string;
  url: (symbol: string, key: string, from: string, to: string) => string;
  headers?: (key: string) => Record<string, string>;
  parse: (payload: unknown) => SeriesPoint[];
  /** Page on the provider where the symbol can be checked. */
  sourceUrl: (symbol: string) => string;
};

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj =>
  v && typeof v === "object" ? (v as Obj) : ({} as Obj);
const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const day = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;

function finish(points: Array<SeriesPoint | null>): SeriesPoint[] {
  return points
    .filter((p): p is SeriesPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

const point = (date: unknown, value: unknown): SeriesPoint | null => {
  const d = day(date);
  const v = num(value);
  return d && v !== null ? { date: d, value: v } : null;
};

export const parseTwelveData = (payload: unknown): SeriesPoint[] => {
  const values = obj(payload).values;
  return Array.isArray(values)
    ? finish(values.map((r) => point(obj(r).datetime, obj(r).close)))
    : [];
};

export const parseAlphaVantage = (payload: unknown): SeriesPoint[] => {
  const series = obj(obj(payload)["Time Series (Daily)"]);
  return finish(
    Object.entries(series).map(([d, r]) => point(d, obj(r)["4. close"])),
  );
};

export const parseTiingo = (payload: unknown): SeriesPoint[] =>
  Array.isArray(payload)
    ? finish(payload.map((r) => point(obj(r).date, obj(r).close)))
    : [];

export const parseFmp = (payload: unknown): SeriesPoint[] =>
  Array.isArray(payload)
    ? finish(
        payload.map((r) => point(obj(r).date, obj(r).price ?? obj(r).close)),
      )
    : [];

export const parsePolygon = (payload: unknown): SeriesPoint[] => {
  const results = obj(payload).results;
  return Array.isArray(results)
    ? finish(
        results.map((r) => {
          const t = num(obj(r).t);
          return t === null ? null : point(new Date(t).toISOString(), obj(r).c);
        }),
      )
    : [];
};

export const parseMarketstack = (payload: unknown): SeriesPoint[] => {
  const data = obj(payload).data;
  return Array.isArray(data)
    ? finish(data.map((r) => point(obj(r).date, obj(r).close)))
    : [];
};

const enc = encodeURIComponent;

export const DAILY_PROVIDERS: DailyProvider[] = [
  {
    binding: "TWELVE_DATA_API_KEY",
    name: "Twelve Data",
    url: (s, k) =>
      `https://api.twelvedata.com/time_series?symbol=${enc(s)}&interval=1day&outputsize=120&apikey=${enc(k)}`,
    parse: parseTwelveData,
    sourceUrl: (s) => `https://twelvedata.com/markets/${enc(s)}`,
  },
  {
    binding: "TIINGO_API_KEY",
    name: "Tiingo",
    url: (s, k, from) =>
      `https://api.tiingo.com/tiingo/daily/${enc(s)}/prices?startDate=${from}&token=${enc(k)}`,
    parse: parseTiingo,
    sourceUrl: (s) => `https://www.tiingo.com/${enc(s)}`,
  },
  {
    binding: "FMP_API_KEY",
    name: "Financial Modeling Prep",
    url: (s, k) =>
      `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${enc(s)}&apikey=${enc(k)}`,
    parse: parseFmp,
    sourceUrl: (s) =>
      `https://financialmodelingprep.com/financial-summary/${enc(s)}`,
  },
  {
    binding: "POLYGON_API_KEY",
    name: "Polygon.io",
    url: (s, k, from, to) =>
      `https://api.polygon.io/v2/aggs/ticker/${enc(s)}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=200&apiKey=${enc(k)}`,
    parse: parsePolygon,
    sourceUrl: (s) => `https://polygon.io/quote/${enc(s)}`,
  },
  {
    binding: "ALPHA_VANTAGE_API_KEY",
    name: "Alpha Vantage",
    url: (s, k) =>
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${enc(s)}&outputsize=compact&apikey=${enc(k)}`,
    parse: parseAlphaVantage,
    sourceUrl: (s) =>
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${enc(s)}`,
  },
  {
    binding: "MARKETSTACK_API_KEY",
    name: "Marketstack",
    // The free plan only serves plain HTTP.
    url: (s, k, from) =>
      `http://api.marketstack.com/v1/eod?access_key=${enc(k)}&symbols=${enc(s)}&date_from=${from}&limit=200`,
    parse: parseMarketstack,
    sourceUrl: () => "https://marketstack.com/documentation",
  },
];
