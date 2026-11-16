/**
 * One loader per lazily loaded section. `App` builds its `lazy()` routes from
 * these, and the shell calls `preloadRoute()` on hover/focus/touch and in idle
 * time, so by the time a visitor clicks, the section's code is already here.
 * Each import is memoised: calling a loader twice never downloads twice.
 */
type Loader = () => Promise<unknown>;

function once<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending)
      pending = load().catch((error) => {
        pending = null; // allow a retry after a network hiccup
        throw error;
      });
    return pending;
  };
}

export const loaders = {
  admin: once(() => import("../features/admin/AdminConsole")),
  apiCatalog: once(() => import("../features/api-catalog/ApiCatalogPage")),
  developerLab: once(
    () => import("../features/developer-lab/DeveloperLabPage"),
  ),
  evolution: once(() => import("../features/evolution/EvolutionPage")),
  favorites: once(() => import("../features/favorites/FavoritesPage")),
  laboratory: once(() => import("../features/laboratory/LaboratoryPage")),
  localLibrary: once(
    () => import("../features/local-library/LocalLibraryPage"),
  ),
  map: once(() => import("../features/maps/GlobalMapPage")),
  github: once(() => import("../features/observatory/GitHubPage")),
  markets: once(() => import("../features/observatory/MarketPage")),
  models: once(() => import("../features/observatory/ModelsRankingPage")),
  news: once(() => import("../features/observatory/NewsPage")),
  openLocal: once(() => import("../features/observatory/OpenLocalPage")),
  providers: once(() => import("../features/observatory/ProvidersPage")),
  research: once(() => import("../features/observatory/ResearchPage")),
  prompts: once(() => import("../features/prompts/PromptStudioPage")),
  videos: once(() => import("../features/videos/VideosPage")),
} satisfies Record<string, Loader>;

const BY_PATH: Record<string, Loader> = {
  "/admin": loaders.admin,
  "/api-catalog": loaders.apiCatalog,
  "/developer-lab": loaders.developerLab,
  "/evolution": loaders.evolution,
  "/favorites": loaders.favorites,
  "/laboratory": loaders.laboratory,
  "/local-library": loaders.localLibrary,
  "/map": loaders.map,
  "/github": loaders.github,
  "/markets": loaders.markets,
  "/models": loaders.models,
  "/news": loaders.news,
  "/open-local": loaders.openLocal,
  "/providers": loaders.providers,
  "/research": loaders.research,
  "/prompts": loaders.prompts,
  "/videos": loaders.videos,
};

/** Starts downloading a section's code; safe to call repeatedly. */
export function preloadRoute(path: string) {
  const key = Object.keys(BY_PATH).find((prefix) => path.startsWith(prefix));
  const loader = key ? BY_PATH[key] : undefined;
  loader?.().catch(() => undefined);
}

/**
 * Warms every listed section one after another while the browser is idle.
 * Heavy chunks (the map) go last; slow or data-saver connections skip it.
 */
export function preloadInIdle(paths: ReadonlyArray<string>) {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (connection?.saveData || /2g/.test(connection?.effectiveType ?? ""))
    return () => undefined;
  const queue = [...paths].sort(
    (a, b) => Number(a === "/map") - Number(b === "/map"),
  );
  let cancelled = false;
  const idle =
    window.requestIdleCallback ??
    ((callback: () => void) => window.setTimeout(callback, 200));
  const next = () => {
    if (cancelled) return;
    const path = queue.shift();
    if (!path) return;
    const key = Object.keys(BY_PATH).find((prefix) => path.startsWith(prefix));
    const loader = key ? BY_PATH[key] : undefined;
    (loader ? loader() : Promise.resolve())
      .catch(() => undefined)
      .finally(() => idle(next));
  };
  const timer = window.setTimeout(() => idle(next), 1200);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}
