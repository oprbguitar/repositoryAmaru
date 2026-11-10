/**
 * Catálogo de integraciones configurables desde la interfaz.
 *
 * Cubre credenciales de FUENTES DE DATOS (mercado, video y redes, código,
 * investigación, noticias y análisis documental). Las claves de proveedores de
 * modelos se configuran en «Laboratorio de APIs», que tiene su propio registro
 * y su propia prueba de conexión: duplicarlas aquí crearía dos almacenes para
 * el mismo binding.
 */

import { EXTRA_INTEGRATIONS } from "./catalog-extra";

export type IntegrationCategory =
  | "market"
  | "video"
  | "code"
  | "research"
  | "news"
  | "analysis"
  | "models"
  | "opendata"
  | "patents"
  | "social";

export type ProbeOutcome = { httpStatus: number; ok: boolean; detail: string };

export type IntegrationProbe = {
  /** URL real que se consulta para verificar la credencial. */
  url?: (credential: string) => string;
  /** Cabeceras adicionales (por ejemplo Authorization). */
  headers?: (credential: string) => Record<string, string>;
  /** Otros bindings que la prueba necesita (pares id + secreto). */
  needs?: string[];
  /** Una respuesta 2xx cuyo cuerpo cumpla esto se considera fallida. */
  rejectBody?: RegExp;
  /** Prueba a medida (intercambio OAuth, POST, Basic). Recibe los secretos de `needs`. */
  run?: (
    credential: string,
    secrets: Record<string, string>,
  ) => Promise<ProbeOutcome>;
};

export type IntegrationDefinition = {
  binding: string;
  name: string;
  category: IntegrationCategory;
  /** Qué habilita en la aplicación, en términos de lo que el usuario ve. */
  unlocks: string;
  /** Identificadores de source_registry que dependen de esta credencial. */
  sourceIds: string[];
  apiKeyUrl: string;
  documentationUrl: string;
  freeTierNote: string;
  probe: IntegrationProbe | null;
  /** Longitud mínima del valor (por defecto 8; identificadores cortos usan menos). */
  minLength?: number;
  /** Verificación real del endpoint de prueba: respuesta sin clave y fecha. */
  verified?: string;
  /** Advertencia sobre el alcance de la prueba. */
  probeNote?: string;
};

