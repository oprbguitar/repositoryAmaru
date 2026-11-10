import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Server, Trophy, X } from "lucide-react";
import type { ProviderRecord } from "../../../types/api";
import { getProviderModels } from "./api";
import { CapabilityChips } from "./CapabilityTags";
import { formatDate, missing } from "./format";

function money(value: number | null | undefined): string {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 3,
      }).format(value)
    : missing;
}

/**
 * In-app provider sheet: the provider's own models ordered by the real-usage
 * ranking OpenRouter publishes, plus the models it hosts as an inference
 * endpoint — both with input/output cost per million tokens.
 */
export function ProviderDetail({
  provider,
  onClose,
}: {
  provider: ProviderRecord;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["provider-models", provider.id],
    queryFn: () => getProviderModels(provider.id),
  });
  const data = query.data?.data;
  const ranked = (data?.authored ?? []).filter((model) => model.usageRank);
  const unranked = (data?.authored ?? []).filter((model) => !model.usageRank);

  return (
    <section
      className="provider-detail panel"
      aria-label={`Modelos de ${provider.name}`}
    >
      <div className="panel-heading">
        <h2>
          <Trophy /> {provider.name} — modelos y costo por token
        </h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Cerrar ficha del proveedor"
        >
          <X />
        </button>
      </div>

      {query.isLoading ? (
        <p className="context-loading">Consultando modelos del proveedor…</p>
      ) : null}

      {data ? (
        <>
          <p className="provider-detail-note">{data.note}</p>

          {ranked.length ? (
            <div className="data-table-scroll">
              <table className="observatory-table compact-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Modelo</th>
                    <th>Categoría de uso</th>
                    <th>Para qué sirve</th>
                    <th>Contexto</th>
                    <th>Entrada / 1M</th>
                    <th>Salida / 1M</th>
                    <th>Hosts</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((model) => (
                    <tr key={model.modelExternalId}>
                      <td>#{model.usageRank?.position}</td>
                      <td>
                        <strong>{model.modelTitle}</strong>
                        <small>{model.modelExternalId}</small>
                      </td>
                      <td>{model.usageRank?.category}</td>
                      <td>
                        <CapabilityChips
                          tags={model.capabilities}
                          compact
                          max={3}
                        />
                      </td>
                      <td>
                        {model.contextLength
                          ? model.contextLength.toLocaleString("es-PE")
                          : missing}
                      </td>
                      <td>{money(model.inputPricePerMillion)}</td>
                      <td>{money(model.outputPricePerMillion)}</td>
                      <td>{model.hostCount || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="honest-empty">
              <h2>Sin ranking de uso para este proveedor</h2>
              <p>
                Ningún modelo de {provider.name} apareció en los rankings de uso
                real por categoría de la última sincronización.
              </p>
            </div>
          )}

          {unranked.length ? (
            <details className="provider-extra">
              <summary className="provider-extra-summary">
                {unranked.length} modelo(s) indexado(s) sin posición de uso
              </summary>
              <div className="data-table-scroll">
                <table className="observatory-table compact-table">
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th>Contexto</th>
                      <th>Entrada / 1M</th>
                      <th>Salida / 1M</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unranked.map((model) => (
                      <tr key={model.modelExternalId}>
                        <td>
                          <strong>{model.modelTitle}</strong>
                          <small>{model.modelExternalId}</small>
                        </td>
                        <td>
                          {model.contextLength
                            ? model.contextLength.toLocaleString("es-PE")
                            : missing}
                        </td>
                        <td>{money(model.inputPricePerMillion)}</td>
                        <td>{money(model.outputPricePerMillion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}

          {data.hosted.length ? (
            <div className="provider-hosted">
              <h3>
                <Server /> Modelos que {provider.name} aloja (
                {data.hosted.length})
              </h3>
              <div className="data-table-scroll">
                <table className="observatory-table compact-table">
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th>Entrada / 1M</th>
                      <th>Salida / 1M</th>
                      <th>Caché / 1M</th>
                      <th>Contexto</th>
                      <th>Cuantización</th>
                      <th>Verificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hosted.map((model) => (
                      <tr key={`${model.modelExternalId}-${model.verifiedAt}`}>
                        <td>
                          <strong>{model.modelTitle}</strong>
                          <small>{model.modelExternalId}</small>
                        </td>
                        <td>{money(model.inputPricePerMillion)}</td>
                        <td>{money(model.outputPricePerMillion)}</td>
                        <td>{money(model.cachedInputPricePerMillion)}</td>
                        <td>
                          {model.contextLength
                            ? model.contextLength.toLocaleString("es-PE")
                            : missing}
                        </td>
                        <td>{model.quantization ?? missing}</td>
                        <td>{formatDate(model.verifiedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="provider-links">
            {data.links.models ? (
              <a href={data.links.models} target="_blank" rel="noreferrer">
                Catálogo oficial <ExternalLink />
              </a>
            ) : null}
            {data.links.pricing ? (
              <a href={data.links.pricing} target="_blank" rel="noreferrer">
                Precios oficiales <ExternalLink />
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
