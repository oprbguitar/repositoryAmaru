import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Info,
  PlaySquare,
  RefreshCw,
  Search,
  Tv,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { VideoItem } from "../../../types/api";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { getVideos, synchronize } from "../observatory/api";
import { formatDate, formatNumber, missing } from "../observatory/format";

function duration(seconds: number | null): string {
  if (seconds === null) return missing;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m ${rest}s`;
}

export function VideosPage() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [order, setOrder] = useState("newest");
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [syncing, setSyncing] = useState(false);

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (query.trim()) search.set("q", query.trim());
    if (topic) search.set("topic", topic);
    if (language) search.set("language", language);
    if (officialOnly) search.set("official", "1");
    search.set("order", order);
    return search;
  }, [query, topic, language, officialOnly, order]);

  const videos = useQuery({
    queryKey: ["videos", params.toString()],
    queryFn: () => getVideos(params),
  });
  const data = videos.data?.data;
  const items = data?.items ?? [];
  const chosen = selected ?? items[0] ?? null;

  async function runSync() {
    setSyncing(true);
    try {
      await synchronize("videos");
      await videos.refetch();
    } finally {
      setSyncing(false);
    }
  }

  const topics = [...new Set(items.map((item) => item.topic))];

  const panel = chosen ? (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <PlaySquare />
        <strong>Información contextual</strong>
      </div>
      <section>
        <h2 className="context-record-title">{chosen.title}</h2>
        <p>{chosen.description ?? missing}</p>
      </section>
      <section>
        <h3>Reproducción</h3>
        <div className="video-embed">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${chosen.externalId}`}
            title={chosen.title}
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
        <a
          className="source-link-button"
          href={chosen.watchUrl}
          target="_blank"
          rel="noreferrer"
        >
          Ver en YouTube
        </a>
      </section>
      <section>
        <h3>Procedencia</h3>
        <dl className="context-facts">
          <dt>Canal</dt>
          <dd>
            {chosen.channelTitle}
            {chosen.isOfficialChannel ? " · canal oficial" : ""}
          </dd>
          <dt>Publicado</dt>
          <dd>{formatDate(chosen.publishedAt)}</dd>
          <dt>Duración</dt>
          <dd>{duration(chosen.durationSeconds)}</dd>
          <dt>Vistas</dt>
          <dd>
            {chosen.viewCount === null
              ? missing
              : formatNumber(chosen.viewCount)}
          </dd>
          <dt>Idioma</dt>
          <dd>{chosen.language ?? missing}</dd>
          <dt>Tema</dt>
          <dd>{chosen.topic}</dd>
          <dt>Fuente</dt>
          <dd>{chosen.sourceName}</dd>
          <dt>Recuperado</dt>
          <dd>{formatDate(chosen.retrievedAt)}</dd>
        </dl>
      </section>
    </aside>
  ) : (
    <aside className="context-panel scroll-region">
      <div className="context-title">
        <Info />
        <strong>Información contextual</strong>
      </div>
      <section>
        <p>Selecciona un video para ver su procedencia y reproducirlo.</p>
      </section>
    </aside>
  );

  return (
    <CollapsibleLayout storageKey="videos" panel={panel}>
      <header className="page-heading">
        <div>
          <h1>
            <PlaySquare /> Videos técnicos
          </h1>
          <p>
            Fuente principal: YouTube Data API (canales oficiales y consultas
            curadas). Sin videos inventados.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button compact"
          onClick={runSync}
          disabled={syncing}
        >
          <RefreshCw className={syncing ? "spin" : ""} /> Sincronizar videos
        </button>
      </header>
      {data && !data.integrations.youtubeConfigured ? (
        <div className="panel status-banner">
          <Info />
          <div>
            <strong>YOUTUBE_API_KEY no configurada</strong>
            <p>Agrega la clave en .dev.vars y reinicia para sincronizar.</p>
          </div>
        </div>
      ) : null}
      <div className="library-toolbar video-toolbar">
        <label className="module-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, canal o descripción…"
            aria-label="Buscar videos"
          />
        </label>
        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          aria-label="Filtrar por tema"
        >
          <option value="">Todos los temas</option>
          {topics.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          aria-label="Filtrar por idioma"
        >
          <option value="">Todos los idiomas</option>
          <option value="es">Español</option>
          <option value="en">Inglés</option>
        </select>
        <select
          value={order}
          onChange={(event) => setOrder(event.target.value)}
          aria-label="Ordenar"
        >
          <option value="newest">Más recientes</option>
          <option value="views">Más vistos</option>
        </select>
        <label className="official-filter">
          <input
            type="checkbox"
            checked={officialOnly}
            onChange={(event) => setOfficialOnly(event.target.checked)}
          />
          Solo canales oficiales
        </label>
      </div>
      {items.length ? (
        <div className="video-grid">
          {items.map((video) => (
            <button
              type="button"
              key={video.id}
              className={`panel video-card ${chosen?.id === video.id ? "selected" : ""}`}
              onClick={() => setSelected(video)}
            >
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  className="video-thumbnail"
                />
              ) : (
                <div className="video-thumbnail placeholder" />
              )}
              <div className="video-card-body">
                <h2>{video.title}</h2>
                <p className="video-meta">
                  <Tv className="inline-icon" /> {video.channelTitle}
                  {video.isOfficialChannel ? (
                    <BadgeCheck
                      className="inline-icon"
                      aria-label="Canal oficial"
                    />
                  ) : null}
                </p>
                <p className="video-meta">
                  {formatDate(video.publishedAt)} ·{" "}
                  {duration(video.durationSeconds)} ·{" "}
                  {video.viewCount === null
                    ? "vistas no informadas"
                    : `${formatNumber(video.viewCount)} vistas`}
                </p>
                <p className="video-topic">{video.topic}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="panel honest-empty">
          <h2>No hay videos indexados</h2>
          <p>
            Ejecuta «Sincronizar videos» para obtener contenidos reales de la
            YouTube Data API con la clave configurada.
          </p>
        </div>
      )}
      <section className="panel">
        <div className="panel-heading">
          <h2>Otras plataformas</h2>
        </div>
        <p className="coverage-note">
          {data?.integrations.metaConfigured
            ? "Integración de Meta configurada."
            : "Integración de Meta no configurada — se requieren credenciales oficiales de Graph API (páginas y cuentas autorizadas)."}{" "}
          {data?.integrations.xConfigured
            ? "Integración de X configurada."
            : "Integración de X no configurada — se requiere X_BEARER_TOKEN para búsqueda reciente oficial."}{" "}
          Sin credenciales no se muestra contenido de esas plataformas.
        </p>
      </section>
    </CollapsibleLayout>
  );
}
