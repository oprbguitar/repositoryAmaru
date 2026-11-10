import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  PlugZap,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { IntegrationStatus } from "../../../types/api";
import "../integrations/integrations.css";
import {
  deleteIntegration,
  getIntegrations,
  saveIntegration,
  testIntegration,
} from "./api";
import { formatDate } from "./format";

type Outcome = { status: "ok" | "failed" | "not_configured"; message: string };
type StateKey = "none" | "saved" | "ok" | "failed" | "env";
type Filter = "all" | "configured" | "none" | "failed";

/** Estado visible de una clave, derivado solo de lo que el Worker reporta. */
export function integrationState(item: IntegrationStatus): StateKey {
  if (!item.configured) return "none";
  if (item.lastTestStatus === "ok") return "ok";
  if (item.lastTestStatus === "failed") return "failed";
  return item.storage === "environment" ? "env" : "saved";
}

const STATE_LABEL: Record<StateKey, string> = {
  none: "Sin configurar",
  saved: "Guardada",
  env: "En .dev.vars",
  ok: "Probada OK",
  failed: "Falló",
};

function IntegrationRow({
  item,
  encryptionConfigured,
}: {
  item: IntegrationStatus;
  encryptionConfigured: boolean;
}) {
  const queryClient = useQueryClient();
  const [credential, setCredential] = useState("");
  const [reveal, setReveal] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const minLength = item.minLength ?? 8;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["integrations"] });
    void queryClient.invalidateQueries({ queryKey: ["sources"] });
  }
  const fail = (fallback: string) => (issue: unknown) =>
    setError(issue instanceof Error ? issue.message : fallback);

  const save = useMutation({
    mutationFn: () => saveIntegration(item.binding, credential),
    onSuccess: () => {
      setCredential("");
      setError(null);
      setOutcome(null);
      refresh();
    },
    onError: fail("No se pudo guardar."),
  });
  const remove = useMutation({
    mutationFn: () => deleteIntegration(item.binding),
    onSuccess: () => {
      setOutcome(null);
      setError(null);
      refresh();
    },
    onError: fail("No se pudo borrar."),
  });
  const probe = useMutation({
    mutationFn: () => testIntegration(item.binding),
    onSuccess: (response) => {
      setOutcome({
        status: response.data.status,
        message: `${response.data.message}${response.data.status === "ok" ? ` (${response.data.latencyMs} ms)` : ""}`,
      });
      setError(null);
      refresh();
    },
    onError: fail("No se pudo probar."),
  });
  const busy = save.isPending || remove.isPending || probe.isPending;
  const state = integrationState(item);
  const detail =
    state === "ok" || state === "failed"
      ? `${STATE_LABEL[state]} · ${formatDate(item.lastTestedAt)}`
      : state === "saved"
        ? `Guardada · ${formatDate(item.updatedAt)}`
        : STATE_LABEL[state];

  return (
    <li className={`int-row is-${state}`}>
      <div className="int-id">
        <span className={`int-dot is-${state}`} aria-hidden="true" />
        <div>
          <strong>{item.name}</strong>
          <code>{item.binding}</code>
        </div>
      </div>
      <div className="int-state" title={item.lastTestMessage ?? undefined}>
        <span className={`int-chip is-${state}`}>{detail}</span>
        {item.configured && item.lastFour ? (
          <small>•••• {item.lastFour}</small>
        ) : null}
      </div>
      <form
        className="int-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (credential.trim().length >= minLength && !busy) save.mutate();
        }}
      >
        <label className="int-input">
          <span className="sr-only">Valor de {item.binding}</span>
          <input
            type={reveal ? "text" : "password"}
            value={credential}
            autoComplete="off"
            spellCheck={false}
            placeholder={item.configured ? "Reemplazar…" : "Pegar valor…"}
            onChange={(event) => setCredential(event.target.value)}
          />
          <button
            type="button"
            title={reveal ? "Ocultar" : "Mostrar"}
            aria-label={reveal ? "Ocultar valor" : "Mostrar valor"}
            onClick={() => setReveal((value) => !value)}
          >
            {reveal ? <EyeOff /> : <Eye />}
          </button>
        </label>
        <button
          type="submit"
          className="int-btn is-primary"
          disabled={credential.trim().length < minLength || busy}
        >
          {save.isPending ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          className="int-btn"
          disabled={!item.configured || !item.testable || busy}
          onClick={() => probe.mutate()}
          title={
            item.probeNote ??
            (item.needs?.length ? `Usa también ${item.needs.join(", ")}` : "")
          }
        >
          <PlugZap className={probe.isPending ? "int-spin" : ""} /> Probar
        </button>
        {item.storage === "local_encrypted" ? (
          <button
            type="button"
            className="int-btn is-icon"
            disabled={busy}
            onClick={() => remove.mutate()}
            title="Borrar la clave guardada"
            aria-label={`Borrar ${item.name}`}
          >
            <Trash2 />
          </button>
        ) : null}
      </form>
      <div className="int-meta">
        <span title={item.unlocks}>{item.unlocks}</span>
        <span>{item.freeTierNote}</span>
        {item.verified ? (
          <span title="Respuesta del endpoint de prueba sin clave válida">
            Endpoint: {item.verified}
          </span>
        ) : null}
        <a href={item.apiKeyUrl} target="_blank" rel="noreferrer">
          Obtener clave <ExternalLink />
        </a>
      </div>
      {error || outcome || !encryptionConfigured ? (
        <p
          className={`int-note ${error || outcome?.status === "failed" ? "is-bad" : outcome?.status === "ok" ? "is-good" : "is-warn"}`}
          role="status"
        >
          {error ??
            outcome?.message ??
            "Falta DEVELOPER_LAB_ENCRYPTION_KEY en .dev.vars: no se puede cifrar."}
        </p>
      ) : null}
    </li>
  );
}

