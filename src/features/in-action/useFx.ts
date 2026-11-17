/**
 * Tipo de cambio USD/PEN para expresar los planes en soles: última
 * observación numérica de BCRPData ya sincronizada por el observatorio.
 * Si no hay dato, `rate` es null y la interfaz lo dice (no inventamos uno).
 */
import { useQuery } from "@tanstack/react-query";
import { getRecords } from "../observatory/api";

const MONTHS: Record<string, number> = {
  ene: 0,
  jan: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  aug: 7,
  set: 8,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
  dec: 11,
};

/** «11.Nov.26» → marca de tiempo comparable. */
export function bcrpPeriodTime(period: string): number | null {
  const match = period.match(/^(\d{1,2})\.([A-Za-z]{3})\.(\d{2})$/);
  if (!match) return null;
  const month = MONTHS[(match[2] ?? "").toLowerCase()];
  if (month === undefined) return null;
  return Date.UTC(2000 + Number(match[3]), month, Number(match[1]));
}

export type FxReading = { rate: number; period: string };

export function latestFx(
  records: ReadonlyArray<{ sourceId: string; data: Record<string, unknown> }>,
): FxReading | null {
  let best: { reading: FxReading; time: number } | null = null;
  for (const record of records) {
    if (record.sourceId !== "bcrp") continue;
    const rate = Number(record.data.value);
    const period = String(record.data.period ?? "");
    const time = bcrpPeriodTime(period);
    if (!Number.isFinite(rate) || rate <= 0 || time == null) continue;
    if (!best || time > best.time) best = { reading: { rate, period }, time };
  }
  return best?.reading ?? null;
}

export function useFx() {
  const query = useQuery({
    queryKey: ["in-action-fx"],
    queryFn: () =>
      getRecords({ kind: "economic_indicator", source: "bcrp", limit: 120 }),
    staleTime: 60 * 60 * 1000,
  });
  return {
    reading: query.data ? latestFx(query.data.data) : null,
    loading: query.isLoading,
  };
}
