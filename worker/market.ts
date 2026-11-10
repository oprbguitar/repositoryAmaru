import { DAILY_PROVIDERS } from "../lib/market/providers";
import type { MarketQuote, MarketQuotesResponse } from "../types/api";
import { type IntegrationsEnv, resolveSecret } from "./integrations";

/**
 * Cotizaciones intradía reales. Cada precio proviene de una respuesta de
 * Finnhub con su propia marca de tiempo; si un símbolo falla se omite y se
 * declara, nunca se rellena con el último valor conocido ni con estimaciones.
 */

export type MarketEnv = IntegrationsEnv;

const QUOTE_CACHE_KEY = "market:quotes:v1";
const QUOTE_CACHE_TTL_SECONDS = 60;

/** Mismas empresas que los fundamentos de la SEC, para que la página sea coherente. */
export const MARKET_SYMBOLS: Array<{
  symbol: string;
  name: string;
  providerId: string | null;
}> = [
  { symbol: "NVDA", name: "NVIDIA Corporation", providerId: "nvidia" },
  { symbol: "MSFT", name: "Microsoft Corporation", providerId: null },
  { symbol: "GOOGL", name: "Alphabet Inc.", providerId: "google-gemini" },
  { symbol: "META", name: "Meta Platforms, Inc.", providerId: null },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", providerId: null },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", providerId: null },
];

type FinnhubQuote = {
  c?: number;
  d?: number | null;
  dp?: number | null;
  h?: number | null;
  l?: number | null;
  o?: number | null;
  pc?: number | null;
  t?: number;
};

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function fetchQuote(
  entry: (typeof MARKET_SYMBOLS)[number],
  token: string,
  retrievedAt: string,
): Promise<MarketQuote | null> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${entry.symbol}&token=${encodeURIComponent(token)}`;
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Finnhub respondió HTTP ${response.status}.`);
  }
  const payload = (await response
    .json()
    .catch(() => null)) as FinnhubQuote | null;
  const price = finiteOrNull(payload?.c);
  // Finnhub devuelve c = 0 para símbolos sin cobertura: eso no es un precio.
  if (price === null || price === 0) return null;
  const quotedAt =
    payload?.t && Number.isFinite(payload.t)
      ? new Date(payload.t * 1000).toISOString()
      : retrievedAt;
  return {
    symbol: entry.symbol,
    companyName: entry.name,
    providerId: entry.providerId,
    price,
    changeAbsolute: finiteOrNull(payload?.d),
    changePercent: finiteOrNull(payload?.dp),
    dayHigh: finiteOrNull(payload?.h),
    dayLow: finiteOrNull(payload?.l),
    dayOpen: finiteOrNull(payload?.o),
    previousClose: finiteOrNull(payload?.pc),
    quotedAt,
    retrievedAt,
    sourceName: "Finnhub",
    originalUrl: `https://finnhub.io/quote/${entry.symbol}`,
  };
}

async function persistQuotes(
  env: MarketEnv,
  quotes: MarketQuote[],
): Promise<void> {
  if (!quotes.length) return;
  const statements = quotes.map((quote) =>
    env.DB.prepare(`
      INSERT INTO market_quotes (id, symbol, company_name, provider_id, current_price,
        change_absolute, change_percent, day_high, day_low, day_open, previous_close,
        quoted_at, source_id, source_name, retrieved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'finnhub', 'Finnhub', ?)
      ON CONFLICT(symbol, quoted_at) DO UPDATE SET current_price = excluded.current_price,
        change_absolute = excluded.change_absolute, change_percent = excluded.change_percent,
        day_high = excluded.day_high, day_low = excluded.day_low, day_open = excluded.day_open,
        previous_close = excluded.previous_close, retrieved_at = excluded.retrieved_at
    `).bind(
      crypto.randomUUID(),
      quote.symbol,
      quote.companyName,
      quote.providerId,
      quote.price,
      quote.changeAbsolute,
      quote.changePercent,
      quote.dayHigh,
      quote.dayLow,
      quote.dayOpen,
      quote.previousClose,
      quote.quotedAt,
      quote.retrievedAt,
    ),
  );
  await env.DB.batch(statements);
}

async function recordSourceOutcome(
  env: MarketEnv,
  outcome: { ok: boolean; count: number; error: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    outcome.ok
      ? `UPDATE source_registry SET status = 'connected', configured = 1, last_request_at = ?,
           last_success_at = ?, last_http_status = 200, last_error = NULL, record_count = ?,
           updated_at = CURRENT_TIMESTAMP WHERE id = 'finnhub'`
      : `UPDATE source_registry SET status = 'failed', last_request_at = ?, last_failure_at = ?,
           last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 'finnhub'`,
  )
    .bind(now, now, outcome.ok ? outcome.count : (outcome.error ?? "Fallo"))
    .run()
    .catch(() => undefined);
}

