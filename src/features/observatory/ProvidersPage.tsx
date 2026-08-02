import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Check,
  Clock3,
  Cpu,
  Database,
  ExternalLink,
  Info,
  KeyRound,
  MapPin,
  Plug,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { ProviderRecord } from "../../../types/api";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { Pagination } from "../../components/layout/Pagination";
import { getDashboard, getProviders, getSources } from "./api";
import { formatDate, formatNumber, missing } from "./format";
import { ProviderDetail } from "./ProviderDetail";

const PAGE_SIZE = 9;

type ProviderFilter = "all" | "connected" | "registered";
type ProviderSort = "popular" | "name";

/** Spanish labels for the link slots stored on each provider row. */
const LINK_LABELS: Record<string, string> = {
  documentation: "documentation",
  models: "models",
  pricing: "pricing",
  apiKey: "apiKey",
  changelog: "changelog",
  console: "console",
  examples: "examples",
};

/** Deterministic tint per provider so the monogram is stable between visits. */
const TINTS = [
  "var(--accent)",
  "var(--info)",
  "var(--purple)",
  "var(--ok)",
  "var(--warn)",
  "var(--danger)",
];

function tintFor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1)
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return TINTS[hash % TINTS.length];
}

function providerLinks(provider: ProviderRecord): Array<[string, string]> {
  return Object.entries(provider.links)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([slot, url]) => [LINK_LABELS[slot] ?? slot, url]);
}

