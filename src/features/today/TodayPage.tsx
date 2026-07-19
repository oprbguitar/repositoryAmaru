import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Archive,
  ArrowRight,
  BookOpen,
  Bot,
  Database,
  GitFork,
  Newspaper,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ApiResponse, LibraryStats } from "../../../types/api";
import { getDashboard, getSources } from "../observatory/api";
import { formatDate, verificationLabel } from "../observatory/format";

async function getStatus(): Promise<ApiResponse<LibraryStats>> {
  const response = await fetch("/api/status");
  if (!response.ok) throw new Error("No se pudo comprobar el estado local.");
  return response.json();
}

export function TodayPage() {
  const status = useQuery({ queryKey: ["status"], queryFn: getStatus });
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  });
  const sources = useQuery({
    queryKey: ["sources"],
    queryFn: getSources,
    refetchInterval: 60_000,
  });
  const library = status.data?.data;
  const stats = dashboard.data?.data;
  const sourceItems = sources.data?.data ?? [];
  const connected = sourceItems.filter(
    (source) => source.status === "connected",
  );
  return (
    <div className="module-layout today-layout">
      <section className="module-main scroll-region">
        <header className="page-heading">
          <div>
            <h1>
              <Radar /> Hoy
            </h1>
            <p>
              Resumen verificable del observatorio local conectado a internet
            </p>
          </div>
          <Link className="secondary-button compact" to="/admin/sources">
            Sincronizar fuentes
          </Link>
        </header>
        <div className="status-banner">
          <span className="status-beacon">
            <Activity />
          </span>
          <div>
            <strong>
              AMARU funciona localmente con datos externos trazables
            </strong>
            <p>
              D1, KV y R2 permanecen locales; las solicitudes públicas se
              ejecutan en el Worker y conservan la última copia válida.
            </p>
          </div>
          <span className="state-badge verified">
            <ShieldCheck /> Sin datos de demostración
          </span>
        </div>

        <div className="stat-grid dashboard-stats">
          <Link to="/providers" className="panel">
            <Database />
            <span>Proveedores</span>
            <strong>{stats?.providers ?? 0}</strong>
            <small>directorio oficial</small>
          </Link>
          <Link to="/models" className="panel">
            <Bot />
            <span>Modelos</span>
            <strong>{stats?.models ?? 0}</strong>
            <small>registros sincronizados</small>
          </Link>
          <Link to="/research" className="panel">
            <BookOpen />
            <span>Investigaciones</span>
            <strong>{stats?.papers ?? 0}</strong>
            <small>metadatos reales</small>
          </Link>
          <Link to="/github" className="panel">
            <GitFork />
            <span>Repositorios</span>
            <strong>{stats?.repositories ?? 0}</strong>
            <small>GitHub REST</small>
          </Link>
          <Link to="/news" className="panel">
            <Newspaper />
            <span>Noticias</span>
            <strong>{stats?.news ?? 0}</strong>
            <small>fuentes oficiales</small>
          </Link>
          <Link to="/local-library" className="panel">
            <Archive />
            <span>Biblioteca</span>
            <strong>{library?.processed ?? 0}</strong>
            <small>archivos locales</small>
          </Link>
        </div>

        <div className="today-grid real-today-grid">
          <section className="panel record-list dashboard-recent">
            <div className="panel-heading">
              <h2>Detecciones recientes</h2>
              <span>{stats?.recent.length ?? 0} registros</span>
            </div>
            {stats?.recent.length ? (
              stats.recent.slice(0, 8).map((record) => (
                <article key={record.id}>
                  <div className="record-source">
                    <span>{record.sourceName}</span>
                    <span
                      className={`state-badge ${record.verificationStatus === "verified" ? "verified" : "provisional"}`}
                    >
                      {verificationLabel(record)}
                    </span>
                  </div>
                  <h2>{record.title}</h2>
                  <div className="record-meta">
                    <span>Publicado: {formatDate(record.publishedAt)}</span>
                    <span>Recuperado: {formatDate(record.retrievedAt)}</span>
                    <a
                      href={record.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Fuente original
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <div className="honest-empty">
                <h2>Aún no hay registros externos</h2>
                <p>
                  La primera sincronización pública se encola al iniciar.
                  También puedes ejecutarla desde Administración.
                </p>
              </div>
            )}
          </section>
          <section className="panel module-state-list">
            <div className="panel-heading">
              <h2>Salud de fuentes</h2>
              <Link to="/admin/sources">Ver todas</Link>
            </div>
            {sourceItems.slice(0, 8).map((source) => (
              <article key={source.id}>
                <span
                  className={`source-health-dot ${source.status === "connected" ? "ok" : source.status === "failed" ? "error" : "warn"}`}
                />
                <div>
                  <strong>{source.name}</strong>
                  <small>
                    {source.lastSuccessAt
                      ? `Éxito ${formatDate(source.lastSuccessAt)}`
                      : source.credentialConfigured
                        ? "Pendiente de primera sincronización"
                        : `Falta ${source.secretBindingName}`}
                  </small>
                </div>
                <span
                  className={`state-badge ${source.status === "connected" ? "verified" : "provisional"}`}
                >
                  {source.status}
                </span>
              </article>
            ))}
            <Link className="panel-link" to="/admin/sources">
              {connected.length} conectadas · revisar integraciones{" "}
              <ArrowRight />
            </Link>
          </section>
        </div>
      </section>
      <aside className="context-panel scroll-region">
        <div className="context-title">
          <Database />
          <strong>Información contextual</strong>
        </div>
        <section>
          <h3>Última sincronización</h3>
          <p>{formatDate(stats?.lastSuccessfulSyncAt)}</p>
        </section>
        <section>
          <h3>Estado</h3>
          <dl className="context-facts">
            <dt>Fuentes conectadas</dt>
            <dd>{connected.length}</dd>
            <dt>Fuentes fallidas</dt>
            <dd>{stats?.failedSources ?? 0}</dd>
            <dt>Requieren credencial</dt>
            <dd>{stats?.sourcesRequiringCredentials ?? 0}</dd>
            <dt>Desactualizadas</dt>
            <dd>{stats?.staleSources ?? 0}</dd>
          </dl>
        </section>
        <section>
          <h3>Fuentes</h3>
          <p>
            Todos los registros recientes enlazan su fuente original. Los
            agregados provienen de consultas D1, no de colecciones del frontend.
          </p>
        </section>
      </aside>
    </div>
  );
}
