import type { QuerySpec } from "./types";

const TOPIC_PATTERN = /^[a-z0-9][a-z0-9-]{0,49}$/;
const LANGUAGE_PATTERN = /^[A-Za-z0-9+#.][A-Za-z0-9+#. -]{0,29}$/;
const LICENSE_PATTERN = /^[a-z0-9.-]{1,40}$/;
const MAX_OR_TERMS = 5; // GitHub allows at most five AND/OR/NOT operators.
const MAX_KEYWORDS = 5;
const DAY_MS = 86_400_000;

/** Lower-cases and validates a GitHub topic name; returns null if invalid. */
export function normalizeTopic(value: string): string | null {
  const topic = value.trim().toLowerCase().replace(/\s+/g, "-");
  return TOPIC_PATTERN.test(topic) ? topic : null;
}

export function normalizeTopics(values: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const topic = normalizeTopic(value);
    if (topic) seen.add(topic);
  }
  return [...seen];
}

function cleanKeyword(value: string): string | null {
  const cleaned = value
    .replace(/["():[\]\\]/g, " ")
    .replace(/\b(AND|OR|NOT)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  if (!cleaned || /^(and|or|not)$/i.test(cleaned)) return null;
  return cleaned;
}

function quoteTerm(term: string): string {
  return /[\s-]/.test(term) ? `"${term}"` : term;
}

/**
 * Turns a structured spec into a GitHub repository-search query.
 *
 * Verified against the live API (2026-11-09):
 * - repeating `topic:` qualifiers is an AND;
 * - `OR` only works between free-text terms, never between qualifiers, so
 *   "any of these topics" is expressed as `"a" OR "b" in:topics`;
 * - when `anyTopics` is present it takes priority over `keywords`, because a
 *   single `in:` qualifier scopes every free-text term in the query.
 */
export function buildSearchQuery(spec: QuerySpec, now = new Date()): string {
  const parts: string[] = [];
  const topics = normalizeTopics(spec.topics ?? []);
  const anyTopics = normalizeTopics(spec.anyTopics ?? []).slice(
    0,
    MAX_OR_TERMS + 1,
  );
  const keywords = (spec.keywords ?? [])
    .map(cleanKeyword)
    .filter((item): item is string => item !== null)
    .slice(0, MAX_KEYWORDS);

  for (const topic of topics) parts.push(`topic:${topic}`);
  if (anyTopics.length === 1) {
    parts.push(`topic:${anyTopics[0]}`);
  } else if (anyTopics.length > 1) {
    parts.push(`${anyTopics.map(quoteTerm).join(" OR ")} in:topics`);
  } else if (keywords.length) {
    parts.push(
      `${keywords.map(quoteTerm).join(" ")} in:name,description,readme`,
    );
  }
  if (spec.language && LANGUAGE_PATTERN.test(spec.language))
    parts.push(
      /\s/.test(spec.language)
        ? `language:"${spec.language}"`
        : `language:${spec.language}`,
    );
  if (spec.license && LICENSE_PATTERN.test(spec.license))
    parts.push(`license:${spec.license}`);
  if (spec.minStars && spec.minStars > 0)
    parts.push(`stars:>=${Math.floor(spec.minStars)}`);
  if (spec.pushedWithinDays && spec.pushedWithinDays > 0) {
    const since = new Date(now.getTime() - spec.pushedWithinDays * DAY_MS);
    parts.push(`pushed:>=${since.toISOString().slice(0, 10)}`);
  }
  if (!spec.includeArchived) parts.push("archived:false");
  return parts.join(" ");
}

const ALLOWED_QUALIFIERS = new Set([
  "topic",
  "topics",
  "in",
  "stars",
  "forks",
  "pushed",
  "created",
  "language",
  "license",
  "archived",
  "fork",
  "is",
  "size",
]);

/**
 * Conservative validation for the raw query the worker forwards to GitHub:
 * only known qualifiers, no user/org/repo targeting, bounded length.
 */
export function isSafeSearchQuery(query: string): boolean {
  if (query.length < 2 || query.length > 300) return false;
  if (query.includes("`") || query.includes("\\")) return false;
  for (let index = 0; index < query.length; index += 1)
    if (query.charCodeAt(index) < 32) return false;
  const withoutQuotes = query.replace(/"[^"]*"/g, '"x"');
  for (const token of withoutQuotes.split(/\s+/)) {
    const separator = token.indexOf(":");
    if (separator <= 0) continue;
    const name = token.slice(0, separator).replace(/^[-(]+/, "");
    if (!ALLOWED_QUALIFIERS.has(name)) return false;
  }
  return /[A-Za-z0-9]/.test(withoutQuotes);
}

export function githubSearchUrl(query: string, sort: string): string {
  const url = new URL("https://github.com/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "repositories");
  if (sort !== "best-match") url.searchParams.set("s", sort);
  return url.toString();
}
