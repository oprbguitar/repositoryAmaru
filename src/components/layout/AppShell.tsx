import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Globe,
  Library,
  PanelLeftClose,
  PanelLeftOpen,
  PowerOff,
  Search,
  Settings2,
} from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { normalizeSearch } from "../../../lib/normalization/search";
import type { ApiResponse, LibraryStats } from "../../../types/api";
import { useIsAdmin } from "../../features/admin/AdminNote";
import { getLiveEvents, getSources } from "../../features/observatory/api";
import { LANGUAGES } from "../../i18n/dictionary";
import { useLanguage } from "../../i18n/LanguageProvider";
import { Brand } from "./Brand";
import { GuideControls } from "./GuideSystem";
import { MobileDetailSheet } from "./MobileDetailSheet";
import { PrivacyNotice } from "./PrivacyNotice";
import "./shell-extras.css";
import {
  mobileNavigation,
  NAV_GROUPS,
  navigation,
  visibleNavigation,
} from "./navigation";
import { SectionIntroBar } from "./SectionIntroBar";
import {
  ServerStoppedScreen,
  ShutdownDialog,
  useDevServerHealth,
} from "./ServerControl";
import { GROUP_LABELS } from "./sectionIntros";
import { summarizeSources } from "./sourceSummary";
import {
  type AppTheme,
  applyTheme,
  type NavMode,
  readStorage,
  resolveInitialTheme,
  resolveNavMode,
  writeStorage,
} from "./theme";
import { useMenu } from "./useMenu";

const THEME_KEY = "amaru-theme-v3";
const NAV_KEY = "amaru-nav";
const DRAWER_QUERY = "(max-width: 900px)";

/** Theme picker entries; `swatch` paints the preview dot (bg, accent, support). */
const THEME_OPTIONS: ReadonlyArray<{
  value: AppTheme;
  label: { es: string; en: string };
  hint: { es: string; en: string };
  swatch: [string, string, string];
}> = [
  {
    value: "playful",
    label: { es: "Observatorio", en: "Observatory" },
    hint: {
      es: "Marfil y lavanda (predeterminado)",
      en: "Ivory and lavender (default)",
    },
    swatch: ["#faf8f5", "#8b5cf6", "#10b981"],
  },
  {
    value: "mint",
    label: { es: "Menta", en: "Mint" },
    hint: { es: "Fresco y verde", en: "Fresh and green" },
    swatch: ["#f3faf6", "#0f9f6e", "#0ea5e9"],
  },
  {
    value: "sunset",
    label: { es: "Atardecer", en: "Sunset" },
    hint: { es: "Durazno y coral", en: "Peach and coral" },
    swatch: ["#fff6f0", "#e8590c", "#d6336c"],
  },
  {
    value: "pastel",
    label: { es: "Pastel", en: "Pastel" },
    hint: { es: "Rosa y crema", en: "Pink and cream" },
    swatch: ["#fff8f1", "#c2386b", "#12775a"],
  },
  {
    value: "obsidian",
    label: { es: "Obsidiana", en: "Obsidian" },
    hint: { es: "Oscuro con cian telemétrico", en: "Dark with telemetry cyan" },
    swatch: ["#0b0f17", "#22d3ee", "#a78bfa"],
  },
  {
    value: "dark",
    label: { es: "Noche", en: "Night" },
    hint: { es: "Navy del logo", en: "Logo navy" },
    swatch: ["#05121f", "#2ec7d4", "#22e3a0"],
  },
  {
    value: "light",
    label: { es: "Claro", en: "Light" },
    hint: { es: "Superficies neutras", en: "Neutral surfaces" },
    swatch: ["#eef4f8", "#0a6f7c", "#087a52"],
  },
  {
    value: "contrast-light",
    label: { es: "Alto contraste claro", en: "High contrast light" },
    hint: { es: "Negro sobre blanco", en: "Black on white" },
    swatch: ["#ffffff", "#000000", "#00566b"],
  },
  {
    value: "contrast-dark",
    label: { es: "Alto contraste oscuro", en: "High contrast dark" },
    hint: { es: "Blanco sobre negro", en: "White on black" },
    swatch: ["#000000", "#ffffff", "#5ff0ff"],
  },
];

async function fetchStatus(): Promise<ApiResponse<LibraryStats>> {
  const response = await fetch("/api/status");
  if (!response.ok) throw new Error("status_unavailable");
  return response.json();
}