/**
 * Respaldo cuando Finnhub no está configurado o no devuelve nada: usa el primer
 * proveedor diario configurado. Son cierres diarios, no intradía, y así se
 * declara en la fuente de cada cotización.
 */
async function getBackupQuotes(env: MarketEnv): Promise<MarketQuote[]> {
  const retrievedAt = new Date().toISOString();
  const from = new Date(Date.now() - 14 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const to = retrievedAt.slice(0, 10);
  for (const provider of DAILY_PROVIDERS) {
    const key = await resolveSecret(env, provider.binding);
    if (!key) continue;
    const quotes: MarketQuote[] = [];
    for (const entry of MARKET_SYMBOLS) {
      try {
        const response = await fetch(
          provider.url(entry.symbol, key, from, to),
          {
            headers: { accept: "application/json" },
            signal: AbortSignal.timeout(15_000),
          },
        );
        if (!response.ok) continue;
        const closes = provider.parse(await response.json().catch(() => null));
        const last = closes[closes.length - 1];
        const previous = closes[closes.length - 2];
        if (!last) continue;
        quotes.push({
          symbol: entry.symbol,
          companyName: entry.name,
          providerId: entry.providerId,
          price: last.value,
          changeAbsolute: previous ? last.value - previous.value : null,
          changePercent: previous
            ? (last.value / previous.value - 1) * 100
            : null,
          dayHigh: null,
          dayLow: null,
          dayOpen: null,
          previousClose: previous?.value ?? null,
          quotedAt: `${last.date}T00:00:00.000Z`,
          retrievedAt,
          sourceName: `${provider.name} (cierre diario)`,
          originalUrl: provider.sourceUrl(entry.symbol),
        });
      } catch {
        // Símbolo sin dato: se omite, no se rellena.
      }
    }
    if (quotes.length) return quotes;
  }
  return [];
}

export async function getMarketQuotes(
  env: MarketEnv,
  options: { force?: boolean } = {},
): Promise<MarketQuotesResponse> {
  const token = await resolveSecret(env, "FINNHUB_API_KEY");
  if (!token) {
    const backup = await getBackupQuotes(env);
    if (backup.length) {
      return {
        configured: true,
        quotes: backup,
        reason:
          "Finnhub no está configurado: se muestran cierres diarios del proveedor de respaldo (no son precios intradía).",
        refreshedAt: backup[0].retrievedAt,
        fromCache: false,
      };
    }
    return {
      configured: false,
      quotes: [],
      reason:
        "FINNHUB_API_KEY no está configurada. Añádela en Configuración › Integraciones para ver cotizaciones intradía reales.",
      refreshedAt: null,
      fromCache: false,
    };
  }
  if (!options.force) {
    const cached = await env.CACHE.get<MarketQuotesResponse>(
      QUOTE_CACHE_KEY,
      "json",
    );
    if (cached) return { ...cached, fromCache: true };
  }
  const retrievedAt = new Date().toISOString();
  const quotes: MarketQuote[] = [];
  const failures: string[] = [];
  for (const entry of MARKET_SYMBOLS) {
    try {
      const quote = await fetchQuote(entry, token, retrievedAt);
      if (quote) quotes.push(quote);
      else failures.push(`${entry.symbol}: la fuente no devolvió precio`);
    } catch (error) {
      failures.push(
        `${entry.symbol}: ${error instanceof Error ? error.message : "fallo desconocido"}`,
      );
    }
  }
  if (!quotes.length) {
    const backup = await getBackupQuotes(env);
    if (backup.length) {
      return {
        configured: true,
        quotes: backup,
        reason: `Finnhub no devolvió precios (${failures.join("; ").slice(0, 160)}): se muestran cierres diarios del respaldo.`,
        refreshedAt: retrievedAt,
        fromCache: false,
      };
    }
  }
  await persistQuotes(env, quotes).catch((error) =>
    console.error("market_quotes_persist_failed", {
      error: error instanceof Error ? error.message : "unknown",
    }),
  );
  await recordSourceOutcome(env, {
    ok: quotes.length > 0,
    count: quotes.length,
    error: failures.join("; ").slice(0, 300) || null,
  });
  const response: MarketQuotesResponse = {
    configured: true,
    quotes,
    reason: failures.length ? `Sin dato para ${failures.join("; ")}` : null,
    refreshedAt: retrievedAt,
    fromCache: false,
  };
  if (quotes.length) {
    await env.CACHE.put(QUOTE_CACHE_KEY, JSON.stringify(response), {
      expirationTtl: QUOTE_CACHE_TTL_SECONDS,
    });
  }
  return response;
}
