import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AdminOnly } from "../features/admin/AdminOnly";
import { PlaceholderWorkspace } from "../features/common/PlaceholderWorkspace";
import { TodayPage } from "../features/today/TodayPage";
import { loaders } from "./routeLoaders";

// Every section except «Hoy» loads on demand: the first visit (mobile above
// all) downloads only the shell and the landing page.
const AdminConsole = lazy(() =>
  loaders.admin().then((module) => ({ default: module.AdminConsole })),
);
const ApiCatalogPage = lazy(() =>
  loaders.apiCatalog().then((module) => ({ default: module.ApiCatalogPage })),
);
const DeveloperLabPage = lazy(() =>
  loaders
    .developerLab()
    .then((module) => ({ default: module.DeveloperLabPage })),
);
const EvolutionPage = lazy(() =>
  loaders.evolution().then((module) => ({ default: module.EvolutionPage })),
);
const FavoritesPage = lazy(() =>
  loaders.favorites().then((module) => ({ default: module.FavoritesPage })),
);
const LaboratoryPage = lazy(() =>
  loaders.laboratory().then((module) => ({ default: module.LaboratoryPage })),
);
const LocalLibraryPage = lazy(() =>
  loaders
    .localLibrary()
    .then((module) => ({ default: module.LocalLibraryPage })),
);
const GlobalMapPage = lazy(() =>
  loaders.map().then((module) => ({ default: module.GlobalMapPage })),
);
const GitHubPage = lazy(() =>
  loaders.github().then((module) => ({ default: module.GitHubPage })),
);
const MarketPage = lazy(() =>
  loaders.markets().then((module) => ({ default: module.MarketPage })),
);
const ModelsRankingPage = lazy(() =>
  loaders.models().then((module) => ({ default: module.ModelsRankingPage })),
);
const NewsPage = lazy(() =>
  loaders.news().then((module) => ({ default: module.NewsPage })),
);
const OpenLocalPage = lazy(() =>
  loaders.openLocal().then((module) => ({ default: module.OpenLocalPage })),
);
const ProvidersPage = lazy(() =>
  loaders.providers().then((module) => ({ default: module.ProvidersPage })),
);
const ResearchPage = lazy(() =>
  loaders.research().then((module) => ({ default: module.ResearchPage })),
);
const PromptStudioPage = lazy(() =>
  loaders.prompts().then((module) => ({ default: module.PromptStudioPage })),
);
const InActionPage = lazy(() =>
  loaders.inAction().then((module) => ({ default: module.InActionPage })),
);
const VideosPage = lazy(() =>
  loaders.videos().then((module) => ({ default: module.VideosPage })),
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
        <Route
          path="/providers/*"
          element={
            <AdminOnly title="Proveedores">
              <ProvidersPage />
            </AdminOnly>
          }
        />
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
        <Route
          path="/laboratory/*"
          element={
            <AdminOnly title="Mi laboratorio">
              <LaboratoryPage />
            </AdminOnly>
          }
        />
        <Route path="/open-local/*" element={<OpenLocalPage />} />
        <Route path="/news/*" element={<NewsPage />} />
        <Route path="/research/*" element={<ResearchPage />} />
        <Route path="/github/*" element={<GitHubPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/markets/*" element={<MarketPage />} />
        <Route path="/admin/*" element={<AdminConsole />} />
        <Route path="/prompts/*" element={<PromptStudioPage />} />
        <Route path="/in-action/*" element={<InActionPage />} />
        <Route
          path="/local-library"
          element={
            <AdminOnly title="Biblioteca local">
              <LocalLibraryPage />
            </AdminOnly>
          }
        />
        <Route
          path="/local-library/:documentId"
          element={
            <AdminOnly title="Biblioteca local">
              <LocalLibraryPage />
            </AdminOnly>
          }
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
