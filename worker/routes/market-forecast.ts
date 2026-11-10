/**
 * GET /api/market/forecast — projections and indicators computed from real
 * series: daily closes (backup providers when configured, else the quotes
 * already stored in D1) and FRED macro observations. Projections are labelled
 * as such and are never investment advice.
 */
import {
  analyzeSeries,
  type ForecastResponse,
  type ForecastSeries,
  type SeriesPoint,
} from "../../lib/market/forecast";
import { DAILY_PROVIDERS } from "../../lib/market/providers";
import type { ExtraRouter } from "../extra-routes";
import { resolveSecret } from "../integrations";
import { MARKET_SYMBOLS } from "../market";

const CACHE_KEY = "market:forecast:v1";
const CACHE_TTL_SECONDS = 900;
const HISTORY_TTL_SECONDS = 6 * 3600;
const DISCLAIMER =
  "Proyección estadística sobre datos pasados. No es asesoría financiera ni una recomendación de compra o venta.";

function isoDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

type Env = Parameters<ExtraRouter>[1];

async function backupHistory(
  env: Env,
  symbol: string,
  keys: Map<string, string>,
): Promise<{ points: SeriesPoint[]; name: string; url: string } | null> {
  const cacheKey = `market:history:${symbol}:v1`;
  const cached = await env.CACHE.get<{
    points: SeriesPoint[];
    name: string;
    url: string;
  }>(cacheKey, "json");
  if (cached?.points.length) return cached;
  for (const provider of DAILY_PROVIDERS) {
    const key = keys.get(provider.binding);
    if (!key) continue;
    try {
      const response = await fetch(
        provider.url(symbol, key, isoDay(-170), isoDay(0)),
        {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!response.ok) continue;
      const points = provider.parse(await response.json().catch(() => null));
      if (points.length < 2) continue;
      const result = {
        points: points.slice(-120),
        name: provider.name,
        url: provider.sourceUrl(symbol),
      };
      await env.CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: HISTORY_TTL_SECONDS,
      });
      return result;
    } catch {
      // Try the next configured provider.
    }
  }
  return null;
}

async function equitySeries(
  env: Env,
  keys: Map<string, string>,
): Promise<ForecastSeries[]> {
  const out: ForecastSeries[] = [];
  for (const entry of MARKET_SYMBOLS) {
    let history: SeriesPoint[] = [];
    let sourceName = "Finnhub (cotizaciones guardadas)";
    let sourceUrl = `https://finnhub.io/quote/${entry.symbol}`;
    const backup = await backupHistory(env, entry.symbol, keys);
    if (backup) {
      history = backup.points;
      sourceName = `${backup.name} (cierres diarios)`;
      sourceUrl = backup.url;
    } else {
      const rows = await env.DB.prepare(
        "SELECT substr(quoted_at, 1, 10) AS d, current_price AS p FROM market_quotes WHERE symbol = ? ORDER BY quoted_at ASC",
      )
        .bind(entry.symbol)
        .all<{ d: string; p: number }>();
      const byDay = new Map<string, number>();
      for (const row of rows.results) byDay.set(row.d, row.p);
      history = [...byDay.entries()].map(([date, value]) => ({ date, value }));
    }
    const analysis = analyzeSeries(history);
    out.push({
      id: entry.symbol,
      label: `${entry.symbol} · ${entry.name}`,
      kind: "equity",
      unit: "USD",
      sourceName,
      sourceUrl,
      frequency: "daily",
      history,
      analysis,
      note: !history.length
        ? "Sin cotizaciones guardadas. Configura Finnhub o un respaldo (Twelve Data, Tiingo, FMP, Polygon, Alpha Vantage, Marketstack)."
        : (analysis?.note ?? null),
    });
  }
  return out;
}

async function macroSeries(env: Env): Promise<ForecastSeries[]> {
  const rows = await env.DB.prepare(
    `SELECT json_extract(data_json, '$.seriesId') AS id,
            json_extract(data_json, '$.seriesTitle') AS title,
            json_extract(data_json, '$.unit') AS unit,
            json_extract(data_json, '$.referenceDate') AS d,
            json_extract(data_json, '$.value') AS v
     FROM observatory_records
     WHERE source_id = 'fred' AND json_extract(data_json, '$.indicatorType') = 'macro_series'`,
  ).all<{ id: string; title: string; unit: string; d: string; v: number }>();
  const groups = new Map<
    string,
    { title: string; unit: string; points: Map<string, number> }
  >();
  for (const row of rows.results) {
    if (!row.id || typeof row.v !== "number" || !row.d) continue;
    const group = groups.get(row.id) ?? {
      title: row.title ?? row.id,
      unit: row.unit ?? "",
      points: new Map<string, number>(),
    };
    group.points.set(row.d, row.v);
    groups.set(row.id, group);
  }
  return [...groups.entries()].map(([id, group]) => {
    const history = [...group.points.entries()]
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const frequency =
      id === "NASDAQCOM" ? "daily" : id === "GDP" ? "quarterly" : "monthly";
    const periodsPerYear =
      frequency === "daily" ? 252 : frequency === "quarterly" ? 4 : 12;
    const analysis = analyzeSeries(history, {
      horizon: frequency === "daily" ? 5 : 3,
      periodsPerYear,
    });
    return {
      id,
      label: group.title,
      kind: "macro" as const,
      unit: group.unit,
      sourceName: "FRED (Reserva Federal de St. Louis)",
      sourceUrl: `https://fred.stlouisfed.org/series/${id}`,
      frequency,
      history,
      analysis,
      note: analysis?.note ?? null,
    };
  });
}

export const marketForecastRouter: ExtraRouter = async (request, env, url) => {
  if (request.method !== "GET" || url.pathname !== "/api/market/forecast")
    return null;
  const force = url.searchParams.get("force") === "1";
  if (!force) {
    const cached = await env.CACHE.get<ForecastResponse>(CACHE_KEY, "json");
    if (cached) return respond(cached, true);
  }
  const keys = new Map<string, string>();
  for (const provider of DAILY_PROVIDERS) {
    const key = await resolveSecret(env, provider.binding);
    if (key) keys.set(provider.binding, key);
  }
  const data: ForecastResponse = {
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    backupProviders: DAILY_PROVIDERS.map((p) => ({
      name: p.name,
      configured: keys.has(p.binding),
    })),
    series: [...(await equitySeries(env, keys)), ...(await macroSeries(env))],
  };
  await env.CACHE.put(CACHE_KEY, JSON.stringify(data), {
    expirationTtl: CACHE_TTL_SECONDS,
  });
  return respond(data, false);
};

function respond(data: ForecastResponse, cached: boolean): Response {
  return new Response(
    JSON.stringify({
      data,
      meta: {
        requestId: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        sourceStatus: cached ? "cached" : "ready",
        total: data.series.length,
      },
    }),
    { headers: { "content-type": "application/json; charset=utf-8" } },
  );
}
