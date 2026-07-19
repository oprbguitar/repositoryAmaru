import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { getSources, synchronize } from "./api";
import { formatDate } from "./format";

const actions = [
  ["public", "Sincronizar todas las fuentes públicas"],
  ["providers", "Sincronizar proveedores"],
  ["models", "Sincronizar modelos"],
  ["news", "Sincronizar noticias"],
  ["research", "Sincronizar investigaciones"],
  ["github", "Sincronizar GitHub"],
  ["videos", "Sincronizar videos"],
  ["market", "Sincronizar mercado"],
  ["failed", "Reintentar fallidas"],
] as const;

export function AdminSourcesPage() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<string | null>(null);
  const sources = useQuery({
    queryKey: ["sources"],
    queryFn: getSources,
    refetchInterval: 30_000,
  });
  const sync = useMutation({
    mutationFn: synchronize,
    onSuccess: (response) => {
      const completed = response.data.filter(
        (item) => item.status === "completed",
      ).length;
      const failed = response.data.length - completed;
      setResult(
        `${completed} fuentes completadas; ${failed} con estado parcial, fallido o no configurado.`,
      );
      void queryClient.invalidateQueries();
    },
    onError: (error) =>
      setResult(
        error instanceof Error ? error.message : "Error de sincronización.",
      ),
  });
  const items = sources.data?.data ?? [];
  return (
    <div className="module-layout admin-layout">
      <section className="module-main scroll-region">
        <header className="page-heading">
          <div>
            <h1>
              <DatabaseZap /> Administración de fuentes
            </h1>
            <p>
              Controles reales de sincronización, salud, cuotas y credenciales
              locales.
            </p>
          </div>
        </header>
        <section className="panel sync-actions">
          <div className="panel-heading">
            <h2>Sincronización</h2>
            <span>{sync.isPending ? "Running" : "Lista"}</span>
          </div>
          <div className="action-grid">
            {actions.map(([scope, label]) => (
              <button
                type="button"
                key={scope}
                disabled={sync.isPending || scope === "videos"}
                onClick={() => sync.mutate(scope)}
              >
                <RefreshCw className={sync.isPending ? "spin" : ""} />
                {label}
                {scope === "videos" ? (
                  <small>YOUTUBE_API_KEY no configurada</small>
                ) : null}
              </button>
            ))}
          </div>
          {result ? <p className="sync-result">{result}</p> : null}
        </section>
        <section className="panel data-table-panel">
          <div className="panel-heading">
            <h2>Salud de fuentes</h2>
            <span>{items.length} registradas</span>
          </div>
          <div className="data-table-scroll">
            <table className="observatory-table">
              <thead>
                <tr>
                  <th>Fuente</th>
                  <th>Acceso</th>
                  <th>Credencial</th>
                  <th>Estado</th>
                  <th>Última petición</th>
                  <th>Último éxito</th>
                  <th>HTTP</th>
                  <th>Registros</th>
                  <th>Cuota restante</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {items.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <strong>{source.name}</strong>
                      <small>{source.category ?? source.id}</small>
                    </td>
                    <td>
                      {source.authenticationType === "none"
                        ? "Pública"
                        : source.authenticationType}
                    </td>
                    <td>
                      {source.credentialConfigured ? (
                        <span className="health-ok">
                          <CheckCircle2 /> Configurada
                        </span>
                      ) : (
                        <span className="health-warn">
                          <KeyRound /> Falta {source.secretBindingName}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`state-badge ${source.status === "connected" || source.status === "ready" ? "verified" : source.status === "failed" ? "error" : "provisional"}`}
                      >
                        {source.status}
                      </span>
                    </td>
                    <td>{formatDate(source.lastRequestAt)}</td>
                    <td>{formatDate(source.lastSuccessAt)}</td>
                    <td>{source.lastHttpStatus ?? "—"}</td>
                    <td>{source.recordCount}</td>
                    <td>{source.rateLimitRemaining ?? "No informada"}</td>
                    <td>
                      {source.lastError ? (
                        <span className="health-warn">
                          <AlertTriangle /> {source.lastError}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
      <aside className="context-panel scroll-region">
        <div className="context-title">
          <DatabaseZap />
          <strong>Estado del observatorio</strong>
        </div>
        <section>
          <h3>Fuentes</h3>
          <p>
            {items.filter((item) => item.status === "connected").length}{" "}
            conectadas ·{" "}
            {items.filter((item) => item.status === "failed").length} fallidas ·{" "}
            {items.filter((item) => !item.credentialConfigured).length}{" "}
            requieren credencial.
          </p>
        </section>
        <section>
          <h3>Secretos</h3>
          <p>
            Las claves se leen exclusivamente de <code>.dev.vars</code> en el
            Worker local y nunca se envían al navegador.
          </p>
        </section>
        <section>
          <h3>Estados</h3>
          <p>
            Pending · Running · Completed · Partial · Failed · Rate limited ·
            Not configured.
          </p>
        </section>
      </aside>
    </div>
  );
}
