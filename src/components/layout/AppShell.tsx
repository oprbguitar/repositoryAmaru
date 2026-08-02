import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Command,
  Globe,
  Menu,
  Moon,
  Search,
  Settings2,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import type { ApiResponse, LibraryStats } from "../../../types/api";
import { getLiveEvents } from "../../features/observatory/api";
import { LANGUAGES } from "../../i18n/dictionary";
import { useLanguage } from "../../i18n/LanguageProvider";
import { Brand } from "./Brand";
import { mobileNavigation, navigation } from "./navigation";
import { nextTheme, resolveInitialTheme } from "./theme";

async function fetchStatus(): Promise<ApiResponse<LibraryStats>> {
  const response = await fetch("/api/status");
  if (!response.ok) throw new Error("status_unavailable");
  return response.json();
}

function useClock(locale: string) {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setDate(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return {
    time: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(date),
    day: new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
  };
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const clock = useClock(language === "en" ? "en-GB" : "es-PE");
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState(() =>
    resolveInitialTheme(
      localStorage.getItem("amaru-theme"),
      window.matchMedia("(prefers-color-scheme: light)").matches,
    ),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("amaru-theme", theme);
  }, [theme]);

  // Dismiss the language menu on outside pointer or Escape.
  useEffect(() => {
    if (!languageOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!languageRef.current?.contains(event.target as Node))
        setLanguageOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLanguageOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [languageOpen]);

  const status = useQuery({
    queryKey: ["status"],
    queryFn: fetchStatus,
    refetchInterval: 60_000,
  });
  const liveEvents = useQuery({
    queryKey: ["live-events"],
    queryFn: getLiveEvents,
    refetchInterval: 60_000,
  });
  const state = status.data?.data;
  const statusLabel =
    state?.databaseStatus === "ready"
      ? t("shell.operational")
      : state?.databaseStatus === "needs_migration"
        ? t("shell.needsMigration")
        : t("shell.checking");
  const activeItem = useMemo(
    () => navigation.find((item) => location.pathname.startsWith(item.path)),
    [location.pathname],
  );
  const activeLabel = activeItem ? t(activeItem.labelKey) : "AMARU";

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/local-library?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <form className="global-search" onSubmit={submitSearch}>
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("shell.searchPlaceholder")}
            aria-label={t("shell.searchLabel")}
          />
          <kbd>
            <Command size={12} /> K
          </kbd>
        </form>
        <div className="topbar-actions">
          <button
            className="mode-switch"
            onClick={() => setTheme((current) => nextTheme(current))}
            type="button"
            aria-label={
              theme === "dark"
                ? t("shell.themeToLight")
                : t("shell.themeToDark")
            }
            title={
              theme === "dark"
                ? t("shell.themeToLight")
                : t("shell.themeToDark")
            }
          >
            {theme === "dark" ? <Sun /> : <Moon />}
            {theme === "dark" ? t("shell.light") : t("shell.dark")}
          </button>
          <div className="utc">
            <span>UTC {clock.time}</span>
            <strong>{clock.day}</strong>
          </div>
          <div className="language-switch" ref={languageRef}>
            <button
              className="icon-button language-trigger"
              type="button"
              aria-label={t("shell.languageLabel")}
              title={t("shell.languageLabel")}
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              onClick={() => setLanguageOpen((open) => !open)}
            >
              <Globe />
              <span aria-hidden="true">{language.toUpperCase()}</span>
            </button>
            {languageOpen ? (
              <div className="language-menu" role="menu">
                {LANGUAGES.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={language === option.code}
                    className={language === option.code ? "active" : ""}
                    onClick={() => {
                      setLanguage(option.code);
                      setLanguageOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {language === option.code ? <Check /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? t("shell.closeNav") : t("shell.openNav")}
            type="button"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <aside
        className={`sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label={t("shell.mainNav")}
      >
        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <Icon />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="observatory-status">
          <span className="eyebrow">{t("shell.observatoryState")}</span>
          <strong className="status-line">
            <i className={state?.databaseStatus === "ready" ? "ok" : "warn"} />
            {statusLabel}
          </strong>
          <div className="status-pair">
            <span>{t("shell.library")}</span>
            <strong>
              {state?.processed ?? 0} {t("shell.files")}
            </strong>
          </div>
          <div className="progress">
            <span
              style={{
                width: state?.databaseStatus === "ready" ? "100%" : "28%",
              }}
            />
          </div>
          <Link to="/admin/sources">
            <Settings2 /> {t("shell.configureIntegrations")}
          </Link>
        </div>
      </aside>

      <main className="workspace" aria-label={activeLabel}>
        <Outlet />
      </main>

      <footer className="live-strip">
        <strong>
          <i />
          {t("shell.liveUpdates")}
        </strong>
        <span className="live-time">{clock.time}</span>
        <span className="live-tag">REAL</span>
        <span className="live-message">
          {liveEvents.data?.data[0]
            ? `${liveEvents.data.data[0].sourceName}: ${liveEvents.data.data[0].title}`
            : t("shell.noChanges")}
        </span>
        <Link to={liveEvents.data?.data[0]?.targetPath ?? "/admin/sources"}>
          {t("shell.viewUpdate")} <span aria-hidden="true">→</span>
        </Link>
      </footer>

      <nav className="mobile-tabs" aria-label={t("shell.mobileNav")}>
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path}>
              <Icon />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
