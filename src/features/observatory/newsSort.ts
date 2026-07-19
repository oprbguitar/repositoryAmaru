import type { ObservatoryRecord } from "../../../types/api";

function timestamp(record: ObservatoryRecord): number {
  const value = record.publishedAt ?? record.detectedAt;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? -Infinity : parsed;
}

export function newestNewsFirst(
  records: ObservatoryRecord[],
): ObservatoryRecord[] {
  return [...records].sort((left, right) => timestamp(right) - timestamp(left));
}
