import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AdminOnly } from "../features/admin/AdminOnly";
import { PlaceholderWorkspace } from "../features/common/PlaceholderWorkspace";
import { TodayPage } from "../features/today/TodayPage";

// Every section except «Hoy» loads on demand: the first visit (mobile above
// all) downloads only the shell and the landing page.
const AdminConsole = lazy(() =>
  import("../features/admin/AdminConsole").then((module) => ({
    default: module.AdminConsole,
  })),
);
const ApiCatalogPage = lazy(() =>
  import("../features/api-catalog/ApiCatalogPage").then((module) => ({
    default: module.ApiCatalogPage,
  })),
);
const DeveloperLabPage = lazy(() =>
  import("../features/developer-lab/DeveloperLabPage").then((module) => ({
    default: module.DeveloperLabPage,
  })),
);
const EvolutionPage = lazy(() =>
  import("../features/evolution/EvolutionPage").then((module) => ({
    default: module.EvolutionPage,
  })),
);
const FavoritesPage = lazy(() =>
  import("../features/favorites/FavoritesPage").then((module) => ({
    default: module.FavoritesPage,
  })),
);
const LaboratoryPage = lazy(() =>
  import("../features/laboratory/LaboratoryPage").then((module) => ({
    default: module.LaboratoryPage,
  })),
);
const LocalLibraryPage = lazy(() =>
  import("../features/local-library/LocalLibraryPage").then((module) => ({
    default: module.LocalLibraryPage,
  })),
);
const GlobalMapPage = lazy(() =>
  import("../features/maps/GlobalMapPage").then((module) => ({
    default: module.GlobalMapPage,
  })),
);
const GitHubPage = lazy(() =>
  import("../features/observatory/GitHubPage").then((module) => ({
    default: module.GitHubPage,
  })),
);
const MarketPage = lazy(() =>
  import("../features/observatory/MarketPage").then((module) => ({
    default: module.MarketPage,
  })),
);
const ModelsRankingPage = lazy(() =>
  import("../features/observatory/ModelsRankingPage").then((module) => ({
    default: module.ModelsRankingPage,
  })),
);
const NewsPage = lazy(() =>
  import("../features/observatory/NewsPage").then((module) => ({
    default: module.NewsPage,
  })),
);
const OpenLocalPage = lazy(() =>
  import("../features/observatory/OpenLocalPage").then((module) => ({
    default: module.OpenLocalPage,
  })),
);
const ProvidersPage = lazy(() =>
  import("../features/observatory/ProvidersPage").then((module) => ({
    default: module.ProvidersPage,
  })),
);
const ResearchPage = lazy(() =>
  import("../features/observatory/ResearchPage").then((module) => ({
    default: module.ResearchPage,
  })),
);
const PromptStudioPage = lazy(() =>
  import("../features/prompts/PromptStudioPage").then((module) => ({
    default: module.PromptStudioPage,
  })),
);
const VideosPage = lazy(() =>
  import("../features/videos/VideosPage").then((module) => ({
    default: module.VideosPage,
  })),
);

const placeholderRoutes = [
  [
    "/tools/*",
    "Herramientas",
    "Catálogo de herramientas y productos de inteligencia artificial.",
  ],
  ["/saved/*", "Guardados", "Elementos relevantes y listas de seguimiento."],
  ["/history/*", "Historial", "Cambios verificados y versiones de entidades."],
  ["/search/*", "Búsqueda global", "Búsqueda normalizada en la base local."],
  [
    "/settings/*",
    "Configuración",
    "Preferencias locales, hardware y modos de lectura.",
  ],
] as const;

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/providers/*" element={<ProvidersPage />} />
        <Route path="/models/*" element={<ModelsRankingPage />} />
        <Route path="/api-catalog/*" element={<ApiCatalogPage />} />
        <Route path="/evolution/*" element={<EvolutionPage />} />
        <Route
          path="/developer-lab/*"
          element={
            <AdminOnly title="Laboratorio de APIs">
              <DeveloperLabPage />
            </AdminOnly>
          }
        />
        <Route path="/map/*" element={<GlobalMapPage />} />
        <Route path="/videos/*" element={<VideosPage />} />
        <Route path="/laboratory/*" element={<LaboratoryPage />} />
        <Route path="/open-local/*" element={<OpenLocalPage />} />
        <Route path="/news/*" element={<NewsPage />} />
        <Route path="/research/*" element={<ResearchPage />} />
        <Route path="/github/*" element={<GitHubPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/markets/*" element={<MarketPage />} />
        <Route path="/admin/*" element={<AdminConsole />} />
        <Route path="/prompts/*" element={<PromptStudioPage />} />
        <Route path="/local-library" element={<LocalLibraryPage />} />
        <Route
          path="/local-library/:documentId"
          element={<LocalLibraryPage />}
        />
        {placeholderRoutes.map(([path, title, description]) => (
          <Route
            key={path}
            path={path}
            element={
              <PlaceholderWorkspace title={title} description={description} />
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Route>
    </Routes>
  );
}
