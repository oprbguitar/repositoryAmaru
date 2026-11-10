import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CircleSlash,
  ExternalLink,
  Eye,
  Minus,
} from "lucide-react";
import type { RepoSummary, SignalState } from "../../../lib/github/types";
import { formatDate, formatNumber } from "../observatory/format";
import { GithubApiError, githubApi } from "./api";

const SIGNAL_ICON: Record<SignalState, typeof Check> = {
  ok: Check,
  warn: AlertTriangle,
  bad: CircleSlash,
  na: Minus,
};

export function RepoInspector({
  repo,
  onOpen,
}: {
  repo: RepoSummary | null;
  onOpen: () => void;
}) {
  const detail = useQuery({
    queryKey: ["gh-repo", repo?.owner, repo?.name],
    queryFn: () => githubApi.repo(repo?.owner ?? "", repo?.name ?? ""),
    enabled: !!repo,
    staleTime: 600_000,
    retry: false,
  });
  if (!repo)
    return (
      <aside className="gh-inspector">
        <p className="gh-note">
          Selecciona un repositorio para ver sus datos verificados contra la API
          de GitHub.
        </p>
      </aside>
    );
  const data = detail.data?.data;
  const shown = data?.repo ?? repo;
  return (
    <aside className="gh-inspector" aria-label="Detalle del repositorio">
      <h2 className="gh-inspector-title">{repo.fullName}</h2>
      <p>{shown.description ?? "Sin descripción en GitHub."}</p>
      <div className="gh-actions">
        <button
          type="button"
          className="gh-btn gh-btn-primary"
          onClick={onOpen}
          disabled={!data}
        >
          <Eye /> Ver aquí
        </button>
        <a
          className="gh-btn"
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub <ExternalLink />
        </a>
      </div>
      {detail.isLoading ? (
        <p className="gh-note">Verificando con la API…</p>
      ) : null}
      {detail.error ? (
        <p className="gh-note gh-note-warn" role="alert">
          {detail.error instanceof GithubApiError
            ? detail.error.message
            : "No se pudo verificar."}{" "}
          Se muestran los datos de la búsqueda.
        </p>
      ) : null}
      {data ? (
        <p className="gh-note">
          Verificado {new Date(data.fetchedAt).toLocaleString("es-PE")}
          {data.stale ? " (copia en caché por límite de GitHub)" : ""}.
          {data.missing.length
            ? ` Sin datos de: ${data.missing.join(", ")}.`
            : ""}
        </p>
      ) : null}

      <dl className="gh-facts">
        <dt>Estrellas</dt>
        <dd>{formatNumber(shown.stars)}</dd>
        <dt>Forks</dt>
        <dd>{formatNumber(shown.forks)}</dd>
        <dt>Issues abiertos</dt>
        <dd>{formatNumber(shown.openIssues)}</dd>
        {data?.repo.subscribers != null ? (
          <>
            <dt>Seguidores</dt>
            <dd>{formatNumber(data.repo.subscribers)}</dd>
          </>
        ) : null}
        <dt>Licencia</dt>
        <dd>{shown.license ? shown.license.name : "Sin licencia"}</dd>
        <dt>Último push</dt>
        <dd>{formatDate(shown.pushedAt)}</dd>
        <dt>Creado</dt>
        <dd>{formatDate(shown.createdAt)}</dd>
        <dt>Estado</dt>
        <dd>{shown.archived ? "Archivado" : "Activo"}</dd>
        {shown.homepage ? (
          <>
            <dt>Homepage</dt>
            <dd>
              <a
                href={shown.homepage}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {shown.homepage.replace(/^https?:\/\//, "")}
              </a>
            </dd>
          </>
        ) : null}
      </dl>

      {data?.signals.length ? (
        <section>
          <h3>Señales de verificación</h3>
          <ul className="gh-signals">
            {data.signals.map((signal) => {
              const Icon = SIGNAL_ICON[signal.state];
              return (
                <li key={signal.id} data-state={signal.state}>
                  <Icon aria-hidden />
                  <div>
                    <strong>{signal.label}</strong>
                    <span>{signal.detail}</span>
                    <code>{signal.source}</code>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {data?.languages.length ? (
        <section>
          <h3>Lenguajes</h3>
          <div
            className="gh-langbar"
            role="img"
            aria-label="Distribución de lenguajes"
          >
            {data.languages.slice(0, 6).map((language, index) => (
              <span
                key={language.name}
                data-i={index}
                style={{ flexBasis: `${language.percent}%` }}
              />
            ))}
          </div>
          <ul className="gh-langs">
            {data.languages.slice(0, 6).map((language, index) => (
              <li key={language.name}>
                <i data-i={index} aria-hidden />
                {language.name} <b>{language.percent}%</b>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {shown.topics.length ? (
        <section>
          <h3>Topics</h3>
          <p className="gh-topics">
            {shown.topics.slice(0, 16).map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </p>
        </section>
      ) : null}

      {data?.releases.length ? (
        <section>
          <h3>Releases recientes</h3>
          <ul className="gh-list">
            {data.releases.map((release) => (
              <li key={release.tag}>
                <a href={release.url} target="_blank" rel="noopener noreferrer">
                  {release.tag}
                </a>
                {release.prerelease ? " · pre-release" : ""}
                <span> {formatDate(release.publishedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data?.contributors.length ? (
        <section>
          <h3>Contribuidores principales</h3>
          <ul className="gh-list">
            {data.contributors.map((person) => (
              <li key={person.login}>
                <a href={person.url} target="_blank" rel="noopener noreferrer">
                  {person.login}
                </a>
                {person.isBot ? " · bot" : ""}
                <span> {formatNumber(person.contributions)} commits</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
