import { useQuery } from "@tanstack/react-query";
import { ExternalLink, GitFork, Star } from "lucide-react";
import { useState } from "react";
import type { GithubRankingEntry } from "../../../types/api";
import { SyncActionButton } from "../../components/common/SyncActionButton";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { getGithubRankings, synchronize } from "./api";
import { formatDate, formatNumber, missing } from "./format";

const VIEWS: Array<{ id: string; label: string }> = [
  { id: "stars", label: "Más estrellas" },
  { id: "growth", label: "Mayor crecimiento" },
  { id: "active", label: "Más activos" },
  { id: "new", label: "Nuevos" },
  { id: "open-local", label: "Open y local" },
  { id: "rag", label: "RAG" },
  { id: "agents", label: "Agentes" },
  { id: "audio", label: "Audio" },
  { id: "vision", label: "Visión" },
  { id: "peru-latam", label: "Perú y LATAM" },
];

export function GitHubPage() {
  const [view, setView] = useState("stars");
  const [selected, setSelected] = useState<GithubRankingEntry | null>(null);
  const [syncing, setSyncing] = useState(false);
  const rankings = useQuery({
    queryKey: ["github-rankings", view],
    queryFn: () => getGithubRankings(view),
  });
  const data = rankings.data?.data;
  const chosen = selected ?? data?.entries[0] ?? null;

  async function runSync() {
    setSyncing(true);
    try {
      await synchronize("github");
      await rankings.refetch();
    } finally {
      setSyncing(false);
    }
  }

  const panel = chosen ? (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <GitFork />
        <strong>Información contextual</strong>
      </div>
      <section>
        <h2 className="context-record-title">{chosen.fullName}</h2>
        <p>{chosen.description ?? missing}</p>
        <small className="coverage-note">
          Resumen automático basado en la descripción del repositorio
        </small>
      </section>
      <section>
        <h3>Métricas</h3>
        <dl className="context-facts">
          <dt>Estrellas</dt>
          <dd>{formatNumber(chosen.stars)}</dd>
          <dt>Forks</dt>
          <dd>{formatNumber(chosen.forks)}</dd>
          <dt>Issues abiertas</dt>
          <dd>{formatNumber(chosen.openIssues)}</dd>
          <dt>Lenguaje</dt>
          <dd>{chosen.language ?? missing}</dd>
          <dt>Licencia</dt>
          <dd>{chosen.license ?? missing}</dd>
          <dt>Último push</dt>
          <dd>{formatDate(chosen.pushedAt)}</dd>
          <dt>Creado</dt>
          <dd>{formatDate(chosen.createdAt)}</dd>
        </dl>
      </section>
      {chosen.topics.length ? (
        <section>
          <h3>Topics</h3>
          <p>{chosen.topics.slice(0, 12).join(" · ")}</p>
        </section>
      ) : null}
      <section>
        <h3>Fuentes</h3>
        <a
          className="source-link-button"
          href={chosen.url}
          target="_blank"
          rel="noreferrer"
        >
          Abrir repositorio <ExternalLink />
        </a>
        <p>
          {chosen.sourceName} · recuperado {formatDate(chosen.retrievedAt)}
        </p>
      </section>
    </aside>
  ) : (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <GitFork />
        <strong>Información contextual</strong>
      </div>
      <section>
        <p>Selecciona un repositorio para revisar sus métricas y fuentes.</p>
      </section>
    </aside>
  );

  return (
    <CollapsibleLayout storageKey="github" panel={panel}>
      <header className="page-heading">
        <div>
          <h1>
            <GitFork /> GitHub — repositorios de IA
          </h1>
          <p>
            Ranking por estrellas obtenido de GitHub REST (sort=stars). El
            crecimiento requiere al menos dos snapshots en fechas distintas.
          </p>
        </div>
        <SyncActionButton
          label="Sincronizar GitHub"
          busy={syncing}
          onClick={runSync}
        />
      </header>
      <div className="ranking-tabs" role="tablist">
        {VIEWS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={view === entry.id}
            className={view === entry.id ? "active" : ""}
            onClick={() => {
              setView(entry.id);
              setSelected(null);
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <section className="panel data-table-panel">
        <div className="panel-heading">
          <h2>{VIEWS.find((entry) => entry.id === view)?.label}</h2>
          <span>{data?.entries.length ?? 0} repositorios</span>
        </div>
        {data?.entries.length ? (
          <div className="data-table-scroll">
            <table className="observatory-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Repositorio</th>
                  <th>Estrellas</th>
                  {view === "growth" ? <th>Crecimiento</th> : null}
                  <th>Forks</th>
                  <th>Lenguaje</th>
                  <th>Licencia</th>
                  <th>Último push</th>
                  <th>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={chosen?.id === entry.id ? "selected" : ""}
                    onClick={() => setSelected(entry)}
                  >
                    <td>{entry.rank}</td>
                    <td>
                      <strong>{entry.fullName}</strong>
                      <small>{entry.description ?? missing}</small>
                    </td>
                    <td>
                      <Star /> {formatNumber(entry.stars)}
                    </td>
                    {view === "growth" ? (
                      <td>
                        {entry.growth
                          ? `+${formatNumber(entry.growth.starGrowth)} (${formatDate(entry.growth.periodStart)} → ${formatDate(entry.growth.periodEnd)})`
                          : "Crecimiento todavía no calculable"}
                      </td>
                    ) : null}
                    <td>{formatNumber(entry.forks)}</td>
                    <td>{entry.language ?? missing}</td>
                    <td>{entry.license ?? missing}</td>
                    <td>{formatDate(entry.pushedAt)}</td>
                    <td>
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {entry.sourceName} <ExternalLink />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="honest-empty">
            <h2>
              {view === "growth"
                ? "Crecimiento todavía no calculable"
                : "Sin repositorios indexados para esta vista"}
            </h2>
            <p>
              {data?.reason ??
                "GitHub funciona sin token con cuota reducida; sincroniza desde el botón superior."}
            </p>
          </div>
        )}
      </section>
    </CollapsibleLayout>
  );
}
