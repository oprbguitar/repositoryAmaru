import { ExternalLink, Star } from "lucide-react";
import { useState } from "react";
import { FavoriteStar } from "./FavoriteStar";
import { type FavoriteKind, useFavorites } from "./favorites";
import "./favorites.css";

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
            Modelos y repositorios que marcaste con la estrella. Se guardan en
            este navegador.
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
    </div>
  );
}
