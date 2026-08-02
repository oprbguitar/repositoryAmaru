import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Archive,
  ArrowRight,
  Beaker,
  BookOpen,
  Bot,
  Building2,
  Database,
  GitFork,
  Globe2,
  Landmark,
  LayoutGrid,
  Newspaper,
  Radar,
  ServerCog,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ApiResponse, LibraryStats } from "../../../types/api";
import { useT } from "../../i18n/LanguageProvider";
import {
  getDashboard,
  getGlobalMap,
  getLiveEvents,
  getPriceHistory,
  getSources,
} from "../observatory/api";
import { formatDate, formatNumber } from "../observatory/format";
import { PriceTrend } from "./PriceTrend";

async function getStatus(): Promise<ApiResponse<LibraryStats>> {
  const response = await fetch("/api/status");
  if (!response.ok) throw new Error("No se pudo comprobar el estado local.");
  return response.json();
}

export function TodayPage() {
  const t = useT();
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
  const priceHistory = useQuery({
    queryKey: ["price-history"],
    queryFn: getPriceHistory,
  });
  const map = useQuery({ queryKey: ["map", "global"], queryFn: getGlobalMap });
  const events = useQuery({
    queryKey: ["live-events"],
    queryFn: getLiveEvents,
    refetchInterval: 60_000,
  });

  const library = status.data?.data;
  const stats = dashboard.data?.data;
  const sourceItems = sources.data?.data ?? [];
  const connected = sourceItems.filter(
    (source) => source.status === "connected",
  );
  const countries = (map.data?.data.countries ?? [])
    .filter((country) => country.models > 0)
    .sort((left, right) => right.models - left.models)
    .slice(0, 10);
  const maxModels = countries[0]?.models ?? 0;
  const healthy =
    (stats?.failedSources ?? 0) === 0 && (stats?.staleSources ?? 0) === 0;

  const modules = [
    {
      to: "/providers",
      icon: Building2,
      label: t("nav.providers"),
      value: stats?.providers ?? 0,
      hint: "Directorio oficial",
    },
    {
      to: "/models",
      icon: Bot,
      label: t("nav.models"),
      value: stats?.models ?? 0,
      hint: "Registros sincronizados",
    },
    {
      to: "/developer-lab",
      icon: ServerCog,
      label: t("nav.developerLab"),
      value: sourceItems.length,
      hint: "Fuentes registradas",
    },
    {
      to: "/research",
      icon: BookOpen,
      label: t("nav.research"),
      value: stats?.papers ?? 0,
      hint: "Metadatos reales",
    },
    {
      to: "/github",
      icon: GitFork,
      label: t("nav.github"),
      value: stats?.repositories ?? 0,
      hint: "Repositorios REST",
    },
    {
      to: "/news",
      icon: Newspaper,
      label: t("nav.news"),
      value: stats?.news ?? 0,
      hint: "Fuentes oficiales",
    },
    {
      to: "/local-library",
      icon: Archive,
      label: t("nav.localLibrary"),
      value: library?.processed ?? 0,
      hint: "Archivos locales",
    },
    {
      to: "/laboratory",
      icon: Beaker,
      label: t("nav.laboratory"),
      value: stats?.economicIndicators ?? 0,
      hint: "Indicadores indexados",
    },
  ];

  return (
    <div className="today-page scroll-region">
      <header className="page-heading">
        <div>
          <h1>
            <Radar /> {t("today.title")}
          </h1>
          <p>{t("today.subtitle")}</p>
        </div>
        <Link className="secondary-button compact" to="/admin/sources">
          {t("today.sync")}
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
            D1, KV y R2 permanecen locales; las solicitudes públicas se ejecutan
            en el Worker y conservan la última copia válida.
          </p>
        </div>
        <span className="state-badge verified">
          <ShieldCheck /> Sin datos de demostración
        </span>
      </div>

      {/* --- Modules ------------------------------------------------------ */}
      <section className="panel today-section">
        <div className="panel-heading">
          <h2>
            <LayoutGrid /> {t("today.modules")}
          </h2>
        </div>
        <div className="module-grid">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.to} to={module.to} className="module-tile">
                <span className="module-tile-head">
                  <Icon />
                  {module.label}
                </span>
                <strong>{formatNumber(module.value)}</strong>
                <span className="module-tile-foot">
                  <small>{module.hint}</small>
                  <ArrowRight />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* --- Trend + countries -------------------------------------------- */}
      <div className="today-columns">
        <section className="panel today-section">
          <div className="panel-heading">
            <div>
              <h2>
                <TrendingDown /> {t("today.priceTrend")}
              </h2>
              <span>{t("today.priceTrendHint")}</span>
            </div>
          </div>
          <div className="today-section-body">
            <PriceTrend
              history={priceHistory.data?.data}
              emptyLabel={t("today.noSeries")}
            />
          </div>
        </section>

        <section className="panel today-section">
          <div className="panel-heading">
            <div>
              <h2>
                <Globe2 /> {t("today.modelsByCountry")}
              </h2>
              <span>{t("today.modelsByCountryHint")}</span>
            </div>
            <Link to="/map">{t("common.viewAll")}</Link>
          </div>
          <div className="today-section-body">
            {countries.length ? (
              <ol className="country-bars">
                {countries.map((country, index) => (
                  <li key={country.countryCode}>
                    <span className="country-rank">{index + 1}</span>
                    <span className="country-name">{country.countryName}</span>
                    <span className="country-track">
                      <span
                        className="country-fill"
                        style={{
                          width: `${maxModels ? (country.models / maxModels) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <span className="country-value">
                      {formatNumber(country.models)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="honest-empty compact-empty">
                <p>{t("today.noCountries")}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* --- Health + activity + quick links ------------------------------ */}
      <div className="today-columns three">
        <section className="panel today-section">
          <div className="panel-heading">
            <h2>
              <ShieldCheck /> {t("today.systemHealth")}
            </h2>
          </div>
          <div className="today-section-body">
            <div className="health-grid">
              <div>
                <small>{t("today.connected")}</small>
                <strong className="delta-down">
                  {connected.length}/{sourceItems.length}
                </strong>
              </div>
              <div>
                <small>{t("today.failed")}</small>
                <strong
                  className={
                    (stats?.failedSources ?? 0) > 0 ? "delta-up" : undefined
                  }
                >
                  {stats?.failedSources ?? 0}
                </strong>
              </div>
              <div>
                <small>{t("today.stale")}</small>
                <strong>{stats?.staleSources ?? 0}</strong>
              </div>
              <div>
                <small>{t("today.overall")}</small>
                <strong className={healthy ? "delta-down" : undefined}>
                  {healthy ? "Óptimo" : "Con incidencias"}
                </strong>
              </div>
            </div>
            <Link className="panel-link" to="/admin/sources">
              {t("shell.configureIntegrations")} <ArrowRight />
            </Link>
          </div>
        </section>

        <section className="panel today-section">
          <div className="panel-heading">
            <h2>
              <Activity /> {t("today.recentActivity")}
            </h2>
          </div>
          <div className="today-section-body">
            {events.data?.data.length ? (
              <ul className="activity-list">
                {events.data.data.slice(0, 6).map((event) => (
                  <li key={event.id}>
                    <Link to={event.targetPath}>
                      <span className="activity-title">{event.title}</span>
                      <span className="activity-meta">
                        {event.sourceName} · {formatDate(event.eventAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="honest-empty compact-empty">
                <p>{t("today.noActivity")}</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel today-section">
          <div className="panel-heading">
            <h2>
              <Database /> {t("today.quickLinks")}
            </h2>
          </div>
          <div className="today-section-body">
            <div className="quick-links">
              <Link to="/developer-lab">
                <ServerCog />
                <span>
                  <strong>{t("nav.developerLab")}</strong>
                  <small>Probar proveedores</small>
                </span>
              </Link>
              <Link to="/research">
                <BookOpen />
                <span>
                  <strong>{t("nav.research")}</strong>
                  <small>Explorar estudios</small>
                </span>
              </Link>
              <Link to="/markets">
                <Landmark />
                <span>
                  <strong>{t("nav.markets")}</strong>
                  <small>Precios y tendencias</small>
                </span>
              </Link>
              <Link to="/map">
                <Globe2 />
                <span>
                  <strong>{t("nav.map")}</strong>
                  <small>Cobertura por país</small>
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
