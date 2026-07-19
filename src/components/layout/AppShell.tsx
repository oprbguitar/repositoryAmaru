import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Command,
  Menu,
  Moon,
  Search,
  Settings2,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import type { ApiResponse, LibraryStats } from "../../../types/api";
import { getLiveEvents } from "../../features/observatory/api";
import { Brand } from "./Brand";
import { mobileNavigation, navigation } from "./navigation";
import { nextTheme, resolveInitialTheme } from "./theme";

async function fetchStatus(): Promise<ApiResponse<LibraryStats>> {
  const response = await fetch("/api/status");
  if (!response.ok) throw new Error("status_unavailable");
  return response.json();
}

function useClock() {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setDate(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return {
    time: new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(date),
    day: new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
  };
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const clock = useClock();
  const [menuOpen, setMenuOpen] = useState(false);
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
      ? "Operativo local"
      : state?.databaseStatus === "needs_migration"
        ? "Requiere migración"
        : "Comprobando";
  const activeLabel = useMemo(
    () =>
      navigation.find((item) => location.pathname.startsWith(item.path))
        ?.label ?? "AMARU",
    [location.pathname],
  );

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
            placeholder="Buscar en tu biblioteca y el observatorio…"
            aria-label="Buscar en AMARU"
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
            aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
            title={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
            {theme === "dark" ? "Claro" : "Oscuro"}
          </button>
          <div className="utc">
            <span>UTC {clock.time}</span>
            <strong>{clock.day}</strong>
          </div>
          <button
            className="icon-button notification"
            aria-label="Notificaciones"
            type="button"
          >
            <Bell />
            <span>0</span>
          </button>
          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Cerrar navegación" : "Abrir navegación"}
            type="button"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <aside
        className={`sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label="Navegación principal"
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
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="observatory-status">
          <span className="eyebrow">Estado del observatorio</span>
          <strong className="status-line">
            <i className={state?.databaseStatus === "ready" ? "ok" : "warn"} />
            {statusLabel}
          </strong>
          <div className="status-pair">
            <span>Biblioteca</span>
            <strong>{state?.processed ?? 0} archivos</strong>
          </div>
          <div className="progress">
            <span
              style={{
                width: state?.databaseStatus === "ready" ? "100%" : "28%",
              }}
            />
          </div>
          <Link to="/admin/sources">
            <Settings2 /> Configurar integraciones
          </Link>
        </div>
      </aside>

      <main className="workspace" aria-label={activeLabel}>
        <Outlet />
      </main>

      <footer className="live-strip">
        <strong>
          <i />
          Actualizaciones en vivo
        </strong>
        <span className="live-time">{clock.time}</span>
        <span className="live-tag">REAL</span>
        <span className="live-message">
          {liveEvents.data?.data[0]
            ? `${liveEvents.data.data[0].sourceName}: ${liveEvents.data.data[0].title}`
            : "Aún no se detectaron cambios de fuentes externas"}
        </span>
        <Link to={liveEvents.data?.data[0]?.targetPath ?? "/admin/sources"}>
          Ver actualización <span aria-hidden="true">→</span>
        </Link>
      </footer>

      <nav className="mobile-tabs" aria-label="Navegación móvil">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path}>
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