/**
 * Claves de fuentes de datos. El valor viaja una vez al Worker, se guarda
 * cifrado y no vuelve al navegador: la interfaz solo conoce los últimos cuatro.
 */
export function IntegrationsPanel() {
  const integrations = useQuery({
    queryKey: ["integrations"],
    queryFn: getIntegrations,
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const data = integrations.data?.data;
  const items = data?.items ?? [];

  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (data?.categories ?? [])
      .map((category) => {
        const all = items.filter((item) => item.category === category.id);
        const visible = all.filter((item) => {
          const state = integrationState(item);
          if (filter === "configured" && !item.configured) return false;
          if (filter === "none" && item.configured) return false;
          if (filter === "failed" && state !== "failed") return false;
          return (
            !needle ||
            `${item.name} ${item.binding} ${item.unlocks}`
              .toLowerCase()
              .includes(needle)
          );
        });
        return { category, all, visible };
      })
      .filter((group) => group.all.length);
  }, [data, items, search, filter]);

  if (integrations.isLoading)
    return (
      <div className="int-empty" role="status">
        Consultando integraciones…
      </div>
    );
  if (integrations.isError)
    return <div className="int-empty">No se pudo leer el catálogo.</div>;

  const configured = items.filter((item) => item.configured).length;
  const shown = groups.reduce((sum, group) => sum + group.visible.length, 0);
  const filters: Array<[Filter, string]> = [
    ["all", "Todas"],
    ["configured", "Configuradas"],
    ["none", "Sin configurar"],
    ["failed", "Con error"],
  ];

  return (
    <div className="int-panel">
      <div className="int-toolbar">
        <label className="int-search">
          <Search />
          <input
            aria-label="Buscar integraciones"
            value={search}
            placeholder="Buscar integración o variable…"
            onChange={(event) => setSearch(event.target.value)}
          />
          {search ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setSearch("")}
            >
              <X />
            </button>
          ) : null}
        </label>
        <fieldset className="int-filters" aria-label="Filtro de estado">
          {filters.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              className={filter === id ? "is-selected" : ""}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </fieldset>
        <span className="int-count">
          <KeyRound /> {configured}/{items.length} configuradas
        </span>
        <button
          type="button"
          className="int-link"
          onClick={() =>
            setClosed(
              Object.fromEntries(
                groups.map((group) => [
                  group.category.id,
                  !Object.values(closed).some(Boolean),
                ]),
              ),
            )
          }
        >
          {Object.values(closed).some(Boolean)
            ? "Expandir todo"
            : "Plegar todo"}
        </button>
      </div>
      <p className="int-hint">
        Se cifran con AES-GCM en la base local y priman sobre{" "}
        <code>.dev.vars</code>. Modelos de IA: «Laboratorio de APIs».
      </p>

      {shown === 0 ? (
        <div className="int-empty">Ninguna integración coincide.</div>
      ) : null}

      {groups.map(({ category, all, visible }) => {
        if (!visible.length) return null;
        const isClosed = closed[category.id] ?? false;
        const done = all.filter((item) => item.configured).length;
        return (
          <section key={category.id} className="int-group">
            <button
              type="button"
              className="int-group-head"
              aria-expanded={!isClosed}
              onClick={() =>
                setClosed((current) => ({
                  ...current,
                  [category.id]: !isClosed,
                }))
              }
            >
              <ChevronDown className={isClosed ? "is-closed" : ""} />
              <h2>{category.label}</h2>
              <span>{category.description}</span>
              <em>
                {done}/{all.length}
              </em>
            </button>
            {isClosed ? null : (
              <ul className="int-list">
                {visible.map((item) => (
                  <IntegrationRow
                    key={item.binding}
                    item={item}
                    encryptionConfigured={data?.encryptionConfigured ?? false}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
