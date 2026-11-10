import type { SourceHealth } from "../../../types/api";

export type SourceSummaryLevel = "ok" | "warn" | "error" | "empty";

export type SourceSummary = {
  enabled: number;
  connected: number;
  failed: number;
  pending: number;
  level: SourceSummaryLevel;
};

/**
 * Collapses /api/sources into the one-line indicator shown in the top bar.
 * Uses the same definitions as the dashboard: "failed" covers failed and
 * rate-limited; anything enabled that is neither connected nor failed is
 * still pending its first successful sync (or missing credentials).
 */
export function summarizeSources(
  sources: ReadonlyArray<Pick<SourceHealth, "enabled" | "status">>,
): SourceSummary {
  const enabled = sources.filter((source) => source.enabled);
  const connected = enabled.filter(
    (source) => source.status === "connected",
  ).length;
  const failed = enabled.filter(
    (source) => source.status === "failed" || source.status === "rate_limited",
  ).length;
  const pending = enabled.length - connected - failed;
  const level: SourceSummaryLevel =
    enabled.length === 0
      ? "empty"
      : failed > 0
        ? "error"
        : pending > 0
          ? "warn"
          : "ok";
  return { enabled: enabled.length, connected, failed, pending, level };
}
