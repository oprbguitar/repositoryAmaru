import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { PlaceholderWorkspace } from "../features/common/PlaceholderWorkspace";
import { DeveloperLabPage } from "../features/developer-lab/DeveloperLabPage";
import { LaboratoryPage } from "../features/laboratory/LaboratoryPage";
import { LocalLibraryPage } from "../features/local-library/LocalLibraryPage";
import { GlobalMapPage } from "../features/maps/GlobalMapPage";
import { AdminSourcesPage } from "../features/observatory/AdminSourcesPage";
import { CatalogPage } from "../features/observatory/CatalogPage";
import { GitHubPage } from "../features/observatory/GitHubPage";
import { MarketPage } from "../features/observatory/MarketPage";
import { ModelsRankingPage } from "../features/observatory/ModelsRankingPage";
import { NewsPage } from "../features/observatory/NewsPage";
import { OpenLocalPage } from "../features/observatory/OpenLocalPage";
import { ResearchPage } from "../features/observatory/ResearchPage";
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
        <Route path="/providers/*" element={<CatalogPage mode="providers" />} />
        <Route path="/models/*" element={<ModelsRankingPage />} />
        <Route path="/developer-lab/*" element={<DeveloperLabPage />} />
        <Route path="/map/*" element={<GlobalMapPage />} />
        <Route path="/videos/*" element={<VideosPage />} />
        <Route path="/laboratory/*" element={<LaboratoryPage />} />
        <Route path="/open-local/*" element={<OpenLocalPage />} />
        <Route path="/news/*" element={<NewsPage />} />
        <Route path="/research/*" element={<ResearchPage />} />
        <Route path="/github/*" element={<GitHubPage />} />
        <Route path="/markets/*" element={<MarketPage />} />
        <Route path="/admin/*" element={<AdminSourcesPage />} />
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
