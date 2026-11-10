import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type {
  ModelRankingEntry,
  PriceHistoryResponse,
} from "../../../types/api";
import { formatDate } from "../observatory/format";

const PAGE_SIZE = 12;

type SortKey = "name" | "input" | "output" | "context" | "change";
type SortState = { key: SortKey; dir: "asc" | "desc" };

type Row = {
  id: string;
  title: string;
  url: string | null;
  input: number | null;
  output: number | null;
  context: number | null;
  change: number | null;
};

function perMillion(value: unknown): number | null {
  const numeric =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(numeric) ? numeric * 1_000_000 : null;
}

function money(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "Gratis";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

function contextLabel(value: number | null): string {
  if (!value) return "—";
  return value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M`
    : `${Math.round(value / 1000)}K`;
}

/** Joins the stored «pricing-low» ranking with the real price movement. */
function buildRows(
  entries: ModelRankingEntry[],
  history: PriceHistoryResponse | undefined,
): Row[] {
  const changes = new Map(
    (history?.series ?? []).map((entry) => [
      entry.modelExternalId,
      entry.changePercent,
    ]),
  );
  return entries.map((entry) => ({
    id: entry.modelExternalId,
    title: entry.modelTitle,
    url: entry.url,
    input: perMillion(entry.inputPricePerToken) ?? entry.score,
    output: perMillion(entry.outputPricePerToken),
    context: entry.contextLength,
    change: changes.get(entry.modelExternalId) ?? null,
  }));
}

function pick(row: Row, key: Exclude<SortKey, "name">): number | null {
  return key === "input"
    ? row.input
    : key === "output"
      ? row.output
      : key === "context"
        ? row.context
        : row.change;
}

function compare(left: Row, right: Row, key: SortKey, dir: 1 | -1): number {
  if (key === "name") return dir * left.title.localeCompare(right.title, "es");
  const a = pick(left, key);
  const b = pick(right, key);
  // Rows without a value always sink to the bottom, whatever the direction.
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir * (a - b);
}

function deltaClass(change: number | null): string {
  if (change === null || change === 0) return "delta-flat";
  return change < 0 ? "delta-down" : "delta-up";
}

/**
 * Compact, sortable list of the cheapest models OpenRouter ranked on the last
 * synchronization. Twelve rows per page, with real price movement when two or
 * more synchronizations contain the model.
 */
export function TodayModelsTable({
  entries,
  history,
  rankingDate,
  loading,
}: {
  entries: ModelRankingEntry[];
  history: PriceHistoryResponse | undefined;
  rankingDate: string | null | undefined;
  loading: boolean;
}) {
  const [sort, setSort] = useState<SortState>({ key: "input", dir: "asc" });
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return buildRows(entries, history).sort((left, right) =>
      compare(left, right, sort.key, dir),
    );
  }, [entries, history, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function toggle(key: SortKey) {
    setPage(1);
    setSort((previous) =>
      previous.key === key
        ? { key, dir: previous.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" || key === "input" ? "asc" : "desc" },
    );
  }

  function header(key: SortKey, label: string, numeric = true) {
    const active = sort.key === key;
    const Icon = !active
      ? ChevronsUpDown
      : sort.dir === "asc"
        ? ArrowUp
        : ArrowDown;
    return (
      <th
        scope="col"
        className={numeric ? "tm-num" : undefined}
        aria-sort={
          active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <button
          type="button"
          className={`tm-sort${active ? " active" : ""}`}
          onClick={() => toggle(key)}
        >
          {label}
          <Icon aria-hidden="true" />
        </button>
      </th>
    );
  }

  if (loading) {
    return (
      <p className="tm-state" role="status">
        Consultando el ranking de precios…
      </p>
    );
  }
  if (!rows.length) {
    return (
      <p className="tm-state">
        Sin ranking de precios almacenado. Sincroniza OpenRouter para poblarlo.
      </p>
    );
  }

  return (
    <div className="tm">
      <div className="tm-scroll">
        <table className="tm-table">
          <caption className="tm-caption">
            Modelos con menor precio de entrada, ranking del{" "}
            {formatDate(rankingDate)}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="tm-rank">
                #
              </th>
              {header("name", "Modelo", false)}
              {header("input", "Entrada /1M")}
              {header("output", "Salida /1M")}
              {header("context", "Contexto")}
              {header("change", "Cambio")}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={row.id} style={{ "--i": index } as React.CSSProperties}>
                <td className="tm-rank">
                  {(current - 1) * PAGE_SIZE + index + 1}
                </td>
                <td className="tm-name">
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noreferrer">
                      {row.title}
                    </a>
                  ) : (
                    row.title
                  )}
                  <small>{row.id}</small>
                </td>
                <td className="tm-num">{money(row.input)}</td>
                <td className="tm-num">{money(row.output)}</td>
                <td className="tm-num">{contextLabel(row.context)}</td>
                <td className={`tm-num ${deltaClass(row.change)}`}>
                  {row.change === null
                    ? "—"
                    : row.change === 0
                      ? "sin cambio"
                      : `${row.change > 0 ? "+" : ""}${row.change}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tm-foot">
        <span>
          {rows.length} modelos · ranking del {formatDate(rankingDate)} · USD
          por millón de tokens, publicado por OpenRouter
        </span>
        <span className="tm-pager">
          <button
            type="button"
            className="secondary-button compact"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            Anterior
          </button>
          <em>
            {current} / {pageCount}
          </em>
          <button
            type="button"
            className="secondary-button compact"
            disabled={current === pageCount}
            onClick={() => setPage(current + 1)}
          >
            Siguiente
          </button>
        </span>
      </div>
    </div>
  );
}
