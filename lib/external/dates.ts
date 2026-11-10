/**
 * Publication dates arrive in many shapes (RFC 822 from RSS, ISO 8601 from
 * Atom/JSON, `YYYY`, `2026 Oct`, `2026-September-01` from DOAJ) and some
 * indexes use sentinels such as `9999-12-31` for "unknown". This module turns
 * them into ISO strings or `null`; it never invents a date.
 */

export const MIN_PUBLICATION_YEAR = 1900;
/** Years at or above this value are treated as sentinels, not real dates. */
export const SENTINEL_YEAR = 9000;

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function yearIsPlausible(year: number): boolean {
  return (
    Number.isInteger(year) &&
    year >= MIN_PUBLICATION_YEAR &&
    year < SENTINEL_YEAR
  );
}

/**
 * Returns an ISO 8601 string for a recognisable, plausible date, or `null` for
 * empty, unparsable or sentinel values (year < 1900 or ≥ 9000).
 */
export function parsePublicationDate(raw: unknown): string | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    // Unix seconds (HN Algolia, Dailymotion) vs. milliseconds.
    const ms = raw < 1e11 ? raw * 1000 : raw;
    const date = new Date(ms);
    return yearIsPlausible(date.getUTCFullYear()) ? date.toISOString() : null;
  }
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;

  // `2026`, `2026-10`, `2026 Oct`, `2026-September-01`, `2026 Oct 3`
  const loose = value.match(
    /^(\d{4})(?:[-\s/]([A-Za-z]+|\d{1,2}))?(?:[-\s/](\d{1,2}))?$/,
  );
  if (loose) {
    const year = Number(loose[1]);
    if (!yearIsPlausible(year)) return null;
    const monthToken = loose[2];
    const month = monthToken
      ? /^\d+$/.test(monthToken)
        ? Number(monthToken)
        : (MONTHS[monthToken.toLowerCase()] ?? Number.NaN)
      : 1;
    const day = loose[3] ? Number(loose[3]) : 1;
    if (!(month >= 1 && month <= 12 && day >= 1 && day <= 31)) return null;
    return `${year}-${pad(month)}-${pad(day)}T00:00:00.000Z`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return yearIsPlausible(parsed.getUTCFullYear()) ? parsed.toISOString() : null;
}

/** True when the value is a real, displayable publication date. */
export function isValidPublicationDate(raw: unknown): boolean {
  return parsePublicationDate(raw) !== null;
}