export function ProvidersPage() {
  const [filter, setFilter] = useState<ProviderFilter>("all");
  const [sort, setSort] = useState<ProviderSort>("popular");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ProviderRecord | null>(null);

  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });
  const sources = useQuery({ queryKey: ["sources"], queryFn: getSources });
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const all = providers.data?.data ?? [];
  const connected = all.filter(
    (provider) => provider.integrationStatus === "connected",
  );
  const registered = all.filter(
    (provider) => provider.integrationStatus !== "connected",
  );
  const sourceItems = sources.data?.data ?? [];
  const keyed = sourceItems.filter((source) => source.secretBindingName);
  const keysConfigured = keyed.filter(
    (source) => source.credentialConfigured,
  ).length;
  const lastSync = all
    .map((provider) => provider.lastSuccessfulSync)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  const filtered = useMemo(() => {
    const base =
      filter === "connected"
        ? connected
        : filter === "registered"
          ? registered
          : all;
    const normalized = query.trim().toLocaleLowerCase("es");
    const matched = base.filter((provider) =>
      [provider.name, provider.country ?? "", ...provider.categories]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(normalized),
    );
    return sort === "name"
      ? [...matched].sort((left, right) =>
          left.name.localeCompare(right.name, "es"),
        )
      : matched; // the API already orders by model count (popularity)
  }, [all, connected, registered, filter, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const chosen =
    filtered.find((provider) => provider.id === selectedId) ??
    visible[0] ??
    null;

  function changeFilter(next: ProviderFilter) {
    setFilter(next);
    setPage(1);
    setSelectedId(null);
  }

  const panel = chosen ? (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Info />
        <strong>Información contextual</strong>
      </div>
      <section>
        <span
          className={`state-badge ${chosen.integrationStatus === "connected" ? "verified" : "not-configured"}`}
        >
          {chosen.integrationStatus === "connected" ? (
            <>
              <Check /> Conectado
            </>
          ) : (
            "Registrado"
          )}
        </span>
        <div className="provider-panel-title">
          <span
            className="resource-avatar resource-avatar-fallback"
            aria-hidden="true"
            style={{ color: tintFor(chosen.id) }}
          >
            {chosen.name.slice(0, 2).toUpperCase()}
          </span>
          <h2 className="context-record-title">{chosen.name}</h2>
        </div>
        <p>{chosen.categories.join(" · ") || missing}</p>
      </section>
      <section>
        <h3>Datos publicados</h3>
        <ul className="resource-facts">
          <li>
            <MapPin />
            <span>País</span>
            <strong>{chosen.country ?? missing}</strong>
          </li>
          <li>
            <Cpu />
            <span>Modelos indexados</span>
            <strong>{formatNumber(chosen.modelCount)}</strong>
          </li>
          <li>
            <Plug />
            <span>API</span>
            <strong>{chosen.apiAvailable ? "Disponible" : missing}</strong>
          </li>
          <li>
            <KeyRound />
            <span>Nivel gratuito</span>
            <strong>{chosen.freeTierStatus ?? missing}</strong>
          </li>
          <li>
            <Database />
            <span>Ejecución local</span>
            <strong>{chosen.localExecutionAvailable ? "Sí" : "No"}</strong>
          </li>
          <li>
            <Clock3 />
            <span>Última sincronización</span>
            <strong>{formatDate(chosen.lastSuccessfulSync)}</strong>
          </li>
          <li>
            <ShieldCheck />
            <span>Confianza de la fuente</span>
            <strong>{chosen.sourceConfidence ?? missing}</strong>
          </li>
        </ul>
      </section>
      <section>
        <h3>Enlaces oficiales</h3>
        <ul className="provider-panel-links">
          {providerLinks(chosen).map(([label, url]) => (
            <li key={label}>
              <a href={url} target="_blank" rel="noreferrer">
                {label} <ExternalLink />
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Acciones</h3>
        <button
          type="button"
          className="secondary-button compact"
          onClick={() => setSheet(chosen)}
        >
          Ver ranking de uso y costo por token
        </button>
      </section>
    </aside>
  ) : (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Info />
        <strong>Información contextual</strong>
      </div>
      <section>
        <p>Selecciona un proveedor para revisar sus datos y enlaces.</p>
      </section>
    </aside>
  );

  return (
    <CollapsibleLayout storageKey="providers" panel={panel}>
      <header className="page-heading resource-heading">
        <span className="page-icon">
          <Building2 />
        </span>
        <div>
          <h1>Proveedores y modelos</h1>
          <p>
            Catálogo recuperado desde fuentes públicas y APIs oficiales
            configuradas.
          </p>
        </div>
      </header>

      <div className="resource-stats">
        {[
          {
            icon: Building2,
            label: "Proveedores activos",
            value: formatNumber(all.length),
            hint: `Conectados: ${connected.length} · Registrados: ${registered.length}`,
            accent: "var(--purple)",
          },
          {
            icon: Cpu,
            label: "Modelos indexados",
            value: formatNumber(dashboard.data?.data.models ?? 0),
            hint: "Registros sincronizados",
            accent: "var(--ok)",
          },
          {
            icon: KeyRound,
            label: "APIs con credencial",
            value: `${keysConfigured} / ${keyed.length}`,
            hint: "Claves configuradas en .dev.vars",
            accent: "var(--info)",
          },
          {
            icon: Clock3,
            label: "Última sincronización",
            value: formatDate(lastSync ?? null),
            hint: "Fuentes públicas del observatorio",
            accent: "var(--warn)",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              className="panel resource-stat"
              key={stat.label}
              style={{ "--stat-accent": stat.accent } as React.CSSProperties}
            >
              <span className="resource-stat-head">
                <span className="resource-stat-icon">
                  <Icon />
                </span>
                {stat.label}
              </span>
              <strong className="provider-stat-value">{stat.value}</strong>
              <small>{stat.hint}</small>
              <span className="resource-stat-bar" aria-hidden="true" />
            </article>
          );
        })}
      </div>

      <div className="resource-controls">
        <div className="resource-tabs" role="tablist">
          {(
            [
              ["all", "Todos los proveedores", all.length],
              ["connected", "Conectados", connected.length],
              ["registered", "Registrados", registered.length],
            ] as Array<[ProviderFilter, string, number]>
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              className={filter === id ? "active" : ""}
              onClick={() => changeFilter(id)}
            >
              {label} <em>{count}</em>
            </button>
          ))}
        </div>
        <label className="module-search resource-search">
          <Search />
          <input
            aria-label="Buscar proveedores"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar proveedor, país o categoría…"
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
            >
              <X />
            </button>
          ) : null}
        </label>
        <label className="resource-sort">
          <span>Ordenar por</span>
          <select
            aria-label="Ordenar proveedores"
            value={sort}
            onChange={(event) => setSort(event.target.value as ProviderSort)}
          >
            <option value="popular">Popularidad</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </label>
      </div>

      <section
        className="provider-cards"
        aria-label="Directorio de proveedores"
      >
        {visible.length ? (
          visible.map((provider) => (
            <article
              key={provider.id}
              className={`panel provider-tile${chosen?.id === provider.id ? " selected" : ""}`}
            >
              <div className="provider-tile-head">
                <span
                  className="resource-avatar resource-avatar-fallback"
                  aria-hidden="true"
                  style={{ color: tintFor(provider.id) }}
                >
                  {provider.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="provider-tile-name">
                  <h2>{provider.name}</h2>
                  <small>
                    <MapPin /> {provider.country ?? missing}
                  </small>
                </div>
                <span
                  className={`state-badge ${provider.integrationStatus === "connected" ? "verified" : "not-configured"}`}
                >
                  {provider.integrationStatus === "connected"
                    ? "Conectado"
                    : "Registrado"}
                </span>
              </div>
              <div className="provider-tile-metrics">
                <span>
                  <strong>{formatNumber(provider.modelCount)}</strong> modelos
                  indexados
                </span>
                <span>
                  {provider.apiAvailable ? "API disponible" : "Sin API pública"}
                </span>
              </div>
              <p className="provider-tile-categories">
                {provider.categories.join(" · ") || missing}
              </p>
              <small className="provider-tile-sync">
                Última sincronización: {formatDate(provider.lastSuccessfulSync)}
              </small>
              <div className="provider-tile-links">
                {providerLinks(provider)
                  .slice(0, 5)
                  .map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {label} <ExternalLink />
                    </a>
                  ))}
              </div>
              {/* Stretched hit area covering the card: selecting updates the
                  contextual panel and, honouring the label, opens the
                  usage-and-cost ranking sheet. A real button, so keyboard and
                  screen readers get the same behaviour. */}
              <button
                type="button"
                className="provider-tile-select"
                aria-pressed={chosen?.id === provider.id}
                onClick={() => {
                  setSelectedId(provider.id);
                  setSheet(provider);
                }}
              >
                Ver ranking de uso y costo por token
              </button>
            </article>
          ))
        ) : (
          <div className="honest-empty panel resource-empty">
            <h2>
              {filtered.length
                ? "No hay resultados en esta página"
                : "No hay proveedores para este filtro"}
            </h2>
            <p>Prueba otro filtro o un término de búsqueda distinto.</p>
          </div>
        )}
      </section>

      <Pagination
        page={currentPage}
        pageCount={pageCount}
        onChange={setPage}
        label="Paginación de proveedores"
      />

      {sheet ? (
        <ProviderDetail provider={sheet} onClose={() => setSheet(null)} />
      ) : null}
    </CollapsibleLayout>
  );
}
