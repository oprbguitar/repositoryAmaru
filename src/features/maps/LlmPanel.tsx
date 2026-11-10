import { ExternalLink, Info, Landmark } from "lucide-react";
import { formatDate } from "../observatory/format";
import {
  dominantTrait,
  type LlmOrgStats,
  type LlmOriginsResponse,
  openShare,
  pct,
  TRAIT_LABELS,
  type TraitKey,
} from "./llmModel";

function TraitBars({
  entry,
}: {
  entry: {
    traitSample: number;
    traits: Record<TraitKey, number>;
  };
}) {
  if (entry.traitSample === 0)
    return <p>Sin parámetros publicados (solo OpenRouter los expone).</p>;
  return (
    <ul className="lm-bars">
      {(Object.keys(TRAIT_LABELS) as TraitKey[]).map((key) => {
        const share = entry.traits[key] / entry.traitSample;
        return (
          <li key={key}>
            <span>{TRAIT_LABELS[key]}</span>
            <i
              style={{ inlineSize: pct(share) }}
              data-trait={key}
              aria-hidden="true"
            />
            <b>
              {entry.traits[key]}/{entry.traitSample}
            </b>
          </li>
        );
      })}
    </ul>
  );
}

export function LlmPanel({
  data,
  org,
  onSelect,
}: {
  data: LlmOriginsResponse | undefined;
  org: LlmOrgStats | null;
  onSelect: (id: string) => void;
}) {
  if (!data) {
    return (
      <aside className="context-panel scroll-region">
        <div className="context-title">
          <Info />
          <strong>Información contextual</strong>
        </div>
        <section>
          <p>Cargando organizaciones…</p>
        </section>
      </aside>
    );
  }
  if (!org) {
    return (
      <aside className="context-panel scroll-region">
        <div className="context-title">
          <Info />
          <strong>Origen por país</strong>
        </div>
        <section>
          <p>
            Selecciona una organización en el mapa para ver qué modelos publicó,
            si son abiertos y qué técnicas usa.
          </p>
        </section>
        <section>
          <h3>Países con más modelos</h3>
          <ul className="lm-rank">
            {data.countries.slice(0, 10).map((country) => {
              const first = data.orgs.find(
                (o) => o.countryCode === country.countryCode,
              );
              const share = openShare(country);
              return (
                <li key={country.countryCode}>
                  <button
                    type="button"
                    onClick={() => first && onSelect(first.id)}
                  >
                    <span>{country.name}</span>
                    <small>
                      {country.orgs} org. · {country.models} modelos ·{" "}
                      {share === null
                        ? "apertura s/d"
                        : `${pct(share)} abiertos`}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <section>
          <h3>Cómo se calcula</h3>
          {data.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
          <p>
            No atribuidos a ningún país: {data.totals.unmappedModels} registros
            de autores fuera del registro.
          </p>
        </section>
      </aside>
    );
  }
  const share = openShare(org);
  const trait = dominantTrait(org);
  return (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Landmark />
        <strong>{org.name}</strong>
      </div>
      <section>
        <h3>Origen</h3>
        <dl className="context-facts">
          <dt>Sede</dt>
          <dd>
            {org.city}, {org.countryName}
          </dd>
          <dt>Modelos</dt>
          <dd>{org.models}</dd>
          <dt>Familias</dt>
          <dd>{org.families}</dd>
          <dt>Abiertos</dt>
          <dd>
            {share === null
              ? "sin dato"
              : `${org.open} de ${org.open + org.closed} (${pct(share)})`}
          </dd>
        </dl>
        <p>
          <a href={org.sourceUrl} target="_blank" rel="noreferrer">
            Fuente de la sede <ExternalLink className="inline-icon" />
          </a>{" "}
          · verificada {formatDate(data.registryVerifiedAt)}
        </p>
        {org.provider ? (
          <p>
            Proveedor en la base local: {org.provider.name} (
            {org.provider.country ?? "país no registrado"}){" "}
            {org.provider.consistent
              ? "— coincide"
              : "— no coincide con la sede"}
          </p>
        ) : null}
      </section>
      <section>
        <h3>Tendencias técnicas</h3>
        <TraitBars entry={org} />
        {trait ? (
          <p>
            Rasgo más frecuente: <strong>{TRAIT_LABELS[trait]}</strong>.
          </p>
        ) : null}
      </section>
      <section>
        <h3>Familias principales</h3>
        <p>
          {org.topFamilies.map((f) => `${f.name} (${f.models})`).join(" · ")}
        </p>
      </section>
      <section>
        <h3>Modelos de ejemplo</h3>
        {org.sampleModels.map((model) => (
          <p key={model.title}>
            <a href={model.url} target="_blank" rel="noreferrer">
              {model.title}
            </a>{" "}
            <small>
              {model.open === true
                ? "abierto"
                : model.open === false
                  ? "cerrado"
                  : "sin clasificar"}
            </small>
          </p>
        ))}
      </section>
    </aside>
  );
}
