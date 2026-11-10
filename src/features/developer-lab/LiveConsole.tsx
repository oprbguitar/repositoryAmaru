import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Square, Timer, Zap } from "lucide-react";
import { useRef, useState } from "react";
import type { LabStreamEvent } from "../../../lib/developer-lab/streaming";
import type { DeveloperLabProvider } from "../../../lib/developer-lab/types";
import { listProviderModels, listRunStats, streamLabRun } from "./api";
import "./live-console.css";

type DoneEvent = Extract<LabStreamEvent, { type: "done" }>;

function usd(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Sin precio";
  if (value === 0) return "US$ 0";
  return `US$ ${value < 0.01 ? value.toFixed(6) : value.toFixed(4)}`;
}

function ms(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : `${Math.round(value).toLocaleString("es-PE")} ms`;
}

/**
 * Live streaming console: pick a configured provider and model, write a
 * prompt and watch tokens arrive; each run is stored and averaged per model.
 */
export function LiveConsole({
  providers,
}: {
  providers: DeveloperLabProvider[];
}) {
  const usable = providers.filter(
    (p) =>
      p.supports.streaming &&
      (p.location === "local" || p.credential?.state === "connection_verified"),
  );
  const [providerId, setProviderId] = useState(usable[0]?.id ?? "");
  const [modelId, setModelId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [system, setSystem] = useState("");
  const [maxTokens, setMaxTokens] = useState(4096);
  const [text, setText] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [done, setDone] = useState<DoneEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [firstTokenMs, setFirstTokenMs] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const models = useQuery({
    queryKey: ["developer-lab-models", providerId, "text"],
    queryFn: () => listProviderModels(providerId, "text"),
    enabled: Boolean(providerId),
  });
  const stats = useQuery({
    queryKey: ["developer-lab-run-stats"],
    queryFn: listRunStats,
  });
  const modelList = models.data?.data ?? [];
  const activeModel = modelId || modelList[0]?.id || "";

  async function run() {
    if (!providerId || !activeModel || !prompt.trim()) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const started = performance.now();
    setText("");
    setReasoning("");
    setDone(null);
    setError(null);
    setFirstTokenMs(null);
    setRunning(true);
    let gotFirst = false;
    try {
      await streamLabRun(
        {
          providerId,
          modelId: activeModel,
          prompt,
          system: system.trim() || undefined,
          maxOutputTokens: maxTokens,
        },
        (event) => {
          if (event.type === "delta") {
            if (!gotFirst) {
              gotFirst = true;
              setFirstTokenMs(performance.now() - started);
            }
            if (event.channel === "text") setText((t) => t + event.text);
            else setReasoning((t) => t + event.text);
          } else if (event.type === "done") setDone(event);
          else if (event.type === "error") setError(event.message);
        },
        controller.signal,
      );
    } catch (cause) {
      if ((cause as Error).name !== "AbortError")
        setError((cause as Error).message);
    } finally {
      abortRef.current = null;
      setRunning(false);
      queryClient.invalidateQueries({ queryKey: ["developer-lab-run-stats"] });
    }
  }

  if (!usable.length)
    return (
      <p className="lc-empty" role="status">
        Ningún proveedor con streaming tiene la conexión verificada. Configura
        una clave en «Conexiones» (o arranca Ollama / LM Studio en local) y
        vuelve aquí.
      </p>
    );

  const rows = stats.data?.data ?? [];

  return (
    <div className="lc-layout">
      <section className="lc-console" aria-label="Consola en vivo">
        <div className="lc-selectors">
          <label>
            Proveedor
            <select
              value={providerId}
              onChange={(event) => {
                setProviderId(event.target.value);
                setModelId("");
              }}
            >
              {usable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Modelo
            <select
              value={activeModel}
              disabled={models.isLoading || !modelList.length}
              onChange={(event) => setModelId(event.target.value)}
            >
              {models.isLoading ? <option>Cargando modelos…</option> : null}
              {modelList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                  {m.inputPricePerMillion !== null
                    ? ` · US$ ${m.inputPricePerMillion}/${m.outputPricePerMillion ?? "?"} por M`
                    : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="lc-field lc-field-inline">
          Máximo de salida (tokens)
          <input
            type="number"
            min={256}
            max={65536}
            step={256}
            value={maxTokens}
            onChange={(event) =>
              setMaxTokens(
                Math.min(
                  65536,
                  Math.max(256, Number(event.target.value) || 4096),
                ),
              )
            }
          />
        </label>
        <label className="lc-field">
          Instrucción de sistema (opcional)
          <input
            value={system}
            onChange={(event) => setSystem(event.target.value)}
            placeholder="Ej.: responde en español, en tres viñetas"
          />
        </label>
        <label className="lc-field">
          Prompt
          <textarea
            rows={4}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey))
                run();
            }}
            placeholder="Escribe tu prompt · Ctrl+Enter para ejecutar"
          />
        </label>
        <div className="lc-actions">
          {running ? (
            <button
              type="button"
              className="lc-btn"
              onClick={() => abortRef.current?.abort()}
            >
              <Square aria-hidden /> Detener
            </button>
          ) : (
            <button
              type="button"
              className="lc-btn lc-btn-primary"
              disabled={!prompt.trim() || !activeModel}
              onClick={run}
            >
              <Play aria-hidden /> Ejecutar en vivo
            </button>
          )}
          <span className="lc-live" data-on={running || undefined}>
            {running ? "Recibiendo…" : done ? "Terminado" : "Listo"}
          </span>
        </div>

        {error ? (
          <p className="lc-error" role="alert">
            {error}
          </p>
        ) : null}

        <output className="lc-output" aria-live="polite">
          {reasoning ? (
            <details className="lc-reasoning" open={running && !text}>
              <summary>Razonamiento del modelo</summary>
              <pre>{reasoning}</pre>
            </details>
          ) : null}
          <pre>
            {text}
            {running ? <span className="lc-caret" aria-hidden /> : null}
          </pre>
          {text ? <h3 className="lc-answer-title">Respuesta</h3> : null}
          {!text && !running ? (
            done?.finishReason === "length" ? (
              <span className="lc-error">
                El modelo gastó todo el máximo de salida razonando y no llegó a
                responder. Sube el «Máximo de salida» y vuelve a ejecutar.
              </span>
            ) : (
              <span className="lc-placeholder">
                {done
                  ? "El proveedor no devolvió texto de respuesta."
                  : "La respuesta aparecerá aquí token a token."}
              </span>
            )
          ) : null}
        </output>

        <dl className="lc-metrics">
          <div>
            <dt>
              <Timer aria-hidden /> Primer token
            </dt>
            <dd>{ms(done?.metrics.ttftMs ?? firstTokenMs)}</dd>
          </div>
          <div>
            <dt>Latencia total</dt>
            <dd>{ms(done?.metrics.latencyMs)}</dd>
          </div>
          <div>
            <dt>
              <Zap aria-hidden /> Tokens/s
            </dt>
            <dd>
              {done?.metrics.tokensPerSecond
                ? `${done.metrics.tokensPerSecond.toFixed(1)}${done.metrics.estimated ? " (estimado)" : ""}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Costo de esta ejecución</dt>
            <dd title={done?.costNote}>{done ? usd(done.costUsd) : "—"}</dd>
          </div>
        </dl>
        {done?.costNote ? <p className="lc-note">{done.costNote}</p> : null}
      </section>

      <section className="lc-stats" aria-label="Promedios por modelo">
        <h2>Promedio por modelo</h2>
        <p className="lc-note">
          Calculado con tus ejecuciones guardadas. El costo viene del proveedor
          o de precios indexados; si no hay precio, se indica.
        </p>
        {rows.length === 0 ? (
          <p className="lc-note">Aún no hay ejecuciones registradas.</p>
        ) : (
          <div className="lc-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Modelo</th>
                  <th scope="col">Ejec.</th>
                  <th scope="col">Costo prom.</th>
                  <th scope="col">Total</th>
                  <th scope="col">1.er token</th>
                  <th scope="col">Tok/s</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.providerId}:${row.modelId}`}>
                    <th scope="row">
                      {row.modelId}
                      <small>{row.providerId}</small>
                    </th>
                    <td>{row.runs}</td>
                    <td>{usd(row.avgCostUsd)}</td>
                    <td>{usd(row.totalCostUsd)}</td>
                    <td>{ms(row.avgTtftMs)}</td>
                    <td>
                      {row.avgTokensPerSecond
                        ? row.avgTokensPerSecond.toFixed(1)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
