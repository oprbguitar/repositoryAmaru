import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Info, Landmark } from "lucide-react";
import { Link } from "react-router-dom";
import { getCountryPanel } from "../observatory/api";
import { formatDate } from "../observatory/format";

export function CountryPanel({ code }: { code: string | null }) {
  const panel = useQuery({
    queryKey: ["country-panel", code],
    queryFn: () => getCountryPanel(code ?? ""),
    enabled: Boolean(code),
  });
  if (!code) {
    return (
      <aside className="context-panel scroll-region">
        <div className="context-title">
          <Info />
          <strong>Información contextual</strong>
        </div>
        <section>
          <h3>Selección</h3>
          <p>
            Selecciona un país en el mapa para revisar sus registros indexados y
            sus fuentes.
          </p>
        </section>
      </aside>
    );
  }
  const data = panel.data?.data;
  if (!data) {
    return (
      <aside className="context-panel scroll-region">
        <div className="context-title">
          <Info />
          <strong>Información contextual</strong>
        </div>
        <section>
          <p>{panel.isLoading ? "Consultando registros…" : "Sin datos."}</p>
        </section>
      </aside>
    );
  }
  return (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Landmark />
        <strong>{data.country.name}</strong>
      </div>
      <section>
        <h3>Registros indexados</h3>
        <dl className="context-facts">
          <dt>Papers</dt>
          <dd>
            <Link to="/research">{data.aggregate.papers}</Link>
          </dd>
          <dt>Proveedores</dt>
          <dd>
            <Link to="/providers">{data.aggregate.providers}</Link>
          </dd>
          <dt>Modelos</dt>
          <dd>
            <Link to="/models">{data.aggregate.models}</Link>
          </dd>
          <dt>Instituciones</dt>
          <dd>{data.aggregate.institutions}</dd>
          <dt>Noticias/registros</dt>
          <dd>{data.aggregate.news}</dd>
        </dl>
      </section>
      <section>
        <h3>
          Actividad reciente —{" "}
          <span className="state-badge provisional">
            {data.recentActivity30d.label}
          </span>
        </h3>
        <p>
          {data.recentActivity30d.records} registros en los últimos 30 días.{" "}
          {data.recentActivity30d.note}
        </p>
      </section>
      {data.institutions.length ? (
        <section>
          <h3>Instituciones más activas (OpenAlex)</h3>
          {data.institutions.slice(0, 6).map((institution) => (
            <p key={institution.name}>
              {institution.homepageUrl ? (
                <a
                  href={institution.homepageUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {institution.name} <ExternalLink className="inline-icon" />
                </a>
              ) : (
                institution.name
              )}
              {institution.city ? ` — ${institution.city}` : ""}
              {institution.worksCount
                ? ` · ${institution.worksCount.toLocaleString("es-PE")} trabajos`
                : ""}
            </p>
          ))}
        </section>
      ) : null}
      {data.recentPapers.length ? (
        <section>
          <h3>Papers recientes</h3>
          {data.recentPapers.slice(0, 5).map((paper) => (
            <p key={paper.url}>
              <a href={paper.url} target="_blank" rel="noreferrer">
                {paper.title}
              </a>
              <br />
              <small>
                {paper.sourceName} · {formatDate(paper.publishedAt)}
              </small>
            </p>
          ))}
        </section>
      ) : (
        <section>
          <h3>Papers recientes</h3>
          <p>
            Dentro de las fuentes actualmente indexadas no hay papers asociados
            a este país.
          </p>
        </section>
      )}
      <section>
        <h3>Fuentes</h3>
        <p>{data.sources.join(" · ")}</p>
      </section>
    </aside>
  );
}