export const INTEGRATION_CATEGORIES: Array<{
  id: IntegrationCategory;
  label: string;
  description: string;
}> = [
  {
    id: "market",
    label: "Mercado y finanzas",
    description:
      "Cotizaciones intradía y series económicas del módulo «Mercado IA».",
  },
  {
    id: "video",
    label: "Video y redes",
    description:
      "Catálogos oficiales de video. Sin credencial no se muestra contenido de la plataforma.",
  },
  {
    id: "code",
    label: "Código y modelos abiertos",
    description: "Rankings de repositorios y catálogos de modelos abiertos.",
  },
  {
    id: "research",
    label: "Investigación",
    description: "Metadatos de publicaciones científicas.",
  },
  {
    id: "news",
    label: "Noticias",
    description: "Agregadores de prensa con licencia de uso personal.",
  },
  {
    id: "models",
    label: "Modelos y hubs",
    description: "Catálogos de modelos y datasets.",
  },
  {
    id: "opendata",
    label: "Datos abiertos",
    description: "Portales de datos públicos.",
  },
  {
    id: "patents",
    label: "Patentes",
    description: "Oficinas y buscadores de patentes.",
  },
  {
    id: "social",
    label: "Redes sociales",
    description: "Conversación pública en redes.",
  },
  {
    id: "analysis",
    label: "Análisis documental",
    description: "Modelos usados para analizar la biblioteca local.",
  },
];

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    binding: "FINNHUB_API_KEY",
    name: "Finnhub",
    category: "market",
    unlocks:
      "Cotizaciones intradía de las empresas de IA en «Mercado IA» (precio, variación y rango del día).",
    sourceIds: ["finnhub"],
    apiKeyUrl: "https://finnhub.io/dashboard",
    documentationUrl: "https://finnhub.io/docs/api/quote",
    freeTierNote: "Plan gratuito: 60 llamadas por minuto.",
    probe: {
      url: (credential) =>
        `https://finnhub.io/api/v1/quote?symbol=NVDA&token=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "TWELVE_DATA_API_KEY",
    name: "Twelve Data",
    category: "market",
    unlocks: "Alternativa de cotizaciones si Finnhub agota su cuota.",
    sourceIds: [],
    apiKeyUrl: "https://twelvedata.com/account/api-keys",
    documentationUrl: "https://twelvedata.com/docs",
    freeTierNote: "Plan gratuito: 800 llamadas al día.",
    probe: {
      url: (credential) =>
        `https://api.twelvedata.com/quote?symbol=NVDA&apikey=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "FRED_API_KEY",
    name: "FRED (Reserva Federal)",
    category: "market",
    unlocks:
      "Serie macroeconómica en «Mercado IA»: tasa de fondos federales, NASDAQ Composite, IPC y PIB de Estados Unidos.",
    sourceIds: ["fred"],
    apiKeyUrl: "https://fredaccount.stlouisfed.org/apikeys",
    documentationUrl: "https://fred.stlouisfed.org/docs/api/fred/",
    freeTierNote: "Gratuita con registro.",
    probe: {
      url: (credential) =>
        `https://api.stlouisfed.org/fred/series?series_id=GDP&file_type=json&api_key=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "YOUTUBE_API_KEY",
    name: "YouTube Data API",
    category: "video",
    unlocks:
      "Sección de YouTube en «Videos»: subidas de canales oficiales y consultas temáticas.",
    sourceIds: ["youtube"],
    apiKeyUrl: "https://console.cloud.google.com/apis/credentials",
    documentationUrl: "https://developers.google.com/youtube/v3/docs",
    freeTierNote: "Cuota diaria de 10 000 unidades; cada búsqueda cuesta 100.",
    probe: {
      url: (credential) =>
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@OpenAI&key=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "FACEBOOK_PAGE_ACCESS_TOKEN",
    name: "Meta Graph API (páginas)",
    category: "video",
    unlocks:
      "Sección de Facebook en «Videos»: videos publicados por las páginas a las que autoriza el token.",
    sourceIds: ["facebook-videos"],
    apiKeyUrl: "https://developers.facebook.com/tools/explorer/",
    documentationUrl:
      "https://developers.facebook.com/docs/graph-api/reference/page/videos/",
    freeTierNote:
      "Requiere permisos pages_read_engagement y pages_show_list. Los tokens de corta duración caducan en horas.",
    probe: {
      url: (credential) =>
        `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "X_BEARER_TOKEN",
    name: "X (API v2)",
    category: "social",
    unlocks: "Búsqueda reciente oficial de X.",
    sourceIds: [],
    apiKeyUrl: "https://developer.x.com/en/portal/dashboard",
    documentationUrl:
      "https://developer.x.com/en/docs/x-api/tweets/search/introduction",
    freeTierNote: "El plan gratuito no incluye búsqueda reciente.",
    probe: {
      url: () =>
        "https://api.x.com/2/tweets/search/recent?query=artificial%20intelligence&max_results=10",
      headers: (credential) => ({ authorization: `Bearer ${credential}` }),
    },
  },
  {
    binding: "GITHUB_TOKEN",
    name: "GitHub",
    category: "code",
    unlocks:
      "Rankings de repositorios sin el límite de 10 peticiones por minuto del acceso anónimo.",
    sourceIds: ["github"],
    apiKeyUrl: "https://github.com/settings/tokens",
    documentationUrl: "https://docs.github.com/en/rest",
    freeTierNote:
      "Un token de solo lectura eleva el límite a 5 000 peticiones por hora.",
    probe: {
      url: () => "https://api.github.com/rate_limit",
      headers: (credential) => ({ authorization: `Bearer ${credential}` }),
    },
  },
  {
    binding: "HUGGINGFACE_TOKEN",
    name: "Hugging Face",
    category: "models",
    unlocks: "Catálogo de modelos, datasets y spaces con límites ampliados.",
    sourceIds: ["hugging-face"],
    apiKeyUrl: "https://huggingface.co/settings/tokens",
    documentationUrl: "https://huggingface.co/docs/hub/api",
    freeTierNote: "Token de lectura suficiente.",
    probe: {
      url: () => "https://huggingface.co/api/whoami-v2",
      headers: (credential) => ({ authorization: `Bearer ${credential}` }),
    },
  },
  {
    binding: "SEMANTIC_SCHOLAR_API_KEY",
    name: "Semantic Scholar",
    category: "research",
    unlocks:
      "Fuente «Semantic Scholar» en Investigación: resúmenes, citas y PDF de acceso abierto.",
    sourceIds: ["semantic-scholar"],
    apiKeyUrl: "https://www.semanticscholar.org/product/api#api-key",
    documentationUrl: "https://api.semanticscholar.org/api-docs/",
    freeTierNote:
      "Clave gratuita previa solicitud. Sin ella la API responde 429 casi siempre.",
    probe: {
      url: () =>
        "https://api.semanticscholar.org/graph/v1/paper/search?query=llm&limit=1",
      headers: (credential) => ({ "x-api-key": credential }),
    },
  },
  {
    binding: "CORE_API_KEY",
    name: "CORE",
    category: "research",
    unlocks:
      "Fuente «CORE» en Investigación: textos completos de repositorios institucionales de acceso abierto.",
    sourceIds: ["core"],
    apiKeyUrl: "https://core.ac.uk/services/api",
    documentationUrl: "https://api.core.ac.uk/docs/v3",
    freeTierNote:
      "Clave gratuita para uso académico: 10 000 peticiones al día.",
    probe: {
      url: () => "https://api.core.ac.uk/v3/search/works?q=llm&limit=1",
      headers: (credential) => ({ authorization: `Bearer ${credential}` }),
    },
  },
  {
    binding: "GUARDIAN_API_KEY",
    name: "The Guardian",
    category: "news",
    unlocks:
      "Fuente «The Guardian» en Noticias: artículos sobre inteligencia artificial con su firma y sección.",
    sourceIds: ["guardian"],
    apiKeyUrl: "https://open-platform.theguardian.com/access/",
    documentationUrl: "https://open-platform.theguardian.com/documentation/",
    freeTierNote: "Clave de desarrollador gratuita: 500 llamadas al día.",
    probe: {
      url: (credential) =>
        `https://content.guardianapis.com/search?q=artificial%20intelligence&page-size=1&api-key=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "NEWSAPI_API_KEY",
    name: "NewsAPI",
    category: "news",
    unlocks:
      "Fuente «NewsAPI» en Noticias: titulares de prensa internacional, incluida la publicada en español.",
    sourceIds: ["newsapi"],
    apiKeyUrl: "https://newsapi.org/account",
    documentationUrl: "https://newsapi.org/docs",
    freeTierNote: "Plan de desarrollo: 100 peticiones al día, solo local.",
    probe: {
      url: (credential) =>
        `https://newsapi.org/v2/top-headlines?category=technology&pageSize=1&apiKey=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "NVIDIA_API_KEY",
    name: "NVIDIA NIM",
    category: "analysis",
    unlocks:
      "Botón «Analizar» de la Biblioteca local (resumen, entidades y riesgos del documento).",
    sourceIds: [],
    apiKeyUrl: "https://build.nvidia.com/",
    documentationUrl: "https://docs.nvidia.com/nim/",
    freeTierNote: "Créditos gratuitos de evaluación al registrarse.",
    probe: {
      url: () => "https://integrate.api.nvidia.com/v1/models",
      headers: (credential) => ({ authorization: `Bearer ${credential}` }),
    },
  },
  ...EXTRA_INTEGRATIONS,
  {
    binding: "ALPHA_VANTAGE_API_KEY",
    name: "Alpha Vantage",
    category: "market",
    unlocks:
      "Respaldo de precios diarios de «Mercado IA» (cierres que alimentan indicadores y proyecciones).",
    sourceIds: [],
    apiKeyUrl: "https://www.alphavantage.co/support/#api-key",
    documentationUrl: "https://www.alphavantage.co/documentation/",
    freeTierNote:
      "Plan gratuito: 25 peticiones al día. La prueba no rechaza claves inválidas (el endpoint responde igual).",
    probe: {
      url: (credential) =>
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "FMP_API_KEY",
    name: "Financial Modeling Prep",
    category: "market",
    unlocks: "Respaldo de precios diarios de «Mercado IA».",
    sourceIds: [],
    apiKeyUrl:
      "https://site.financialmodelingprep.com/developer/docs/dashboard",
    documentationUrl: "https://site.financialmodelingprep.com/developer/docs",
    freeTierNote: "Plan gratuito: 250 peticiones al día.",
    probe: {
      url: (credential) =>
        `https://financialmodelingprep.com/stable/quote?symbol=NVDA&apikey=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "POLYGON_API_KEY",
    name: "Polygon.io",
    category: "market",
    unlocks: "Respaldo de precios diarios de «Mercado IA» (cierres EOD).",
    sourceIds: [],
    apiKeyUrl: "https://polygon.io/dashboard/api-keys",
    documentationUrl: "https://polygon.io/docs/stocks",
    freeTierNote:
      "Plan gratuito: 5 peticiones por minuto, datos de fin de día.",
    probe: {
      url: (credential) =>
        `https://api.polygon.io/v2/aggs/ticker/NVDA/prev?apiKey=${encodeURIComponent(credential)}`,
    },
  },
  {
    binding: "MARKETSTACK_API_KEY",
    name: "Marketstack",
    category: "market",
    unlocks: "Respaldo de precios diarios de «Mercado IA» (EOD).",
    sourceIds: [],
    apiKeyUrl: "https://marketstack.com/dashboard",
    documentationUrl: "https://marketstack.com/documentation",
    freeTierNote: "Plan gratuito: 100 peticiones al mes y solo HTTP.",
    probe: {
      url: (credential) =>
        `http://api.marketstack.com/v1/eod?access_key=${encodeURIComponent(credential)}&symbols=NVDA&limit=1`,
    },
  },
  {
    binding: "TIINGO_API_KEY",
    name: "Tiingo",
    category: "market",
    unlocks: "Respaldo de precios diarios de «Mercado IA».",
    sourceIds: [],
    apiKeyUrl: "https://www.tiingo.com/account/api/token",
    documentationUrl: "https://www.tiingo.com/documentation/end-of-day",
    freeTierNote: "Plan gratuito: 1 000 peticiones al día.",
    probe: {
      url: (credential) =>
        `https://api.tiingo.com/tiingo/daily/NVDA/prices?token=${encodeURIComponent(credential)}`,
    },
  },
];

export function getIntegration(
  binding: string,
): IntegrationDefinition | undefined {
  return INTEGRATIONS.find((entry) => entry.binding === binding);
}

export const INTEGRATION_BINDINGS = INTEGRATIONS.map((entry) => entry.binding);
