import { useQuery } from "@tanstack/react-query";
import { Bot, Building2, ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ObservatoryRecord, ProviderRecord } from "../../../types/api";
import { getProviders, getRecords } from "./api";
import {
  formatDate,
  formatPricePerMillion,
  missing,
  verificationLabel,
} from "./format";
import { ProviderDetail } from "./ProviderDetail";
import { RecordContext } from "./RecordContext";

export function CatalogPage({ mode }: { mode: "providers" | "models" }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ObservatoryRecord | null>(null);
  const [openProvider, setOpenProvider] = useState<ProviderRecord | null>(null);
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });
  const models = useQuery({
    queryKey: ["records", "models"],
    queryFn: () => getRecords({ kind: "model", limit: 200 }),
  });
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return (models.data?.data ?? []).filter(
      (model) =>
        !normalized ||
        model.title.toLocaleLowerCase("es").includes(normalized) ||
        model.sourceName.toLocaleLowerCase("es").includes(normalized),
    );
  }, [models.data, query]);
  const chosen = selected ?? filtered[0] ?? null;
  return (
    <div className="module-layout observatory-layout">
      <section className="module-main scroll-region">
        <header className="page-heading">
          <div>
            <h1>
              {mode === "providers" ? <Building2 /> : <Bot />}{" "}
              {mode === "providers" ? "Proveedores y modelos" : "Modelos"}
            </h1>
            <p>
              Catálogo recuperado desde fuentes públicas y APIs oficiales
              configuradas.
            </p>
          </div>
          <label className="module-search">
            <Search />
            <input
              aria-label="Buscar modelos"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar modelo…"
            />
          </label>
        </header>
        {mode === "providers" ? (
          <section
            className="provider-grid"
            aria-label="Directorio de proveedores"
          >
            {(providers.data?.data ?? []).map((provider) => (
              <article
                className={`panel provider-card${openProvider?.id === provider.id ? " selected" : ""}`}
                key={provider.id}
              >
                <div className="provider-card-title">
                  <span className="provider-monogram">
                    {provider.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h2>{provider.name}</h2>
                    <small>{provider.country ?? missing}</small>
                  </div>
                  <span
                    className={`state-badge ${provider.integrationStatus === "connected" ? "verified" : "not-configured"}`}
                  >
                    {provider.integrationStatus === "connected"
                      ? "Conectado"
                      : "Registrado"}
                  </span>
                </div>
                <div className="provider-metrics">
                  <span>
                    <strong>{provider.modelCount}</strong> modelos indexados
                  </span>
                  <span>
                    {provider.apiAvailable
                      ? "API disponible"
                      : "Descubrimiento automático no disponible"}
                  </span>
                </div>
                <p>{provider.categories.join(" · ") || missing}</p>
                <small>
                  Última sincronización:{" "}
                  {formatDate(provider.lastSuccessfulSync)}
                </small>
                <div className="provider-links">
                  {Object.entries(provider.links)
                    .filter((entry): entry is [string, string] =>
                      Boolean(entry[1]),
                    )
                    .slice(0, 5)
                    .map(([label, url]) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {label}
                        <ExternalLink />
                      </a>
                    ))}
                </div>
                {/* Stretched hit area: the whole card is clickable while the
                    control stays a real button for keyboard and screen readers. */}
                <button
                  type="button"
                  className="provider-card-select"
                  aria-expanded={openProvider?.id === provider.id}
                  onClick={() =>
                    setOpenProvider((current) =>
                      current?.id === provider.id ? null : provider,
                    )
                  }
                >
                  {openProvider?.id === provider.id
                    ? "Ocultar ficha ▴"
                    : `Ver ranking de uso y costo por token de ${provider.name}`}
                </button>
              </article>
            ))}
          </section>
        ) : null}
        {mode === "providers" && openProvider ? (
          <ProviderDetail
            provider={openProvider}
            onClose={() => setOpenProvider(null)}
          />
        ) : null}
        <section className="panel data-table-panel">
          <div className="panel-heading">
            <h2>Modelos indexados</h2>
            <span>{filtered.length} registros mostrados</span>
          </div>
          {filtered.length ? (
            <div className="data-table-scroll">
              <table className="observatory-table">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Proveedor / fuente</th>
                    <th>Modalidad</th>
                    <th>Contexto</th>
                    <th>Precio entrada / 1M</th>
                    <th>Precio salida / 1M</th>
                    <th>Tool calling</th>
                    <th>Local</th>
                    <th>Licencia</th>
                    <th>Estado</th>
                    <th>Verificación</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((model) => (
                    <tr
                      key={model.id}
                      className={chosen?.id === model.id ? "selected" : ""}
                      onClick={() => setSelected(model)}
                    >
                      <td>
                        <strong>{model.title}</strong>
                        <small>
                          {String(model.data.apiIdentifier ?? model.externalId)}
                        </small>
                      </td>
                      <td>{model.providerId ?? model.sourceName}</td>
                      <td>
                        {Array.isArray(model.data.architecture)
                          ? model.data.architecture.join(", ")
                          : typeof model.data.pipelineTag === "string"
                            ? model.data.pipelineTag
                            : missing}
                      </td>
                      <td>
                        {typeof model.data.contextLength === "number"
                          ? model.data.contextLength.toLocaleString("es-PE")
                          : missing}
                      </td>
                      <td>
                        {formatPricePerMillion(model.data.inputPricePerToken)}
                      </td>
                      <td>
                        {formatPricePerMillion(model.data.outputPricePerToken)}
                      </td>
                      <td>
                        {typeof model.data.toolCalling === "boolean"
                          ? model.data.toolCalling
                            ? "Sí"
                            : "No"
                          : missing}
                      </td>
                      <td>
                        {typeof model.data.localAvailability === "boolean"
                          ? model.data.localAvailability
                            ? "Sí"
                            : "No"
                          : missing}
                      </td>
                      <td>
                        {typeof model.data.license === "string" &&
                        model.data.license
                          ? model.data.license
                          : missing}
                      </td>
                      <td>
                        <span className="state-badge provisional">
                          {verificationLabel(model)}
                        </span>
                      </td>
                      <td>{formatDate(model.lastSuccessfulSyncAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="honest-empty">
              <h2>No hay modelos indexados</h2>
              <p>
                Ejecuta la sincronización pública desde Administración. No se
                mostrarán modelos inventados.
              </p>
            </div>
          )}
        </section>
      </section>
      <RecordContext record={chosen} />
    </div>
  );
}
