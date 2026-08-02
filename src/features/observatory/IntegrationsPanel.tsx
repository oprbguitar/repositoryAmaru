import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  PlugZap,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { IntegrationStatus } from "../../../types/api";
import {
  deleteIntegration,
  getIntegrations,
  saveIntegration,
  testIntegration,
} from "./api";
import { formatDate } from "./format";

type TestOutcome = {
  status: "ok" | "failed" | "not_configured";
  message: string;
  latencyMs: number;
};

function StorageBadge({ item }: { item: IntegrationStatus }) {
  if (item.storage === "local_encrypted")
    return (
      <span className="state-badge verified">
        <CheckCircle2 /> Guardada y cifrada
      </span>
    );
  if (item.storage === "environment")
    return (
      <span className="state-badge provisional">
        <CheckCircle2 /> Desde .dev.vars
      </span>
    );
  return (
    <span className="state-badge">
      <KeyRound /> Sin configurar
    </span>
  );
}

function IntegrationCard({
  item,
  encryptionConfigured,
}: {
  item: IntegrationStatus;
  encryptionConfigured: boolean;
}) {
  const queryClient = useQueryClient();
  const [credential, setCredential] = useState("");
  const [reveal, setReveal] = useState(false);
  const [outcome, setOutcome] = useState<TestOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["integrations"] });
    void queryClient.invalidateQueries({ queryKey: ["sources"] });
  }

  const save = useMutation({
    mutationFn: () => saveIntegration(item.binding, credential),
    onSuccess: () => {
      setCredential("");
      setError(null);
      setOutcome(null);
      refresh();
    },
    onError: (issue) =>
      setError(issue instanceof Error ? issue.message : "No se pudo guardar."),
  });
  const remove = useMutation({
    mutationFn: () => deleteIntegration(item.binding),
    onSuccess: () => {
      setOutcome(null);
      setError(null);
      refresh();
    },
    onError: (issue) =>
      setError(issue instanceof Error ? issue.message : "No se pudo borrar."),
  });
  const probe = useMutation({
    mutationFn: () => testIntegration(item.binding),
    onSuccess: (response) => {
      setOutcome({
        status: response.data.status,
        message: response.data.message,
        latencyMs: response.data.latencyMs,
      });
      setError(null);
      refresh();
    },
    onError: (issue) =>
      setError(issue instanceof Error ? issue.message : "No se pudo probar."),
  });

  const busy = save.isPending || remove.isPending || probe.isPending;

  return (
    <article className="panel integration-card">
      <header className="integration-card-head">
        <div>
          <h3>{item.name}</h3>
          <code>{item.binding}</code>
        </div>
        <StorageBadge item={item} />
      </header>

      <p className="integration-unlocks">{item.unlocks}</p>
      <p className="integration-note">{item.freeTierNote}</p>

      {item.configured ? (
        <dl className="integration-facts">
          <dt>Clave</dt>
          <dd>•••• {item.lastFour}</dd>
          {item.updatedAt ? (
            <>
              <dt>Actualizada</dt>
              <dd>{formatDate(item.updatedAt)}</dd>
            </>
          ) : null}
          {item.lastTestedAt ? (
            <>
              <dt>Última prueba</dt>
              <dd>
                {formatDate(item.lastTestedAt)} ·{" "}
                {item.lastTestStatus === "ok" ? "correcta" : "fallida"}
              </dd>
            </>
          ) : null}
        </dl>
      ) : null}

      {item.sources.length ? (
        <ul className="integration-sources">
          {item.sources.map((source) => (
            <li key={source.id}>
              <span
                className={`state-badge ${source.status === "connected" ? "verified" : source.status === "failed" ? "error" : "provisional"}`}
              >
                {source.status}
              </span>
              {source.id} · {source.recordCount} registros ·{" "}
              {source.lastSuccessAt
                ? `último éxito ${formatDate(source.lastSuccessAt)}`
                : "sin sincronización previa"}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="integration-form">
        <label className="integration-input">
          <span className="visually-hidden">Clave de {item.name}</span>
          <input
            type={reveal ? "text" : "password"}
            value={credential}
            autoComplete="off"
            spellCheck={false}
            placeholder={
              item.configured
                ? "Reemplazar la clave actual…"
                : "Pega aquí la clave…"
            }
            onChange={(event) => setCredential(event.target.value)}
          />
          <button
            type="button"
            className="ghost-button"
            title={reveal ? "Ocultar" : "Mostrar"}
            onClick={() => setReveal((value) => !value)}
          >
            {reveal ? <EyeOff /> : <Eye />}
          </button>
        </label>
        <button
          type="button"
          className="primary-button compact"
          disabled={credential.trim().length < 8 || busy}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Guardando…" : "Guardar"}
        </button>
        {item.testable ? (
          <button
            type="button"
            className="secondary-button compact"
            disabled={!item.configured || busy}
            onClick={() => probe.mutate()}
          >
            <PlugZap className={probe.isPending ? "spin" : ""} /> Probar
          </button>
        ) : null}
        {item.storage === "local_encrypted" ? (
          <button
            type="button"
            className="secondary-button compact"
            disabled={busy}
            onClick={() => remove.mutate()}
            title="Borrar la credencial guardada"
          >
            <Trash2 /> Borrar
          </button>
        ) : null}
      </div>

      {!encryptionConfigured ? (
        <p className="integration-result warn">
          <AlertTriangle /> Falta DEVELOPER_LAB_ENCRYPTION_KEY en .dev.vars: sin
          ella no se puede cifrar ninguna credencial nueva.
        </p>
      ) : null}
      {error ? (
        <p className="integration-result error">
          <AlertTriangle /> {error}
        </p>
      ) : null}
      {outcome ? (
        <p
          className={`integration-result ${outcome.status === "ok" ? "ok" : "error"}`}
        >
          {outcome.status === "ok" ? <CheckCircle2 /> : <AlertTriangle />}{" "}
          {outcome.message}
          {outcome.status === "ok" ? ` (${outcome.latencyMs} ms)` : ""}
        </p>
      ) : null}

      <footer className="integration-links">
        <a href={item.apiKeyUrl} target="_blank" rel="noreferrer">
          Obtener clave <ExternalLink />
        </a>
        <a href={item.documentationUrl} target="_blank" rel="noreferrer">
          Documentación <ExternalLink />
        </a>
      </footer>
    </article>
  );
}

/**
 * Configuración de credenciales de fuentes de datos. La clave viaja una sola
 * vez al Worker, se guarda cifrada y nunca vuelve al navegador: la interfaz
 * solo conoce los últimos cuatro caracteres.
 */
export function IntegrationsPanel() {
  const integrations = useQuery({
    queryKey: ["integrations"],
    queryFn: getIntegrations,
  });
  const data = integrations.data?.data;
  const items = data?.items ?? [];

  if (integrations.isLoading)
    return (
      <div className="panel honest-empty">
        <p>Consultando el estado de las integraciones…</p>
      </div>
    );

  return (
    <div className="integrations-panel">
      <div className="panel integration-intro">
        <KeyRound />
        <div>
          <strong>
            {items.filter((item) => item.configured).length} de {items.length}{" "}
            integraciones configuradas
          </strong>
          <p>
            Las claves se cifran con AES-GCM y se guardan en la base local. Se
            usan por encima de las variables de <code>.dev.vars</code>, así que
            una clave guardada aquí no requiere reiniciar el Worker. Las claves
            de proveedores de modelos se configuran en «Laboratorio de APIs».
          </p>
        </div>
      </div>

      {(data?.categories ?? []).map((category) => {
        const group = items.filter((item) => item.category === category.id);
        if (!group.length) return null;
        return (
          <section key={category.id} className="integration-group">
            <div className="panel-heading">
              <h2>{category.label}</h2>
              <span>{category.description}</span>
            </div>
            <div className="integration-grid">
              {group.map((item) => (
                <IntegrationCard
                  key={item.binding}
                  item={item}
                  encryptionConfigured={data?.encryptionConfigured ?? false}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