function matchesQuery(query: string) {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => matchesQuery(query));
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function useClock(locale: string) {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setDate(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT")
  );
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const clock = useClock(language === "en" ? "en-GB" : "es-PE");
  const isDrawer = useMediaQuery(DRAWER_QUERY);

  // --- Theme ---------------------------------------------------------------
  const [theme, setTheme] = useState<AppTheme>(() =>
    resolveInitialTheme(
      readStorage(THEME_KEY),
      matchesQuery("(prefers-color-scheme: light)"),
      matchesQuery("(prefers-contrast: more)"),
    ),
  );
  useEffect(() => {
    applyTheme(theme);
    writeStorage(THEME_KEY, theme);
  }, [theme]);

  // --- Navigation: compact rail on desktop, drawer below 900px -------------
  const [navMode, setNavMode] = useState<NavMode>(() =>
    resolveNavMode(readStorage(NAV_KEY)),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const compact = navMode === "compact" && !isDrawer;
  useEffect(() => {
    document.documentElement.dataset.nav = navMode;
    writeStorage(NAV_KEY, navMode);
  }, [navMode]);
  // Leaving drawer mode (resize/rotate) must not leave an invisible drawer open.
  useEffect(() => {
    if (!isDrawer) setDrawerOpen(false);
  }, [isDrawer]);
  // Close the drawer after navigating; keep the desktop mode as chosen.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on route change only
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const navToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarId = useId();
  const toggleNavigation = useCallback(() => {
    if (matchesQuery(DRAWER_QUERY)) setDrawerOpen((open) => !open);
    else setNavMode((mode) => (mode === "compact" ? "full" : "compact"));
  }, []);
  const navExpanded = isDrawer ? drawerOpen : !compact;

  // --- Global shortcuts: Ctrl+B navigation, Ctrl+K or "/" search ------------
  const searchRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (
        mod &&
        !event.altKey &&
        key === "b" &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        toggleNavigation();
      } else if (mod && !event.altKey && key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (
        event.key === "/" &&
        !mod &&
        !(event.target instanceof HTMLInputElement) &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
        navToggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggleNavigation, drawerOpen]);

  // --- Compact-rail tooltip -------------------------------------------------
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(
    null,
  );
  function showTooltip(element: HTMLElement, label: string) {
    if (!compact) return;
    const rect = element.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2 });
  }
  useEffect(() => {
    if (!tooltip) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setTooltip(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [tooltip]);
  useEffect(() => {
    if (!compact) setTooltip(null);
  }, [compact]);

  // --- Data -----------------------------------------------------------------
  const status = useQuery({
    queryKey: ["status"],
    queryFn: fetchStatus,
    refetchInterval: 60_000,
  });
  const sources = useQuery({
    queryKey: ["sources"],
    queryFn: getSources,
    refetchInterval: 120_000,
  });
  const liveEvents = useQuery({
    queryKey: ["live-events"],
    queryFn: getLiveEvents,
    refetchInterval: 60_000,
  });
  const devHealth = useDevServerHealth();
  const isAdmin = useIsAdmin();
  const library = status.data?.data;
  const sourceSummary = sources.data
    ? summarizeSources(sources.data.data)
    : null;
  const latestEvent = liveEvents.data?.data[0];

  // --- Location -------------------------------------------------------------
  const activeItem = useMemo(
    () => navigation.find((item) => location.pathname.startsWith(item.path)),
    [location.pathname],
  );
  const navItems = useMemo(() => visibleNavigation(isAdmin), [isAdmin]);
  const activeLabel = activeItem
    ? t(activeItem.labelKey)
    : location.pathname.startsWith("/admin")
      ? t("shell.configureIntegrations")
      : "AMARU";

  // --- Menus / dialogs --------------------------------------------------------
  const display = useMenu();
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const [serverStopped, setServerStopped] = useState(false);

  if (serverStopped) return <ServerStoppedScreen />;

  const activeTheme =
    THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[0];

  return (
    <div
      className="app-shell"
      data-nav={compact ? "compact" : "full"}
      data-drawer={isDrawer && drawerOpen ? "open" : undefined}
    >
      <header className="topbar">
        <div className="topbar-lead">
          <button
            ref={navToggleRef}
            className="icon-button nav-toggle"
            type="button"
            aria-controls={sidebarId}
            aria-expanded={navExpanded}
            aria-keyshortcuts="Control+B"
            aria-label={
              isDrawer
                ? drawerOpen
                  ? t("shell.closeNav")
                  : t("shell.openNav")
                : compact
                  ? t("shell.expandNav")
                  : t("shell.collapseNav")
            }
            title={`${
              isDrawer
                ? drawerOpen
                  ? t("shell.closeNav")
                  : t("shell.openNav")
                : compact
                  ? t("shell.expandNav")
                  : t("shell.collapseNav")
            } (Ctrl+B)`}
            onClick={toggleNavigation}
          >
            {navExpanded ? (
              <PanelLeftClose aria-hidden="true" />
            ) : (
              <PanelLeftOpen aria-hidden="true" />
            )}
          </button>
          <Brand asLink />
          <nav className="breadcrumb" aria-label={t("shell.breadcrumb")}>
            <ol>
              <li>
                <ChevronRight aria-hidden="true" />
              </li>
              <li aria-current="page">{activeLabel}</li>
            </ol>
          </nav>
        </div>

        <GlobalSearch inputRef={searchRef} items={navItems} />

        <div className="topbar-actions">
          {isAdmin ? (
            <Link
              className={`source-indicator is-${
                sources.isError ? "error" : (sourceSummary?.level ?? "loading")
              }`}
              to="/admin/sources"
              title={t("shell.configureIntegrations")}
            >
              <i aria-hidden="true" />
              <span className="source-indicator-label">
                {t("shell.sources")}
              </span>
              <span className="source-indicator-value">
                {sources.isError
                  ? t("shell.sourcesUnavailable")
                  : !sourceSummary
                    ? t("common.loading")
                    : sourceSummary.enabled === 0
                      ? t("shell.sourcesEmpty")
                      : sourceSummary.failed > 0
                        ? t("shell.sourcesFailed").replace(
                            "{failed}",
                            String(sourceSummary.failed),
                          )
                        : t("shell.sourcesConnected")
                            .replace(
                              "{connected}",
                              String(sourceSummary.connected),
                            )
                            .replace(
                              "{enabled}",
                              String(sourceSummary.enabled),
                            )}
              </span>
            </Link>
          ) : null}

          <div className="shell-menu" ref={display.rootRef}>
            <button
              ref={display.triggerRef}
              className="shell-menu-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={display.open}
              aria-label={t("shell.displayLabel")}
              onClick={() => display.setOpen((open) => !open)}
              onKeyDown={display.onTriggerKeyDown}
            >
              <ThemeDot swatch={activeTheme?.swatch} />
              <span>{t("shell.display")}</span>
            </button>
            {display.open ? (
              <div
                className="shell-menu-panel display-menu"
                role="menu"
                aria-label={t("shell.display")}
                ref={display.menuRef}
              >
                <div className="shell-menu-group">
                  <span className="shell-menu-heading" aria-hidden="true">
                    {t("shell.theme")}
                  </span>
                  <div className="theme-grid">
                    {THEME_OPTIONS.map((option) => {
                      const checked = theme === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="menuitemradio"
                          aria-checked={checked}
                          tabIndex={-1}
                          className="shell-menu-item theme-option"
                          title={option.hint[language]}
                          onClick={() => {
                            setTheme(option.value);
                            display.close(true);
                          }}
                        >
                          <ThemeDot swatch={option.swatch} />
                          <span className="shell-menu-text">
                            <strong>{option.label[language]}</strong>
                            <small>{option.hint[language]}</small>
                          </span>
                          {checked ? (
                            <Check
                              className="shell-menu-check"
                              aria-hidden="true"
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {isDrawer ? null : (
                  <div className="shell-menu-group">
                    <span className="shell-menu-heading" aria-hidden="true">
                      {t("shell.navigation")}
                    </span>
                    <button
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={compact}
                      tabIndex={-1}
                      className="shell-menu-item"
                      onClick={() =>
                        setNavMode((mode) =>
                          mode === "compact" ? "full" : "compact",
                        )
                      }
                    >
                      <span className="theme-swatch" aria-hidden="true">
                        <PanelLeftClose />
                      </span>
                      <span className="shell-menu-text">
                        <strong>{t("shell.compactMenu")}</strong>
                        <small>Ctrl+B</small>
                      </span>
                      {compact ? (
                        <Check
                          className="shell-menu-check"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </div>
                )}
                <div className="shell-menu-group">
                  <span className="shell-menu-heading" aria-hidden="true">
                    {t("shell.system")}
                  </span>
                  {isAdmin ? (
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      className="shell-menu-item"
                      onClick={() => {
                        display.close();
                        navigate("/admin/sources");
                      }}
                    >
                      <span className="theme-swatch" aria-hidden="true">
                        <Settings2 />
                      </span>
                      <span className="shell-menu-text">
                        <strong>{t("shell.configureIntegrations")}</strong>
                        <small>
                          {library
                            ? `${t("shell.library")}: ${library.processed} ${t("shell.files")}`
                            : t("shell.checking")}
                        </small>
                      </span>
                    </button>
                  ) : null}
                  {devHealth ? (
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      className="shell-menu-item is-danger"
                      onClick={() => {
                        display.close();
                        setShutdownOpen(true);
                      }}
                    >
                      <span className="theme-swatch" aria-hidden="true">
                        <PowerOff />
                      </span>
                      <span className="shell-menu-text">
                        <strong>{t("shell.shutdown")}</strong>
                        <small>PID {devHealth.pid}</small>
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <a
            className="topbar-credit"
            href="https://andesnova.solutions"
            target="_blank"
            rel="noreferrer"
            title="Creado por andesnova.solutions"
          >
            <span aria-hidden="true">©</span>
            <span className="topbar-credit-text">andesnova.solutions</span>
          </a>

          {/* One click switches language: ES ⇄ EN, no menu. */}
          <button
            className="shell-menu-trigger is-icon"
            type="button"
            aria-label={`${t("shell.languageLabel")}: ${
              LANGUAGES.find((option) => option.code !== language)?.label ?? ""
            }`}
            title={t("shell.languageLabel")}
            onClick={() =>
              setLanguage(
                LANGUAGES.find((option) => option.code !== language)?.code ??
                  "es",
              )
            }
          >
            <Globe aria-hidden="true" />
            <span aria-hidden="true">{language.toUpperCase()}</span>
          </button>
        </div>
      </header>

      <aside
        id={sidebarId}
        className="sidebar"
        aria-label={t("shell.mainNav")}
        inert={isDrawer && !drawerOpen}
      >
        <nav>
          {NAV_GROUPS.map((group) => {
            const items = navItems.filter((item) => item.group === group);
            if (!items.length) return null;
            const groupInfo = GROUP_LABELS[language][group];
            return (
              <div className="nav-group" key={group} data-group={group}>
                <span className="nav-group-label" title={groupInfo.hint}>
                  {groupInfo.label}
                </span>
                {items.map((item) => {
                  const Icon = item.icon;
                  const label = t(item.labelKey);
                  const index = navigation.indexOf(item);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      data-bubble={(index % 6) + 1}
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onMouseEnter={(event) =>
                        showTooltip(event.currentTarget, label)
                      }
                      onMouseLeave={() => setTooltip(null)}
                      onFocus={(event) =>
                        showTooltip(event.currentTarget, label)
                      }
                      onBlur={() => setTooltip(null)}
                    >
                      <Icon aria-hidden="true" />
                      <span className="nav-label">{label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <GuideControls compact={compact} />
        <Link
          className="sidebar-footer-link"
          to="/admin"
          onMouseEnter={(event) =>
            showTooltip(event.currentTarget, t("shell.configureIntegrations"))
          }
          onMouseLeave={() => setTooltip(null)}
          onFocus={(event) =>
            showTooltip(event.currentTarget, t("shell.configureIntegrations"))
          }
          onBlur={() => setTooltip(null)}
        >
          <Settings2 aria-hidden="true" />
          <span className="nav-label">
            {isAdmin
              ? t("shell.configureIntegrations")
              : language === "en"
                ? "Administrator access"
                : "Acceso administrador"}
          </span>
        </Link>
      </aside>
      {tooltip ? (
        <div
          className="nav-tooltip"
          role="tooltip"
          style={{ top: tooltip.top }}
        >
          {tooltip.label}
        </div>
      ) : null}
      {isDrawer && drawerOpen ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label={t("shell.closeNav")}
          tabIndex={-1}
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <main className="workspace" aria-label={activeLabel} ref={workspaceRef}>
        <Suspense
          fallback={
            <div className="route-loading" role="status">
              <span className="route-loading-bar" />
              Cargando sección…
            </div>
          }
        >
          <SectionIntroBar pathname={location.pathname} />
          <div
            className="route-stage"
            key={activeItem?.path ?? location.pathname}
          >
            <Outlet />
          </div>
        </Suspense>
      </main>

      <footer className="live-strip">
        <strong>
          <i aria-hidden="true" />
          {t("shell.liveUpdates")}
        </strong>
        <span className="live-time">UTC {clock}</span>
        <span className="live-message">
          {latestEvent
            ? `${latestEvent.sourceName}: ${latestEvent.title}`
            : t("shell.noChanges")}
        </span>
        <Link to={latestEvent?.targetPath ?? "/news"}>
          {t("shell.viewUpdate")} <ArrowRight aria-hidden="true" />
        </Link>
      </footer>

      <nav className="mobile-tabs" aria-label={t("shell.mobileNav")}>
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path}>
              <Icon aria-hidden="true" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      <PrivacyNotice />
      <MobileDetailSheet workspaceRef={workspaceRef} />

      <ShutdownDialog
        open={shutdownOpen}
        onClose={() => setShutdownOpen(false)}
        onStopped={() => {
          setShutdownOpen(false);
          setServerStopped(true);
        }}
      />
    </div>
  );
}

/**
 * Combobox: typing filters the observatory sections for instant jumps; the
 * last option always searches the local library (the only full-text index).
 */
function GlobalSearch({
  inputRef,
  items,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  items: ReadonlyArray<(typeof navigation)[number]>;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const options = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const needle = normalizeSearch(trimmed);
    const sections = items
      .filter((item) => normalizeSearch(t(item.labelKey)).includes(needle))
      .slice(0, 5)
      .map((item) => ({
        id: item.path,
        label: t(item.labelKey),
        icon: item.icon,
        to: item.path,
        kind: "section" as const,
      }));
    return [
      ...sections,
      {
        id: "library",
        label: trimmed,
        icon: Library,
        to: `/local-library?q=${encodeURIComponent(trimmed)}`,
        kind: "library" as const,
      },
    ];
  }, [query, t, items]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    navigate(option.to);
    setOpen(false);
    if (option.kind === "section") setQuery("");
    inputRef.current?.blur();
  }

  const expanded = open && options.length > 0;

  return (
    <form
      className="global-search"
      aria-label={t("shell.searchLabel")}
      onSubmit={(event) => {
        event.preventDefault();
        choose(expanded ? active : options.length - 1);
      }}
    >
      <Search aria-hidden="true" />
      <input
        ref={inputRef}
        value={query}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          expanded ? `${listId}-${options[active]?.id ?? ""}` : undefined
        }
        aria-keyshortcuts="Control+K"
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (!expanded) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => (index + 1) % options.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => (index - 1 + options.length) % options.length);
          } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
          }
        }}
        placeholder={t("shell.searchPlaceholder")}
        aria-label={t("shell.searchLabel")}
      />
      <kbd title={t("shell.searchShortcut")}>Ctrl K</kbd>
      <div
        id={listId}
        role="listbox"
        className="search-results"
        aria-label={t("shell.searchLabel")}
        hidden={!expanded}
      >
        {options.map((option, index) => {
          const Icon = option.icon;
          return (
            <div
              key={option.id}
              id={`${listId}-${option.id}`}
              role="option"
              tabIndex={-1}
              aria-selected={index === active}
              className="search-option"
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              onKeyDown={() => undefined}
              onMouseEnter={() => setActive(index)}
            >
              <Icon aria-hidden="true" />
              {option.kind === "section" ? (
                <span>{option.label}</span>
              ) : (
                <span>
                  <small>{t("nav.localLibrary")} · </small>«{option.label}»
                </span>
              )}
              <ArrowRight className="search-option-go" aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </form>
  );
}

/** Three-stop preview of a palette: canvas, main accent and support accent. */
function ThemeDot({ swatch }: { swatch?: [string, string, string] }) {
  const [bg, a, b] = swatch ?? ["#faf8f5", "#8b5cf6", "#10b981"];
  return (
    <i className="theme-dot" aria-hidden="true">
      <b style={{ background: bg }} />
      <b style={{ background: a }} />
      <b style={{ background: b }} />
    </i>
  );
}
