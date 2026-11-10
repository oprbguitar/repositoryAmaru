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
    "nav.apiCatalog": "APIs y proyectos",
    "nav.evolution": "Evolución IA",
    "nav.developerLab": "Laboratorio de APIs",
    "nav.openLocal": "Open y local",
    "nav.news": "Noticias",
    "nav.research": "Investigación",
    "nav.github": "GitHub",
    "nav.favorites": "Mis favoritos",
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
    "shell.themePastel": "Pastel",
    "shell.themePastelHint": "Amigable y colorido (predeterminado)",
    "nav.prompts": "Prompts y agentes",
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
    "shell.configureIntegrations": "Administración",
    "shell.liveUpdates": "Actualizaciones en vivo",
    "shell.noChanges": "Aún no se detectaron cambios de fuentes externas",
    "shell.viewUpdate": "Ver actualización",
    "shell.collapseNav": "Contraer menú lateral",
    "shell.expandNav": "Expandir menú lateral",
    "shell.breadcrumb": "Ubicación actual",
    "shell.display": "Visualización",
    "shell.displayLabel": "Opciones de visualización y sistema",
    "shell.theme": "Tema",
    "shell.themeContrastLight": "Alto contraste claro",
    "shell.themeContrastDark": "Alto contraste oscuro",
    "shell.themeDarkHint": "Navy del logo, uso diario",
    "shell.themeLightHint": "Superficies claras",
    "shell.themeContrastLightHint": "Negro sobre blanco",
    "shell.themeContrastDarkHint": "Blanco sobre negro",
    "shell.navigation": "Navegación",
    "shell.compactMenu": "Menú compacto (solo iconos)",
    "shell.system": "Sistema",
    "shell.sources": "Fuentes",
    "shell.sourcesConnected": "{connected} de {enabled} conectadas",
    "shell.sourcesFailed": "{failed} con error",
    "shell.sourcesEmpty": "Sin fuentes activas",
    "shell.sourcesUnavailable": "Estado no disponible",
    "shell.searchShortcut": "Atajo: Ctrl+K",
    "shell.shutdown": "Apagar servidor",
    "shell.shutdownTitle": "¿Apagar el servidor local?",
    "shell.shutdownBody":
      "Se detendrá el servidor de desarrollo de este equipo. La aplicación dejará de responder hasta que lo vuelvas a iniciar. Los datos guardados no se pierden.",
    "shell.shutdownConfirm": "Apagar ahora",
    "shell.shuttingDown": "Apagando…",
    "shell.shutdownFailed":
      "No se pudo apagar desde aquí. Usa Apagar-Servidor.cmd en la carpeta del proyecto.",
    "shell.cancel": "Cancelar",
    "shell.offTitle": "Servidor apagado",
    "shell.offBody":
      "Vuelve a iniciarlo con Iniciar-Servidor-Local.cmd (doble clic en la carpeta del proyecto) y luego recarga esta página.",
    "shell.reload": "Recargar página",

    "today.title": "Hoy",
    "today.subtitle":
      "Resumen verificable del observatorio de inteligencia artificial",
    "today.sync": "Sincronizar fuentes",
    "today.modules": "Módulos del observatorio",
    "today.priceTrend": "Evolución del precio de entrada",
    "today.priceTrendHint":
      "USD por 1M de tokens de entrada · una línea por modelo, un punto por sincronización",
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
      "Todavía no hay dos fechas de sincronización con los mismos modelos. El histórico se construye con cada sincronización; no se simulan valores anteriores.",
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
    "nav.apiCatalog": "APIs & projects",
    "nav.evolution": "AI Evolution",
    "nav.developerLab": "API Lab",
    "nav.openLocal": "Open & local",
    "nav.news": "News",
    "nav.research": "Research",
    "nav.github": "GitHub",
    "nav.favorites": "My favorites",
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
    "shell.themePastel": "Pastel",
    "shell.themePastelHint": "Friendly and colourful (default)",
    "nav.prompts": "Prompts & agents",
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
    "shell.configureIntegrations": "Administration",
    "shell.liveUpdates": "Live updates",
    "shell.noChanges": "No external source changes detected yet",
    "shell.viewUpdate": "View update",
    "shell.collapseNav": "Collapse side menu",
    "shell.expandNav": "Expand side menu",
    "shell.breadcrumb": "Current location",
    "shell.display": "Display",
    "shell.displayLabel": "Display and system options",
    "shell.theme": "Theme",
    "shell.themeContrastLight": "High contrast light",
    "shell.themeContrastDark": "High contrast dark",
    "shell.themeDarkHint": "Logo navy, everyday use",
    "shell.themeLightHint": "Light surfaces",
    "shell.themeContrastLightHint": "Black on white",
    "shell.themeContrastDarkHint": "White on black",
    "shell.navigation": "Navigation",
    "shell.compactMenu": "Compact menu (icons only)",
    "shell.system": "System",
    "shell.sources": "Sources",
    "shell.sourcesConnected": "{connected} of {enabled} connected",
    "shell.sourcesFailed": "{failed} failing",
    "shell.sourcesEmpty": "No active sources",
    "shell.sourcesUnavailable": "Status unavailable",
    "shell.searchShortcut": "Shortcut: Ctrl+K",
    "shell.shutdown": "Shut down server",
    "shell.shutdownTitle": "Shut down the local server?",
    "shell.shutdownBody":
      "This stops the development server on this computer. The app stops responding until you start it again. Saved data is kept.",
    "shell.shutdownConfirm": "Shut down now",
    "shell.shuttingDown": "Shutting down…",
    "shell.shutdownFailed":
      "Could not shut down from here. Use Apagar-Servidor.cmd in the project folder.",
    "shell.cancel": "Cancel",
    "shell.offTitle": "Server stopped",
    "shell.offBody":
      "Start it again with Iniciar-Servidor-Local.cmd (double-click it in the project folder), then reload this page.",
    "shell.reload": "Reload page",

    "today.title": "Today",
    "today.subtitle":
      "Verifiable digest of the local observatory, connected to the internet",
    "today.sync": "Synchronize sources",
    "today.modules": "Observatory modules",
    "today.priceTrend": "Input price over time",
    "today.priceTrendHint":
      "USD per 1M input tokens · one line per model, one point per synchronization",
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
      "No two synchronization dates share the same models yet. History builds with each sync; earlier values are never simulated.",
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
