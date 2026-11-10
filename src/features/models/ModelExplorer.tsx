import { useQueries } from "@tanstack/react-query";
import { Compass, ExternalLink, ListOrdered, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DISTRIBUTION_LABELS,
  type Distribution,
  type HubModel,
  LOCAL_FORMATS,
} from "../../../lib/models/hub";
import {
  COUNTRY_REGIONS,
  countryName,
  REGION_LABELS,
} from "../../../lib/models/organizations";
import {
  RANKING_CRITERIA,
  type RankingCriterion,
  rankModels,
} from "../../../lib/models/ranking";
import {
  applyFilters,
  parseNeed,
  SIZE_LIMITS,
  type SizeLimit,
  SPECIALTIES,
  type SpecialtyId,
} from "../../../lib/models/specialties";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { FavoriteStar } from "../favorites/FavoriteStar";
import { useFavorites } from "../favorites/favorites";
import { getHubOverview, getSpecialtyPool, searchHub } from "./api";
import { ModelSheet } from "./ModelSheet";
import "./models-hub.css";
import {
  DistributionMark,
  EmptyState,
  fmtDate,
  fmtGb,
  LoadingRows,
  ModelIdentity,
} from "./shared";

type Origin = "official" | "community" | null;
const DISTRIBUTIONS: Distribution[] = ["open", "restricted", "derived", "api"];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * Need-based explorer over Hugging Face: free text is parsed into
 * specialties, size limit and distribution; filters combine; the pool is
 * ranked 1–10 with a declared criterion, and provenance is summarised.
 */
