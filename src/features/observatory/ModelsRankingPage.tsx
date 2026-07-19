import { useQuery } from "@tanstack/react-query";
import { Bot, ExternalLink, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import type { ModelRankingEntry } from "../../../types/api";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { getModelOfferings, getModelRankings, synchronize } from "./api";
import {
  formatDate,
  formatNumber,
  formatPricePerMillion,
  missing,
} from "./format";

const RANKING_TABS: Array<{ id: string; label: string }> = [
  { id: "category-programming", label: "Programación (uso real)" },
  { id: "category-technology", label: "Tecnología (uso real)" },
  { id: "category-science", label: "Ciencia (uso real)" },
  { id: "category-translation", label: "Traducción (uso real)" },
  { id: "newest", label: "Nuevos" },
  { id: "pricing-low", label: "Menor precio" },
  { id: "context-high", label: "Mayor contexto" },
  { id: "open-local", label: "Open y local" },
  { id: "free-api", label: "API gratuita" },
  { id: "multimodal", label: "Multimodales" },
  { id: "top-weekly", label: "Más utilizados (global)" },
  { id: "intelligence", label: "Inteligencia" },
];

function money(value: number | null | undefined): string {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 3,
      }).format(value)
    : missing;
}

function OfferingsDrawer({
  entry,
  onClose,
}: {
  entry: ModelRankingEntry;
  onClose: () => void;
}) {
  const offerings = useQuery({
    queryKey: ["offerings", entry.modelExternalId],
    queryFn: () => getModelOfferings(entry.modelExternalId),
  });
  const rows = offerings.data?.data ?? [];
  return (
    <div
      className="offerings-drawer panel"
      role="dialog"
      aria-label="Precios por proveedor"
    >
      <div className="panel-heading">
        <h2>{entry.modelTitle} — precios por proveedor</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X />
        </button>
      </div>
      {rows.length ? (
        <div className="data-table-scroll">
          <table className="observatory-table compact-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Entrada / 1M</th>
                <th>Salida / 1M</th>
                <th>Caché / 1M</th>
                <th>Contexto</th>
                <th>Cuantización</th>
                <th>Fuente</th>
                <th>Verificado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((offering) => (
                <tr key={offering.providerName}>
                  <td>
                    <strong>{offering.providerName}</strong>
                    <small>{offering.providerModelIdentifier ?? ""}</small>
                  </td>
                  <td>{money(offering.inputPricePerMillion)}</td>
                  <td>{money(offering.outputPricePerMillion)}</td>
                  <td>{money(offering.cachedInputPricePerMillion)}</td>
                  <td>
                    {offering.contextLength
                      ? offering.contextLength.toLocaleString("es-PE")
                      : missing}
                  </td>
                  <td>{offering.quantization ?? missing}</td>
                  <td>{offering.pricingSourceName}</td>
                  <td>{formatDate(offering.verifiedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="honest-empty">
          <h2>Sin ofertas indexadas para este modelo</h2>
          <p>
            Las ofertas por proveedor se indexan para los modelos mejor
            posicionados en cada sincronización. Sincroniza modelos o selecciona
            un modelo del ranking principal.
          </p>
        </div>
      )}
    </div>
  );
}

export function ModelsRankingPage() {
  const [tab, setTab] = useState("category-programming");
  const [selected, setSelected] = useState<ModelRankingEntry | null>(null);
  const [drawer, setDrawer] = useState<ModelRankingEntry | null>(null);
  const [syncing, setSyncing] = useState(false);
  const rankings = useQuery({
    queryKey: ["model-rankings", tab],
    queryFn: () => getModelRankings(tab),
  });
  const data = rankings.data?.data;
  const chosen = selected ?? data?.entries[0] ?? null;

  async function runSync() {
    setSyncing(true);
    try {
      await synchronize("models");
      await rankings.refetch();
    } finally {
      setSyncing(false);
    }
  }

  const panel = chosen ? (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Bot />
        <strong>Información contextual</strong>
      </div>
      <section>
        <h2 className="context-record-title">{chosen.modelTitle}</h2>
        <p>{chosen.summary ?? missing}</p>
      </section>
      <section>
        <h3>Ranking</h3>
        <dl className="context-facts">
          <dt>Posición</dt>
          <dd>#{chosen.position}</dd>
          <dt>Categoría</dt>
          <dd>
            {RANKING_TABS.find((entry) => entry.id === tab)?.label ?? tab}
          </dd>
          <dt>Fuente</dt>
          <dd>{chosen.sourceName}</dd>
          <dt>Fecha</dt>
          <dd>{formatDate(chosen.rankingDate)}</dd>
          {chosen.score !== null ? (
            <>
              <dt>Valor</dt>
              <dd>
                {chosen.scoreUnit === "usd_per_million_input"
                  ? money(chosen.score)
                  : chosen.scoreUnit === "tokens"
                    ? chosen.score.toLocaleString("es-PE")
                    : String(chosen.score)}
              </dd>
            </>
          ) : null}
        </dl>
        <p>{chosen.methodology}</p>
        {chosen.methodologyUrl ? (
          <a
            className="source-link-button"
            href={chosen.methodologyUrl}
            target="_blank"
            rel="noreferrer"
          >
            Metodología de la fuente <ExternalLink />
          </a>
        ) : null}
      </section>
      <section>
        <h3>Contexto y precios</h3>
        <dl className="context-facts">
          <dt>Contexto</dt>
          <dd>
            {chosen.contextLength
              ? `${chosen.contextLength.toLocaleString("es-PE")} tokens`
              : missing}
          </dd>
          <dt>Entrada / 1M</dt>
          <dd>{formatPricePerMillion(chosen.inputPricePerToken)}</dd>
          <dt>Salida / 1M</dt>
          <dd>{formatPricePerMillion(chosen.outputPricePerToken)}</dd>
          <dt>Proveedores</dt>
          <dd>{chosen.offeringSummary?.providers ?? 0}</dd>
        </dl>
        <button
          type="button"
          className="secondary-button compact"
          onClick={() => setDrawer(chosen)}
        >
          Comparar proveedores
        </button>
      </section>
      {chosen.url ? (
        <section>
          <h3>Fuentes</h3>
          <a
            className="source-link-button"
            href={chosen.url}
            target="_blank"
            rel="noreferrer"
          >
            Abrir fuente original <ExternalLink />
          </a>
        </section>
      ) : null}
    </aside>
  ) : (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Bot />
        <strong>Información contextual</strong>
      </div>
      <section>
        <p>Selecciona un modelo para revisar procedencia y precios.</p>
      </section>
    </aside>
  );

  return (
    <CollapsibleLayout storageKey="models" panel={panel}>
      <header className="page-heading">
        <div>
          <h1>
            <Bot /> Modelos — rankings con procedencia
          </h1>
          <p>
            Cada ranking indica fuente, fecha y metodología. Sin puntuaciones
            inventadas.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button compact"
          onClick={runSync}
          disabled={syncing}
        >
          <RefreshCw className={syncing ? "spin" : ""} /> Sincronizar modelos
        </button>
      </header>
      <div className="ranking-tabs" role="tablist">
        {RANKING_TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={tab === entry.id ? "active" : ""}
            onClick={() => {
              setTab(entry.id);
              setSelected(null);
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {data && !data.available ? (
        <div className="panel honest-empty">
          <h2>Ranking no disponible</h2>
          <p>{data.reason}</p>
        </div>
      ) : (
        <section className="panel data-table-panel">
          <div className="panel-heading">
            <h2>
              {RANKING_TABS.find((entry) => entry.id === tab)?.label ?? tab}
            </h2>
            <span>
              {data?.rankingDate
                ? `Fuente: OpenRouter · ${formatDate(data.rankingDate)}`
                : "Sin sincronizar"}
            </span>
          </div>
          {data?.entries.length ? (
            <div className="data-table-scroll">
              <table className="observatory-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Modelo</th>
                    <th>Contexto</th>
                    <th>Entrada / 1M (mín.)</th>
                    <th>Salida / 1M (mín.)</th>
                    <th>Proveedores</th>
                    <th>Rango de precios</th>
                    <th>Verificación</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr
                      key={entry.modelExternalId}
                      className={
                        chosen?.modelExternalId === entry.modelExternalId
                          ? "selected"
                          : ""
                      }
                      onClick={() => setSelected(entry)}
                    >
                      <td>{entry.position}</td>
                      <td>
                        <strong>{entry.modelTitle}</strong>
                        <small>{entry.modelExternalId}</small>
                      </td>
                      <td>
                        {entry.contextLength
                          ? formatNumber(entry.contextLength)
                          : missing}
                      </td>
                      <td>
                        {entry.offeringSummary
                          ? money(entry.offeringSummary.minInputPerMillion)
                          : formatPricePerMillion(entry.inputPricePerToken)}
                      </td>
                      <td>
                        {entry.offeringSummary
                          ? money(entry.offeringSummary.minOutputPerMillion)
                          : formatPricePerMillion(entry.outputPricePerToken)}
                      </td>
                      <td>{entry.offeringSummary?.providers ?? "—"}</td>
                      <td>
                        {entry.offeringSummary &&
                        entry.offeringSummary.providers > 1
                          ? `${money(entry.offeringSummary.minInputPerMillion)} – ${money(entry.offeringSummary.maxInputPerMillion)}`
                          : "—"}
                      </td>
                      <td>
                        {entry.offeringSummary
                          ? formatDate(entry.offeringSummary.verifiedAt)
                          : formatDate(entry.rankingDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="honest-empty">
              <h2>Sin ranking sincronizado</h2>
              <p>
                Ejecuta «Sincronizar modelos» para obtener el catálogo y los
                rankings reales de OpenRouter. No se muestran posiciones
                inventadas.
              </p>
            </div>
          )}
        </section>
      )}
      {drawer ? (
        <OfferingsDrawer entry={drawer} onClose={() => setDrawer(null)} />
      ) : null}
    </CollapsibleLayout>
  );
}
