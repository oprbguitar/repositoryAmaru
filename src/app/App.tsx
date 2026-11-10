import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AdminConsole } from "../features/admin/AdminConsole";
import { AdminOnly } from "../features/admin/AdminOnly";
import { ApiCatalogPage } from "../features/api-catalog/ApiCatalogPage";
import { PlaceholderWorkspace } from "../features/common/PlaceholderWorkspace";
import { DeveloperLabPage } from "../features/developer-lab/DeveloperLabPage";
import { EvolutionPage } from "../features/evolution/EvolutionPage";
import { FavoritesPage } from "../features/favorites/FavoritesPage";
import { LaboratoryPage } from "../features/laboratory/LaboratoryPage";
import { LocalLibraryPage } from "../features/local-library/LocalLibraryPage";
import { GlobalMapPage } from "../features/maps/GlobalMapPage";
import { GitHubPage } from "../features/observatory/GitHubPage";
import { MarketPage } from "../features/observatory/MarketPage";
import { ModelsRankingPage } from "../features/observatory/ModelsRankingPage";
import { NewsPage } from "../features/observatory/NewsPage";
import { OpenLocalPage } from "../features/observatory/OpenLocalPage";
import { ProvidersPage } from "../features/observatory/ProvidersPage";
import { ResearchPage } from "../features/observatory/ResearchPage";
import { PromptStudioPage } from "../features/prompts/PromptStudioPage";
import { TodayPage } from "../features/today/TodayPage";
import { VideosPage } from "../features/videos/VideosPage";

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
