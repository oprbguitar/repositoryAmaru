import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  KeyRound,
} from "lucide-react";
import { useState } from "react";
import { SyncActionButton } from "../../components/common/SyncActionButton";
import { getIntegrations, getSources, synchronize } from "./api";
import { formatDate } from "./format";
import { IntegrationsPanel } from "./IntegrationsPanel";

/** Cada acción declara qué fuente necesita credencial para poder ejecutarse. */
const actions = [
  ["public", "Sincronizar todas las fuentes públicas", null],
  ["providers", "Sincronizar proveedores", null],
  ["models", "Sincronizar modelos", null],
  ["news", "Sincronizar noticias", null],
  ["research", "Sincronizar investigaciones", null],
  ["github", "Sincronizar GitHub", null],
  ["videos", "Sincronizar videos", "youtube"],
  ["market", "Sincronizar mercado", null],
  ["failed", "Reintentar fallidas", null],
] as const;

type Tab = "integrations" | "sources";

export function AdminSourcesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("integrations");
  const [result, setResult] = useState<string | null>(null);
  const [runningScope, setRunningScope] = useState<string | null>(null);
  const sources = useQuery({
    queryKey: ["sources"],
    queryFn: getSources,
    refetchInterval: 30_000,
  });
  const integrations = useQuery({
    queryKey: ["integrations"],
    queryFn: getIntegrations,
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
    onSettled: () => setRunningScope(null),
  });
  const items = sources.data?.data ?? [];
  const configuredCount =
    integrations.data?.data.items.filter((item) => item.configured).length ?? 0;
  const missingCredential = items.filter((item) => !item.credentialConfigured);

  function requirementMissing(sourceId: string | null): boolean {
    if (!sourceId) return false;
    const source = items.find((item) => item.id === sourceId);
    return source ? !source.credentialConfigured : false;
  }

  return (
    <div className="module-layout admin-layout">
      <section className="module-main scroll-region">
        <header className="page-heading">
          <div>
            <h1>
              <DatabaseZap /> Configurar integraciones
            </h1>
            <p>Claves de API, sincronización y salud de fuentes.</p>
          </div>
        </header>

        <div className="segmented-tabs" role="tablist" aria-label="Secciones">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "integrations"}
            className={tab === "integrations" ? "active" : ""}
            onClick={() => setTab("integrations")}
          >
            <KeyRound /> Claves de API
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "sources"}
            className={tab === "sources" ? "active" : ""}
            onClick={() => setTab("sources")}
          >
            <DatabaseZap /> Fuentes y sincronización
          </button>
        </div>

        {tab === "integrations" ? (
          <IntegrationsPanel />
        ) : (
          <>
            <section className="panel sync-actions">
              <div className="panel-heading">
                <h2>Sincronización</h2>
                <span>{sync.isPending ? "Running" : "Lista"}</span>
              </div>
              <div className="action-grid">
                {actions.map(([scope, label, requires]) => {
                  const blocked = requirementMissing(requires);
                  // Solo se anima la acción en curso; el resto queda inhabilitado
                  // para no lanzar dos sincronizaciones simultáneas.
                  const busy = sync.isPending && runningScope === scope;
                  return (
                    <SyncActionButton
                      key={scope}
                      className=""
                      label={label}
                      busy={busy}
                      disabled={sync.isPending || blocked}
                      onClick={() => {
                        setRunningScope(scope);
                        setResult(null);
                        sync.mutate(scope);
                      }}
                    >
                      {blocked ? (
                        <small>Falta la credencial de «{requires}»</small>
                      ) : null}
                    </SyncActionButton>
                  );
                })}
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
          </>
        )}
      </section>

      <aside className="context-panel scroll-region">
        <div className="context-title">
          <DatabaseZap />
          <strong>Estado del observatorio</strong>
        </div>
        <section>
          <h3>Integraciones</h3>
          <p>
            {configuredCount} claves configuradas de{" "}
            {integrations.data?.data.items.length ?? 0} disponibles.
          </p>
        </section>
        <section>
          <h3>Fuentes</h3>
          <p>
            {items.filter((item) => item.status === "connected").length}{" "}
            conectadas ·{" "}
            {items.filter((item) => item.status === "failed").length} fallidas ·{" "}
            {missingCredential.length} requieren credencial.
          </p>
        </section>
        <section>
          <h3>Secretos</h3>
          <p>Cifrados en la base local; nunca vuelven al navegador.</p>
        </section>
      </aside>
    </div>
  );
}
