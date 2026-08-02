import { AlertTriangle, Check } from "lucide-react";
import { useState } from "react";
import type { SynchronizationSummary } from "../../../types/api";
import { SyncActionButton } from "../../components/common/SyncActionButton";
import { synchronize } from "./api";

type SyncState =
  | { phase: "idle" }
  | { phase: "running" }
  | {
      phase: "done";
      stored: number;
      failed: string[];
      unconfigured: string[];
    }
  | { phase: "error"; message: string };

/**
 * Runs a real synchronization for one scope and refreshes the queries the page
 * renders. The result line reports what the sources actually returned; it never
 * claims success when an adapter failed.
 */
export function SyncButton({
  scope,
  label,
  onRefetch,
}: {
  scope: string;
  label: string;
  onRefetch: () => Promise<unknown>;
}) {
  const [state, setState] = useState<SyncState>({ phase: "idle" });

  async function run() {
    setState({ phase: "running" });
    try {
      const response = await synchronize(scope);
      const summaries: SynchronizationSummary[] = response.data ?? [];
      const stored = summaries.reduce(
        (total, summary) => total + (summary.stored ?? 0),
        0,
      );
      // `not_configured` is an honest missing-credential state, not a failure.
      const failed = summaries
        .filter(
          (summary) =>
            !["completed", "not_configured"].includes(summary.status),
        )
        .map(
          (summary) =>
            `${summary.sourceId}: ${summary.error ?? summary.status}`,
        );
      const unconfigured = summaries
        .filter((summary) => summary.status === "not_configured")
        .map((summary) => summary.sourceId);
      await onRefetch();
      setState({ phase: "done", stored, failed, unconfigured });
    } catch (error) {
      setState({
        phase: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo completar la sincronización.",
      });
    }
  }

  return (
    <div className="sync-control">
      <SyncActionButton
        label={label}
        busyLabel="Actualizando…"
        busy={state.phase === "running"}
        onClick={run}
      />
      {state.phase === "done" ? (
        <small
          className={`sync-result ${state.failed.length ? "warning" : "ok"}`}
          role="status"
        >
          {state.failed.length ? <AlertTriangle /> : <Check />}
          {state.failed.length
            ? `${state.stored} registros guardados · ${state.failed.length} fuente(s) con error: ${state.failed.join(" · ")}`
            : `Actualizado · ${state.stored} registros guardados desde las fuentes oficiales`}
          {state.unconfigured.length
            ? ` · Sin credencial: ${state.unconfigured.join(", ")}`
            : ""}
        </small>
      ) : null}
      {state.phase === "error" ? (
        <small className="sync-result warning" role="status">
          <AlertTriangle />
          {state.message}
        </small>
      ) : null}
    </div>
  );
}