export function ModelExplorer({ onSwitch }: { onSwitch: () => void }) {
  const [need, setNeed] = useState("");
  const [specialties, setSpecialties] = useState<SpecialtyId[]>([
    "programacion",
  ]);
  const [maxGb, setMaxGb] = useState<SizeLimit | null>(null);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [origin, setOrigin] = useState<Origin>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [remainder, setRemainder] = useState("");
  const [criterion, setCriterion] = useState<RankingCriterion>("balanced");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const favorites = useFavorites().filter((f) => f.kind === "model");

  function applyNeed(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseNeed(need);
    setSpecialties(parsed.specialties);
    setMaxGb(parsed.maxGb);
    setLocalOnly(parsed.localOnly);
    setDistributions(parsed.distribution ? [parsed.distribution] : []);
    setRemainder(parsed.specialties.length ? "" : parsed.remainder);
    setSelectedId(null);
  }

  const queries = useQueries({
    queries: specialties.length
      ? specialties.map((id) => ({
          queryKey: ["model-hub", "specialty", id],
          queryFn: () => getSpecialtyPool(id),
          staleTime: 30 * 60 * 1000,
        }))
      : [
          {
            queryKey: ["model-hub", "search", remainder],
            queryFn: () =>
              remainder ? searchHub(remainder) : getHubOverview(),
            staleTime: 30 * 60 * 1000,
          },
        ],
  });
  const loading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error as Error | undefined;
  const payloads = queries.flatMap((q) => (q.data?.data ? [q.data.data] : []));

  const pool = useMemo(() => {
    const seen = new Map<string, HubModel>();
    for (const payload of payloads)
      for (const model of payload.models) seen.set(model.id, model);
    return [...seen.values()];
  }, [payloads]);

  const filtered = useMemo(
    () =>
      applyFilters(pool, {
        maxGb,
        distributions,
        localFormats: localOnly ? LOCAL_FORMATS : [],
        origin,
      }),
    [pool, maxGb, distributions, localOnly, origin],
  );
  const ranking = useMemo(
    () =>
      rankModels(
        filtered.models,
        specialties.length === 1 ? specialties[0] : null,
        criterion,
        10,
      ),
    [filtered.models, specialties, criterion],
  );

  // Provenance of the top 10: country and region of the publishing org.
  const provenance = useMemo(() => {
    const byCountry = new Map<string, number>();
    let unknown = 0;
    for (const { model } of ranking.entries) {
      const code = model.org?.country;
      if (code) byCountry.set(code, (byCountry.get(code) ?? 0) + 1);
      else unknown += 1;
    }
    const rows = [...byCountry.entries()]
      .map(([code, count]) => ({
        code,
        count,
        region: REGION_LABELS[COUNTRY_REGIONS[code]] ?? "Otra región",
      }))
      .sort((a, b) => b.count - a.count);
    return { rows, unknown };
  }, [ranking.entries]);

  const sources = payloads.flatMap((p) => p.sources);
  const fetchedAt = payloads[0]?.fetchedAt ?? null;
  const selected =
    ranking.entries.find((e) => e.model.id === selectedId)?.model ??
    ranking.entries[0]?.model ??
    null;
  const total = ranking.entries.length;

  const panel = selected ? (
    <ModelSheet model={selected} />
  ) : (
    <EmptyState title="Sin modelo seleccionado">
      Elige un modelo del ranking para ver su ficha técnica.
    </EmptyState>
  );

  return (
    <CollapsibleLayout storageKey="models-explorer" panel={panel}>
      <header className="page-heading">
        <div>
          <h1>
            <Compass aria-hidden /> Modelos — explorador por necesidad
          </h1>
          <p>
            Describe qué necesitas; combina especialidad, tamaño, distribución y
            procedencia. Datos en vivo de Hugging Face, sin puntuaciones
            inventadas.
          </p>
        </div>
        <button type="button" className="mh-btn" onClick={onSwitch}>
          <ListOrdered aria-hidden /> Rankings de APIs
        </button>
      </header>

      <form className="mh-need" onSubmit={applyNeed}>
        <Search aria-hidden />
        <input
          aria-label="Describe tu necesidad"
          value={need}
          onChange={(event) => setNeed(event.target.value)}
          placeholder="Ej.: programar en Python, local, menos de 5 GB, uso comercial"
        />
        <button type="submit" className="mh-btn mh-btn-primary">
          Interpretar
        </button>
      </form>

      {favorites.length ? (
        <nav className="mh-favorites" aria-label="Modelos favoritos">
          <span>★ Favoritos</span>
          {favorites.map((f) => (
            <a key={f.id} href={f.url ?? "#"} target="_blank" rel="noreferrer">
              {f.label}
            </a>
          ))}
        </nav>
      ) : null}
      <div className="mh-filters">
        <fieldset>
          <legend>Especialidad</legend>
          {SPECIALTIES.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.description}
              aria-pressed={specialties.includes(s.id)}
              onClick={() => setSpecialties((list) => toggle(list, s.id))}
            >
              {s.label}
            </button>
          ))}
        </fieldset>
        <fieldset>
          <legend>Tamaño</legend>
          {SIZE_LIMITS.map((limit) => (
            <button
              key={limit}
              type="button"
              aria-pressed={maxGb === limit}
              onClick={() => setMaxGb(maxGb === limit ? null : limit)}
            >
              ≤ {limit} GB
            </button>
          ))}
          <button
            type="button"
            aria-pressed={localOnly}
            onClick={() => setLocalOnly(!localOnly)}
          >
            Ejecutable local
          </button>
        </fieldset>
        <fieldset>
          <legend>Distribución</legend>
          {DISTRIBUTIONS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={distributions.includes(d)}
              onClick={() => setDistributions((list) => toggle(list, d))}
            >
              {DISTRIBUTION_LABELS[d]}
            </button>
          ))}
        </fieldset>
        <fieldset>
          <legend>Procedencia</legend>
          {(["official", "community"] as const).map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={origin === o}
              onClick={() => setOrigin(origin === o ? null : o)}
            >
              {o === "official" ? "Organización oficial" : "Comunidad"}
            </button>
          ))}
        </fieldset>
        <label className="mh-criterion">
          Criterio
          <select
            value={criterion}
            onChange={(event) =>
              setCriterion(event.target.value as RankingCriterion)
            }
          >
            {RANKING_CRITERIA.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <EmptyState title="No se pudo consultar Hugging Face">
          {error.message}
        </EmptyState>
      ) : loading ? (
        <LoadingRows label="Consultando Hugging Face…" />
      ) : total === 0 ? (
        <EmptyState title="Ningún modelo cumple estos filtros">
          Quita algún filtro o amplía el tamaño.
          {filtered.unknownSize
            ? ` ${filtered.unknownSize} modelos se excluyeron por no publicar su tamaño.`
            : ""}
        </EmptyState>
      ) : (
        <div className="mh-results">
          <section className="mh-ranking" aria-label="Ranking del 1 al 10">
            <header>
              <h2>
                Top {total} · {ranking.criterion.label}
              </h2>
              <p>
                {ranking.criterion.methodology} Grupo evaluado:{" "}
                {ranking.poolSize} modelos; {ranking.verifiable} con la señal
                necesaria.
                {ranking.short
                  ? " Menos de 10 verificables: no se rellena con datos supuestos."
                  : ""}
              </p>
            </header>
            <ol>
              {ranking.entries.map((entry, index) => (
                <li
                  key={entry.model.id}
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <button
                    type="button"
                    aria-pressed={selected?.id === entry.model.id}
                    onClick={() => setSelectedId(entry.model.id)}
                  >
                    <span className="mh-pos">{entry.position}</span>
                    <FavoriteStar
                      kind="model"
                      id={entry.model.id}
                      label={entry.model.name}
                      url={`https://huggingface.co/${entry.model.id}`}
                    />
                    <ModelIdentity model={entry.model} />
                    <span className="mh-meta">
                      <DistributionMark value={entry.model.distribution} />
                      <span className="mh-mono">
                        {fmtGb(entry.model.estimatedPackageBytes)}
                      </span>
                      <span>
                        {entry.model.org
                          ? countryName(entry.model.org.country)
                          : "Origen sin curar"}
                      </span>
                    </span>
                    <span className="mh-score">
                      <i
                        style={{
                          inlineSize: `${Math.round(entry.score * 100)}%`,
                        }}
                      />
                      <small className="mh-mono">{entry.display}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <aside className="mh-provenance" aria-label="Procedencia del top">
            <h2>Procedencia</h2>
            <p>País de la organización que publica cada modelo del top.</p>
            <ul>
              {provenance.rows.map((row) => (
                <li key={row.code}>
                  <span>
                    <strong>{countryName(row.code)}</strong>
                    <small>{row.region}</small>
                  </span>
                  <span className="mh-bar">
                    <i
                      style={{ inlineSize: `${(row.count / total) * 100}%` }}
                    />
                  </span>
                  <b className="mh-mono">{row.count}</b>
                </li>
              ))}
              {provenance.unknown ? (
                <li className="mh-muted">
                  <span>
                    <strong>Sin organización curada</strong>
                    <small>Cuentas de comunidad</small>
                  </span>
                  <span className="mh-bar">
                    <i
                      style={{
                        inlineSize: `${(provenance.unknown / total) * 100}%`,
                      }}
                    />
                  </span>
                  <b className="mh-mono">{provenance.unknown}</b>
                </li>
              ) : null}
            </ul>
            <footer>
              {fetchedAt ? <p>Consultado: {fmtDate(fetchedAt)}</p> : null}
              {sources.slice(0, 4).map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                  {s.label} <ExternalLink aria-hidden />
                </a>
              ))}
            </footer>
          </aside>
        </div>
      )}
    </CollapsibleLayout>
  );
}
