import { useQuery } from "@tanstack/react-query";
import { Bot, Compass, ExternalLink, Server, Tags, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { CapabilityTag, ModelRankingEntry } from "../../../types/api";
import { SyncActionButton } from "../../components/common/SyncActionButton";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { FavoriteButton, FavoriteStar } from "../favorites/FavoriteStar";
import { ModelExplorer } from "../models/ModelExplorer";
import {
  getModelDetail,
  getModelOfferings,
  getModelRankings,
  synchronize,
} from "./api";
import { CapabilityChips, CapabilityEvidenceList } from "./CapabilityTags";
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

type PriceSide = "input" | "output";
type PriceBand = "all" | "free" | "lt1" | "1to5" | "5to20" | "gt20";
const PRICE_BANDS: Array<{ id: PriceBand; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "free", label: "Gratis" },
  { id: "lt1", label: "< US$ 1" },
  { id: "1to5", label: "US$ 1–5" },
  { id: "5to20", label: "US$ 5–20" },
  { id: "gt20", label: "> US$ 20" },
];

/** Cheapest price per 1M tokens for one side, or null when unknown. */
function pricePerMillion(
  entry: ModelRankingEntry,
  side: PriceSide,
): number | null {
  const summary = entry.offeringSummary;
  const fromSummary =
    side === "input"
      ? summary?.minInputPerMillion
      : summary?.minOutputPerMillion;
  if (typeof fromSummary === "number" && Number.isFinite(fromSummary))
    return fromSummary;
  const raw = Number(
    side === "input" ? entry.inputPricePerToken : entry.outputPricePerToken,
  );
  return Number.isFinite(raw) ? raw * 1_000_000 : null;
}

function inBand(price: number | null, band: PriceBand): boolean {
  if (band === "all") return true;
  if (price === null) return false;
  if (band === "free") return price === 0;
  if (band === "lt1") return price > 0 && price < 1;
  if (band === "1to5") return price >= 1 && price <= 5;
  if (band === "5to20") return price > 5 && price <= 20;
  return price > 20;
}

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

/**
 * Context panel for the selected model: what it is good for (evidence-backed
 * tags), which providers host it, and the price each one charges per million
 * input/output tokens — all inside the app, no external lookup needed.
 */
