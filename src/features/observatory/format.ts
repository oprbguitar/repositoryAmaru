import type { ObservatoryRecord } from "../../../types/api";

export const missing = "No informado por la fuente";

export function formatDate(value: string | null | undefined): string {
  if (!value) return missing;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(date);
}

export function formatNumber(value: unknown): string {
  return typeof value === "number"
    ? new Intl.NumberFormat("es-PE", {
        notation: value > 9999 ? "compact" : "standard",
      }).format(value)
    : missing;
}

export function formatPricePerMillion(value: unknown): string {
  const numeric =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(numeric)) return missing;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(numeric * 1_000_000);
}

export function verificationLabel(
  record: Pick<ObservatoryRecord, "verificationStatus" | "isStale">,
): string {
  if (record.isStale) return "Información desactualizada";
  return {
    verified: "Verificado",
    confirmed: "Confirmado",
    provisional: "Provisional",
    inferred: "Inferido",
    unverified: "No verificado",
  }[record.verificationStatus];
}

export function stringDetail(record: ObservatoryRecord, key: string): string {
  const value = record.data[key];
  return typeof value === "string" && value.trim() ? value : missing;
}
