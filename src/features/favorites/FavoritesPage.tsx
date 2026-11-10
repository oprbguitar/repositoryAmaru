import { useQuery } from "@tanstack/react-query";
import { ExternalLink, GitFork, Star } from "lucide-react";
import { useState } from "react";
import { FavoriteStar } from "./FavoriteStar";
import { type FavoriteKind, useFavorites } from "./favorites";
import "./favorites.css";

/** Personal GitHub account whose public projects are listed here. */
export const PERSONAL_GITHUB_USER = "oprbguitar";

type OwnRepo = {
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  topics?: string[];
};

async function getOwnRepos(): Promise<OwnRepo[]> {
  const response = await fetch(
    `https://api.github.com/users/${PERSONAL_GITHUB_USER}/repos?per_page=100&sort=pushed`,
    { headers: { accept: "application/vnd.github+json" } },
  );
  if (!response.ok)
    throw new Error(
      response.status === 403
        ? "GitHub limitó las consultas sin token (60 por hora). Intenta más tarde."
        : `GitHub respondió ${response.status}.`,
    );
  return (await response.json()) as OwnRepo[];
}

const KIND_LABELS: Record<FavoriteKind | "all", string> = {
  all: "Todos",
  model: "Modelos",
  repo: "Repositorios",
  guide: "Modelos guía",
};

function date(value: string): string {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FavoritesPage() {
  const favorites = useFavorites();
  const [kind, setKind] = useState<FavoriteKind | "all">("all");
  const repos = useQuery({
    queryKey: ["own-github-repos", PERSONAL_GITHUB_USER],
    queryFn: getOwnRepos,
    staleTime: 30 * 60 * 1000,
  });
  const shown =
    kind === "all" ? favorites : favorites.filter((f) => f.kind === kind);

  return (
    <div className="fav-page scroll-region">
      <header className="page-heading">
        <div>
          <h1>
            <Star aria-hidden /> Mis favoritos
          </h1>
          <p>
            Modelos y repositorios que marcaste con la estrella, y tus propios
            proyectos de GitHub. Se guardan en este navegador.
          </p>
        </div>
      </header>

      <section aria-labelledby="fav-saved">
        <div className="fav-section-head">
          <h2 id="fav-saved">Guardados ({favorites.length})</h2>
          <div
            className="fav-tabs"
            role="toolbar"
            aria-label="Filtrar por tipo"
          >
            {(Object.keys(KIND_LABELS) as Array<FavoriteKind | "all">).map(
              (k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                >
                  {KIND_LABELS[k]}
                </button>
              ),
            )}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="fav-empty">
            Aún no hay favoritos aquí. Marca la ★ en Modelos, GitHub u Open y
            local.
          </p>
        ) : (
          <ul className="fav-list">
            {shown.map((f) => (
              <li key={`${f.kind}:${f.id}`}>
                <FavoriteStar
                  kind={f.kind}
                  id={f.id}
                  label={f.label}
                  url={f.url}
                />
                <div>
                  <strong>{f.label}</strong>
                  <small>
                    {KIND_LABELS[f.kind]} · guardado {date(f.savedAt)}
                  </small>
                </div>
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer">
                    Abrir <ExternalLink aria-hidden />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="fav-own">
        <div className="fav-section-head">
          <h2 id="fav-own">
            <GitFork aria-hidden /> Mis repositorios ·{" "}
            <a
              href={`https://github.com/${PERSONAL_GITHUB_USER}`}
              target="_blank"
              rel="noreferrer"
            >
              {PERSONAL_GITHUB_USER}
            </a>
          </h2>
        </div>
        {repos.isLoading ? (
          <p className="fav-empty">Consultando GitHub…</p>
        ) : repos.error ? (
          <p className="fav-empty" role="alert">
            {(repos.error as Error).message}
          </p>
        ) : (
          <ul className="fav-list">
            {(repos.data ?? []).map((r) => (
              <li key={r.full_name}>
                <FavoriteStar
                  kind="repo"
                  id={r.full_name}
                  label={r.full_name}
                  url={r.html_url}
                />
                <div>
                  <strong>
                    {r.name}
                    {r.fork ? <em> · fork</em> : null}
                    {r.archived ? <em> · archivado</em> : null}
                  </strong>
                  <small>
                    {r.description ?? "Sin descripción"} ·{" "}
                    {r.language ?? "sin lenguaje"} · ★ {r.stargazers_count} ·
                    último cambio {date(r.pushed_at)}
                  </small>
                </div>
                <a href={r.html_url} target="_blank" rel="noreferrer">
                  GitHub <ExternalLink aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
