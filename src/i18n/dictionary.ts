// Interface language. Spanish stays the source of truth; English is a
// translation of the same keys. Strings live here rather than inline so the
// remaining module copy can be migrated key by key without touching layout.

export type Language = "es" | "en";

export const LANGUAGES: Array<{
  code: Language;
  label: string;
  short: string;
}> = [
  { code: "es", label: "Español", short: "ES" },
  { code: "en", label: "English", short: "EN" },
];

export const dictionary = {
  es: {
    "nav.today": "Hoy",
    "nav.providers": "Proveedores",
    "nav.models": "Modelos",
    "nav.developerLab": "Laboratorio de APIs",
    "nav.openLocal": "Open y local",
    "nav.news": "Noticias",
    "nav.research": "Investigación",
    "nav.github": "GitHub",
    "nav.videos": "Videos",
    "nav.map": "Mapa",
    "nav.markets": "Mercado IA",
    "nav.localLibrary": "Biblioteca local",
    "nav.laboratory": "Mi laboratorio",

    "shell.searchPlaceholder": "Buscar en tu biblioteca y el observatorio…",
    "shell.searchLabel": "Buscar en AMARU",
    "shell.themeToLight": "Cambiar a tema claro",
    "shell.themeToDark": "Cambiar a tema oscuro",
    "shell.light": "Claro",
    "shell.dark": "Oscuro",
    "shell.language": "Idioma",
    "shell.languageLabel": "Cambiar idioma",
    "shell.openNav": "Abrir navegación",
    "shell.closeNav": "Cerrar navegación",
    "shell.mainNav": "Navegación principal",
    "shell.mobileNav": "Navegación móvil",
    "shell.observatoryState": "Estado del observatorio",
    "shell.operational": "Operativo local",
    "shell.needsMigration": "Requiere migración",
    "shell.checking": "Comprobando",
    "shell.library": "Biblioteca",
    "shell.files": "archivos",
    "shell.configureIntegrations": "Configurar integraciones",
    "shell.liveUpdates": "Actualizaciones en vivo",
    "shell.noChanges": "Aún no se detectaron cambios de fuentes externas",
    "shell.viewUpdate": "Ver actualización",

    "today.title": "Hoy",
    "today.subtitle":
      "Resumen verificable del observatorio local conectado a internet",
    "today.sync": "Sincronizar fuentes",
    "today.modules": "Módulos del observatorio",
    "today.priceTrend": "Evolución del precio de entrada",
    "today.priceTrendHint":
      "USD por 1M de tokens · mediana del catálogo por fecha de ranking",
    "today.modelsByCountry": "Modelos por país",
    "today.modelsByCountryHint": "Registros indexados por país de origen",
    "today.systemHealth": "Salud del sistema",
    "today.connected": "Fuentes conectadas",
    "today.failed": "Fuentes fallidas",
    "today.stale": "Desactualizadas",
    "today.overall": "Estado general",
    "today.recentActivity": "Actividad reciente",
    "today.quickLinks": "Accesos rápidos",
    "today.noSeries":
      "Todavía no hay suficientes fechas de sincronización para trazar una serie. El histórico se construye con cada sincronización; no se simulan valores anteriores.",
    "today.noCountries":
      "Ningún registro indexado declara país de origen todavía.",
    "today.noActivity": "Aún no se detectaron cambios de fuentes externas.",

    "common.records": "registros",
    "common.sources": "fuentes",
    "common.viewAll": "Ver todas",
    "common.loading": "Cargando…",
  },
  en: {
    "nav.today": "Today",
    "nav.providers": "Providers",
    "nav.models": "Models",
    "nav.developerLab": "API Lab",
    "nav.openLocal": "Open & local",
    "nav.news": "News",
    "nav.research": "Research",
    "nav.github": "GitHub",
    "nav.videos": "Videos",
    "nav.map": "Map",
    "nav.markets": "AI Market",
    "nav.localLibrary": "Local library",
    "nav.laboratory": "My lab",

    "shell.searchPlaceholder": "Search your library and the observatory…",
    "shell.searchLabel": "Search AMARU",
    "shell.themeToLight": "Switch to light theme",
    "shell.themeToDark": "Switch to dark theme",
    "shell.light": "Light",
    "shell.dark": "Dark",
    "shell.language": "Language",
    "shell.languageLabel": "Change language",
    "shell.openNav": "Open navigation",
    "shell.closeNav": "Close navigation",
    "shell.mainNav": "Main navigation",
    "shell.mobileNav": "Mobile navigation",
    "shell.observatoryState": "Observatory state",
    "shell.operational": "Running locally",
    "shell.needsMigration": "Migration required",
    "shell.checking": "Checking",
    "shell.library": "Library",
    "shell.files": "files",
    "shell.configureIntegrations": "Configure integrations",
    "shell.liveUpdates": "Live updates",
    "shell.noChanges": "No external source changes detected yet",
    "shell.viewUpdate": "View update",

    "today.title": "Today",
    "today.subtitle":
      "Verifiable digest of the local observatory, connected to the internet",
    "today.sync": "Synchronize sources",
    "today.modules": "Observatory modules",
    "today.priceTrend": "Input price over time",
    "today.priceTrendHint":
      "USD per 1M tokens · catalogue median by ranking date",
    "today.modelsByCountry": "Models by country",
    "today.modelsByCountryHint": "Indexed records by country of origin",
    "today.systemHealth": "System health",
    "today.connected": "Connected sources",
    "today.failed": "Failed sources",
    "today.stale": "Stale",
    "today.overall": "Overall state",
    "today.recentActivity": "Recent activity",
    "today.quickLinks": "Quick links",
    "today.noSeries":
      "Not enough synchronization dates yet to plot a series. History builds with each sync; earlier values are never simulated.",
    "today.noCountries": "No indexed record declares a country of origin yet.",
    "today.noActivity": "No external source changes detected yet.",

    "common.records": "records",
    "common.sources": "sources",
    "common.viewAll": "View all",
    "common.loading": "Loading…",
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)["es"];

/**
 * Spanish is the product's default interface language, so it is never
 * overridden by the browser locale — English is an explicit opt-in through the
 * language control. Auto-detecting made the UI flip to English for any en-US
 * browser, which contradicted the project convention and broke the E2E suite.
 */
export function resolveInitialLanguage(stored: string | null): Language {
  return stored === "en" ? "en" : "es";
}
