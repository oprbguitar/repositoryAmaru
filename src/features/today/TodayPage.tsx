import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Bot,
  Compass,
  Cpu,
  GitBranch,
  Globe2,
  ShieldCheck,
  TrendingDown,
  Workflow,
} from "lucide-react";
import type React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  getDashboard,
  getGlobalMap,
  getLiveEvents,
  getModelRankings,
  getPriceHistory,
  getSources,
} from "../observatory/api";
import { formatDate, formatNumber } from "../observatory/format";
import { PriceTrend } from "./PriceTrend";
import { TodayModelsTable } from "./TodayModelsTable";
import "./today.css";
import { AdminNote } from "../admin/AdminNote";

const DAY_MS = 86_400_000;

/** "hoy", "ayer" or "hace N días" relative to the user's clock. */
function relativeDay(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const start = (input: Date) =>
    new Date(input.getFullYear(), input.getMonth(), input.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(date)) / DAY_MS);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

export function TodayPage() {
  const { t, language } = useLanguage();
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
    queryFn: () => getPriceHistory(8),
  });
  const pricing = useQuery({
    queryKey: ["rankings", "pricing-low"],
    queryFn: () => getModelRankings("pricing-low"),
  });
  const map = useQuery({ queryKey: ["map", "global"], queryFn: getGlobalMap });
  const events = useQuery({
    queryKey: ["live-events"],
    queryFn: getLiveEvents,
    refetchInterval: 60_000,
  });

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
  const lastSync = sourceItems
    .map((source) => source.lastSuccessAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const rankingDate = pricing.data?.data.rankingDate ?? null;
  const rankingAge = relativeDay(rankingDate);
  const rankingStale =
    rankingDate !== null &&
    Date.now() - new Date(rankingDate).getTime() > 7 * DAY_MS;

  const en = language === "en";
  const today = new Intl.DateTimeFormat(en ? "en-GB" : "es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  // Only real, indexed counts — never decorative numbers.
  const pulse = [
    { to: "/models", label: t("nav.models"), value: stats?.models },
    { to: "/research", label: t("nav.research"), value: stats?.papers },
    { to: "/news", label: t("nav.news"), value: stats?.news },
    { to: "/github", label: t("nav.github"), value: stats?.repositories },
  ];

  const paths = [
    {
      to: "/evolution",
      icon: GitBranch,
      tone: "lavender",
      step: en ? "Understand" : "Entiende",
      title: en ? "Where AI comes from" : "De dónde viene la IA",
      text: en
        ? "The family tree of models in five minutes."
        : "El árbol de familias de modelos en cinco minutos.",
    },
    {
      to: "/models",
      icon: Bot,
      tone: "mint",
      step: en ? "Choose" : "Elige",
      title: en ? "Pick the right model" : "Encuentra tu modelo",
      text: en
        ? "Describe your task; read the sheet on the side."
        : "Describe tu tarea y lee su ficha al costado.",
    },
    {
      to: "/prompts",
      icon: Workflow,
      tone: "peach",
      step: en ? "Practise" : "Practica",
      title: en ? "Write better prompts" : "Escribe mejores prompts",
      text: en
        ? "Guided chains and a free AI to try them."
        : "Cadenas guiadas y una IA gratuita para probar.",
    },
    {
      to: "/open-local",
      icon: Cpu,
      tone: "sky",
      step: en ? "Run" : "Ejecuta",
      title: en ? "AI on your computer" : "IA en tu computadora",
      text: en
        ? "Open models that run offline, step by step."
        : "Modelos abiertos que corren sin internet, paso a paso.",
    },
  ] as const;

  return (
    <div className="today-page scroll-region">
      {/* --- Pulse hero -------------------------------------------------- */}
      <header className="today-hero">
        <div className="today-hero-copy">
          <span className="today-kicker">
            <i aria-hidden="true" />
            {today}
          </span>
          <h1>{en ? "Today's AI pulse" : "El pulso de la IA hoy"}</h1>
          <p>
            {en
              ? "What changed, what it costs and where to start — from public sources with a date."
              : "Qué cambió, cuánto cuesta y por dónde empezar — con fuentes públicas y fechadas."}
          </p>
          <span className="today-fresh">
            <ShieldCheck aria-hidden="true" />
            {lastSync
              ? `${en ? "Updated" : "Actualizado"} ${relativeDay(lastSync) ?? formatDate(lastSync)}`
              : en
                ? "Waiting for the first sync"
                : "Esperando la primera sincronización"}
          </span>
          <AdminNote>
            <Link className="secondary-button compact" to="/admin/sources">
              {t("today.sync")}
            </Link>
          </AdminNote>
        </div>
        <ul className="today-pulse" aria-label={en ? "Indexed" : "Indexado"}>
          {pulse.map((item, index) => (
            <li key={item.to} style={{ "--i": index } as React.CSSProperties}>
              <Link to={item.to}>
                <strong>
                  {item.value === undefined ? "—" : formatNumber(item.value)}
                </strong>
                <span>{item.label}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </header>

      {/* --- Learning paths ---------------------------------------------- */}
      <section
        className="today-paths"
        aria-label={en ? "Learning paths" : "Rutas de aprendizaje"}
      >
        <h2 className="today-section-title">
          <Compass aria-hidden="true" />
          {en ? "Where do I start?" : "¿Por dónde empiezo?"}
        </h2>
        <ol>
          {paths.map((path, index) => {
            const Icon = path.icon;
            return (
              <li
                key={path.to}
                data-tone={path.tone}
                style={{ "--i": index } as React.CSSProperties}
              >
                <Link to={path.to}>
                  <span className="today-path-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="today-path-step">
                    {index + 1} · {path.step}
                  </span>
                  <strong>{path.title}</strong>
                  <small>{path.text}</small>
                  <ArrowRight className="today-path-go" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* --- Prices + what's new ------------------------------------------ */}
      <div className="today-columns">
        <section className="panel today-section">
          <div className="panel-heading">
            <div>
              <h2>
                <TrendingDown /> {t("today.priceTrend")}
              </h2>
              <span>{t("today.priceTrendHint")}</span>
            </div>
            {rankingDate ? (
              <span
                className={`state-badge ${rankingStale ? "not-configured" : "verified"}`}
              >
                Ranking {rankingAge ?? formatDate(rankingDate)}
              </span>
            ) : null}
          </div>
          <div className="today-section-body today-trend-body">
            <TodayModelsTable
              entries={(pricing.data?.data.entries ?? []).slice(0, 6)}
              history={priceHistory.data?.data}
              rankingDate={rankingDate}
              loading={pricing.isLoading}
            />
            <PriceTrend
              history={priceHistory.data?.data}
              emptyLabel={t("today.noSeries")}
            />
          </div>
        </section>

        <div className="today-stack">
          <section className="panel today-section">
            <div className="panel-heading">
              <h2>
                <Activity /> {en ? "What's new" : "Lo nuevo"}
              </h2>
              <Link to="/news">{t("common.viewAll")}</Link>
            </div>
            <div className="today-section-body">
              {events.data?.data.length ? (
                <ul className="activity-list">
                  {events.data.data.slice(0, 5).map((event, index) => (
                    <li
                      key={event.id}
                      style={{ "--i": index } as React.CSSProperties}
                    >
                      <Link to={event.targetPath}>
                        <span className="activity-title">{event.title}</span>
                        <span className="activity-meta">
                          {event.sourceName} ·{" "}
                          {relativeDay(event.eventAt) ??
                            formatDate(event.eventAt)}
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
                <Globe2 /> {t("today.modelsByCountry")}
              </h2>
              <Link to="/map">{t("common.viewAll")}</Link>
            </div>
            <div className="today-section-body">
              {countries.length ? (
                <ol className="country-bars">
                  {countries.slice(0, 6).map((country, index) => (
                    <li
                      key={country.countryCode}
                      style={{ "--i": index } as React.CSSProperties}
                    >
                      <span className="country-rank">{index + 1}</span>
                      <span className="country-name">
                        {country.countryName}
                      </span>
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
      </div>

      {/* --- Source health: administrator only ----------------------------- */}
      <AdminNote>
        <section className="panel today-section today-health">
          <div className="panel-heading">
            <h2>
              <ShieldCheck /> {t("today.systemHealth")}
            </h2>
            <Link className="panel-link" to="/admin/sources">
              {t("shell.configureIntegrations")} <ArrowRight />
            </Link>
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
          </div>
        </section>
      </AdminNote>
    </div>
  );
}