function ModelContextPanel({
  entry,
  tabLabel,
  onOpenDrawer,
  onSelectTag,
  activeTagId,
}: {
  entry: ModelRankingEntry | null;
  tabLabel: string;
  onOpenDrawer: () => void;
  onSelectTag: (tag: CapabilityTag) => void;
  activeTagId: string | null;
}) {
  const detail = useQuery({
    queryKey: ["model-detail", entry?.modelExternalId],
    queryFn: () => getModelDetail(entry?.modelExternalId ?? ""),
    enabled: Boolean(entry),
  });

  if (!entry) {
    return (
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
  }

  const data = detail.data?.data;
  const hosts = data?.offerings ?? [];

  return (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Bot />
        <strong>Información contextual</strong>
      </div>
      <section>
        <h2 className="context-record-title">{entry.modelTitle}</h2>
        <FavoriteButton
          kind="model"
          id={entry.modelExternalId}
          label={entry.modelTitle}
          url={entry.url}
        />
        <p>{entry.summary ?? missing}</p>
      </section>

      <section>
        <h3>
          <Tags /> Para qué sirve
        </h3>
        {data?.primaryUse ? (
          <p className="primary-use">{data.primaryUse}</p>
        ) : null}
        <CapabilityChips
          tags={data?.capabilities ?? entry.capabilities}
          onSelect={onSelectTag}
          activeTagId={activeTagId}
        />
        {detail.isLoading ? (
          <p className="context-loading">Consultando ficha del modelo…</p>
        ) : (
          <CapabilityEvidenceList
            tags={data?.capabilities ?? entry.capabilities}
          />
        )}
      </section>

      <section>
        <h3>
          <Server /> Proveedores que alojan este modelo
        </h3>
        {hosts.length ? (
          <>
            <div className="host-list">
              {hosts.map((offering) => (
                <article className="host-row" key={offering.providerName}>
                  <div className="host-row-title">
                    <strong>{offering.providerName}</strong>
                    {offering.quantization ? (
                      <span className="state-badge provisional">
                        {offering.quantization}
                      </span>
                    ) : null}
                  </div>
                  <dl className="host-prices">
                    <div>
                      <dt>Entrada / 1M</dt>
                      <dd>{money(offering.inputPricePerMillion)}</dd>
                    </div>
                    <div>
                      <dt>Salida / 1M</dt>
                      <dd>{money(offering.outputPricePerMillion)}</dd>
                    </div>
                    {offering.cachedInputPricePerMillion !== null ? (
                      <div>
                        <dt>Caché / 1M</dt>
                        <dd>{money(offering.cachedInputPricePerMillion)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <small className="host-row-meta">
                    {offering.contextLength
                      ? `${offering.contextLength.toLocaleString("es-PE")} tokens · `
                      : ""}
                    {offering.pricingSourceName} ·{" "}
                    {formatDate(offering.verifiedAt)}
                  </small>
                </article>
              ))}
            </div>
            <button
              type="button"
              className="secondary-button compact"
              onClick={onOpenDrawer}
            >
              Comparar en tabla
            </button>
          </>
        ) : (
          <p className="capability-empty">
            {data?.offeringsNote ??
              "Todavía no hay proveedores indexados para este modelo."}
          </p>
        )}
      </section>

      <section>
        <h3>Ranking</h3>
        <dl className="context-facts">
          <dt>Posición</dt>
          <dd>#{entry.position}</dd>
          <dt>Categoría</dt>
          <dd>{tabLabel}</dd>
          <dt>Fuente</dt>
          <dd>{entry.sourceName}</dd>
          <dt>Fecha</dt>
          <dd>{formatDate(entry.rankingDate)}</dd>
          {entry.score !== null ? (
            <>
              <dt>Valor</dt>
              <dd>
                {entry.scoreUnit === "usd_per_million_input"
                  ? money(entry.score)
                  : entry.scoreUnit === "tokens"
                    ? entry.score.toLocaleString("es-PE")
                    : String(entry.score)}
              </dd>
            </>
          ) : null}
        </dl>
        {data?.rankings.length ? (
          <ul className="ranking-membership">
            {data.rankings.map((membership) => (
              <li key={`${membership.rankingType}-${membership.rankingDate}`}>
                <strong>#{membership.position}</strong> {membership.label}
                <small className="ranking-membership-date">
                  {formatDate(membership.rankingDate)}
                </small>
              </li>
            ))}
          </ul>
        ) : null}
        <p>{entry.methodology}</p>
        {entry.methodologyUrl ? (
          <a
            className="source-link-button"
            href={entry.methodologyUrl}
            target="_blank"
            rel="noreferrer"
          >
            Metodología de la fuente <ExternalLink />
          </a>
        ) : null}
      </section>

      <section>
        <h3>Contexto y precios del catálogo</h3>
        <dl className="context-facts">
          <dt>Contexto</dt>
          <dd>
            {entry.contextLength
              ? `${entry.contextLength.toLocaleString("es-PE")} tokens`
              : missing}
          </dd>
          <dt>Entrada / 1M</dt>
          <dd>{formatPricePerMillion(entry.inputPricePerToken)}</dd>
          <dt>Salida / 1M</dt>
          <dd>{formatPricePerMillion(entry.outputPricePerToken)}</dd>
          <dt>Proveedores</dt>
          <dd>{entry.offeringSummary?.providers ?? 0}</dd>
        </dl>
      </section>

      {entry.url ? (
        <section>
          <h3>Fuentes</h3>
          <a
            className="source-link-button"
            href={entry.url}
            target="_blank"
            rel="noreferrer"
          >
            Abrir fuente original <ExternalLink />
          </a>
        </section>
      ) : null}
    </aside>
  );
}

function ApiRankingsView({ onSwitch }: { onSwitch: () => void }) {
  const [tab, setTab] = useState("category-programming");
  const [selected, setSelected] = useState<ModelRankingEntry | null>(null);
  const [drawer, setDrawer] = useState<ModelRankingEntry | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [priceSide, setPriceSide] = useState<PriceSide>("input");
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [priceSort, setPriceSort] = useState<"rank" | "asc" | "desc">("rank");
  const rankings = useQuery({
    queryKey: ["model-rankings", tab],
    queryFn: () => getModelRankings(tab),
  });
  const data = rankings.data?.data;

  // Tag vocabulary available in the current ranking, for tag-based search.
  const availableTags = useMemo(() => {
    const byId = new Map<string, { tag: CapabilityTag; count: number }>();
    for (const entry of data?.entries ?? []) {
      for (const tag of entry.capabilities ?? []) {
        const current = byId.get(tag.id);
        if (current) current.count += 1;
        else byId.set(tag.id, { tag, count: 1 });
      }
    }
    return [...byId.values()].sort((left, right) => right.count - left.count);
  }, [data]);

  const entries = useMemo(() => {
    const all = (data?.entries ?? []).filter(
      (entry) =>
        (!tagFilter ||
          (entry.capabilities ?? []).some((tag) => tag.id === tagFilter)) &&
        inBand(pricePerMillion(entry, priceSide), priceBand),
    );
    if (priceSort === "rank") return all;
    return [...all].sort((a, b) => {
      const pa = pricePerMillion(a, priceSide) ?? Number.POSITIVE_INFINITY;
      const pb = pricePerMillion(b, priceSide) ?? Number.POSITIVE_INFINITY;
      return priceSort === "asc" ? pa - pb : pb - pa;
    });
  }, [data, tagFilter, priceSide, priceBand, priceSort]);

  const chosen =
    entries.find(
      (entry) => entry.modelExternalId === selected?.modelExternalId,
    ) ??
    entries[0] ??
    null;

  async function runSync() {
    setSyncing(true);
    try {
      await synchronize("models");
      await rankings.refetch();
    } finally {
      setSyncing(false);
    }
  }

  const tabLabel = RANKING_TABS.find((entry) => entry.id === tab)?.label ?? tab;

  const panel = (
    <ModelContextPanel
      entry={chosen}
      tabLabel={tabLabel}
      onOpenDrawer={() => chosen && setDrawer(chosen)}
      onSelectTag={(tag) =>
        setTagFilter((current) => (current === tag.id ? null : tag.id))
      }
      activeTagId={tagFilter}
    />
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
        <button type="button" className="mh-btn" onClick={onSwitch}>
          <Compass aria-hidden /> Explorador por necesidad
        </button>
        <SyncActionButton
          label="Sincronizar modelos"
          busy={syncing}
          onClick={runSync}
        />
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
      <section className="price-filter-bar" aria-label="Filtrar por precio">
        <span>Precio por 1M tokens de</span>
        <select
          aria-label="Tipo de precio"
          value={priceSide}
          onChange={(event) => setPriceSide(event.target.value as PriceSide)}
        >
          <option value="input">entrada</option>
          <option value="output">salida</option>
        </select>
        {PRICE_BANDS.map((band) => (
          <button
            key={band.id}
            type="button"
            aria-pressed={priceBand === band.id}
            onClick={() => setPriceBand(band.id)}
          >
            {band.label}
          </button>
        ))}
        <select
          aria-label="Ordenar por precio"
          value={priceSort}
          onChange={(event) =>
            setPriceSort(event.target.value as "rank" | "asc" | "desc")
          }
        >
          <option value="rank">Orden del ranking</option>
          <option value="asc">Más barato primero</option>
          <option value="desc">Más caro primero</option>
        </select>
      </section>
      {availableTags.length ? (
        <section className="tag-filter-bar" aria-label="Filtrar por etiqueta">
          <span className="tag-filter-label">
            <Tags /> Etiquetas
          </span>
          <ul className="capability-chips compact">
            {availableTags.map(({ tag, count }) => (
              <li key={tag.id}>
                <button
                  type="button"
                  className={`capability-chip group-${tag.group}${tagFilter === tag.id ? " active" : ""}`}
                  title={tag.evidence}
                  aria-pressed={tagFilter === tag.id}
                  onClick={() =>
                    setTagFilter((current) =>
                      current === tag.id ? null : tag.id,
                    )
                  }
                >
                  {tag.label} <em>{count}</em>
                </button>
              </li>
            ))}
          </ul>
          {tagFilter ? (
            <button
              type="button"
              className="tag-filter-reset"
              onClick={() => setTagFilter(null)}
            >
              Quitar filtro
            </button>
          ) : null}
        </section>
      ) : null}
      {data && !data.available ? (
        <div className="panel honest-empty">
          <h2>Ranking no disponible</h2>
          <p>{data.reason}</p>
        </div>
      ) : (
        <section className="panel data-table-panel">
          <div className="panel-heading">
            <h2>{tabLabel}</h2>
            <span>
              {data?.rankingDate
                ? `Fuente: OpenRouter · ${formatDate(data.rankingDate)}`
                : "Sin sincronizar"}
              {tagFilter
                ? ` · ${entries.length} de ${data?.entries.length ?? 0} por etiqueta`
                : ""}
            </span>
          </div>
          {entries.length ? (
            <div className="data-table-scroll">
              <table className="observatory-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>
                      <span className="sr-only">Favorito</span>
                    </th>
                    <th>Modelo</th>
                    <th>Para qué sirve</th>
                    <th>Contexto</th>
                    <th>Entrada / 1M (mín.)</th>
                    <th>Salida / 1M (mín.)</th>
                    <th>Proveedores</th>
                    <th>Rango de precios</th>
                    <th>Verificación</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
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
                        <FavoriteStar
                          kind="model"
                          id={entry.modelExternalId}
                          label={entry.modelTitle}
                          url={entry.url}
                        />
                      </td>
                      <td>
                        <strong>{entry.modelTitle}</strong>
                        <small>{entry.modelExternalId}</small>
                      </td>
                      <td>
                        <CapabilityChips
                          tags={entry.capabilities ?? []}
                          compact
                          max={3}
                        />
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
              <h2>
                {tagFilter
                  ? "Ningún modelo del ranking tiene esa etiqueta"
                  : "Sin ranking sincronizado"}
              </h2>
              <p>
                {tagFilter
                  ? "Quita el filtro o elige otra etiqueta. Las etiquetas se derivan de los campos publicados por la fuente."
                  : "Ejecuta «Sincronizar modelos» para obtener el catálogo y los rankings reales de OpenRouter. No se muestran posiciones inventadas."}
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

export function ModelsRankingPage() {
  const [mode, setMode] = useState<"explorer" | "api">("explorer");
  return mode === "explorer" ? (
    <ModelExplorer onSwitch={() => setMode("api")} />
  ) : (
    <ApiRankingsView onSwitch={() => setMode("explorer")} />
  );
}
