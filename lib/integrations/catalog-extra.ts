/**
 * Integraciones adicionales (configuración personal y temporal de claves).
 *
 * `verified` anota lo que devolvió el endpoint de prueba al consultarlo con
 * curl SIN clave válida el 2026-11-09: un 401/403 prueba que el endpoint existe
 * y exige clave. La ruta feliz con clave válida no se pudo comprobar sin las
 * claves del usuario. Los pares id + secreto se guardan como dos bindings y la
 * prueba de cada mitad usa ambos.
 */
import type {
  IntegrationCategory,
  IntegrationDefinition,
  IntegrationProbe,
  ProbeOutcome,
} from "./catalog";

const q = encodeURIComponent;
const bearer = (c: string) => ({ authorization: `Bearer ${c}` });
const UA = "AMARU-AI-Observatory/0.1 (local-first research application)";

async function call(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: { "user-agent": UA, accept: "application/json", ...init.headers },
    signal: AbortSignal.timeout(15_000),
  });
}

async function outcome(
  response: Response,
  tokenField?: string,
): Promise<ProbeOutcome> {
  const text = await response.text().catch(() => "");
  const ok = tokenField
    ? response.ok && text.includes(`"${tokenField}"`)
    : response.ok;
  return { httpStatus: response.status, ok, detail: text.slice(0, 160) };
}

const basic = (user: string, secret: string) => ({
  authorization: `Basic ${btoa(`${user}:${secret}`)}`,
});
const form = (data: Record<string, string>) => new URLSearchParams(data);
const grant = { grant_type: "client_credentials" };

type Pair = {
  id: string;
  secret: string;
  run: (id: string, secret: string) => Promise<ProbeOutcome>;
};

const kaggle: Pair = {
  id: "KAGGLE_USERNAME",
  secret: "KAGGLE_KEY",
  run: async (user, key) =>
    outcome(
      await call(
        "https://www.kaggle.com/api/v1/kernels/list?user=kaggle&pageSize=1",
        { headers: basic(user, key) },
      ),
    ),
};
const twitch: Pair = {
  id: "TWITCH_CLIENT_ID",
  secret: "TWITCH_CLIENT_SECRET",
  run: async (id, secret) =>
    outcome(
      await call("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        body: form({ client_id: id, client_secret: secret, ...grant }),
      }),
      "access_token",
    ),
};
const dailymotion: Pair = {
  id: "DAILYMOTION_API_KEY",
  secret: "DAILYMOTION_API_SECRET",
  run: async (id, secret) =>
    outcome(
      await call("https://api.dailymotion.com/oauth/token", {
        method: "POST",
        body: form({ client_id: id, client_secret: secret, ...grant }),
      }),
      "access_token",
    ),
};
const reddit: Pair = {
  id: "REDDIT_CLIENT_ID",
  secret: "REDDIT_CLIENT_SECRET",
  run: async (id, secret) =>
    outcome(
      await call("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: basic(id, secret),
        body: form(grant),
      }),
      "access_token",
    ),
};
const epo: Pair = {
  id: "EPO_OPS_CONSUMER_KEY",
  secret: "EPO_OPS_CONSUMER_SECRET",
  run: async (id, secret) =>
    outcome(
      await call("https://ops.epo.org/3.2/auth/accesstoken", {
        method: "POST",
        headers: basic(id, secret),
        body: form(grant),
      }),
      "access_token",
    ),
};
const bluesky: Pair = {
  id: "BLUESKY_HANDLE",
  secret: "BLUESKY_APP_PASSWORD",
  run: async (handle, password) =>
    outcome(
      await call("https://bsky.social/xrpc/com.atproto.server.createSession", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: handle, password }),
      }),
      "accessJwt",
    ),
};
const bitbucket: Pair = {
  id: "BITBUCKET_USERNAME",
  secret: "BITBUCKET_APP_PASSWORD",
  run: async (user, password) =>
    outcome(
      await call("https://api.bitbucket.org/2.0/user", {
        headers: basic(user, password),
      }),
    ),
};
const mastodon: Pair = {
  id: "MASTODON_INSTANCE",
  secret: "MASTODON_ACCESS_TOKEN",
  run: async (instance, token) => {
    const host = instance
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host))
      return { httpStatus: 0, ok: false, detail: "Instancia no válida." };
    return outcome(
      await call(`https://${host}/api/v1/accounts/verify_credentials`, {
        headers: bearer(token),
      }),
    );
  },
};

function pairProbe(pair: Pair, side: "id" | "secret"): IntegrationProbe {
  const other = side === "id" ? pair.secret : pair.id;
  return {
    needs: [other],
    run: (credential, secrets) => {
      const theirs = secrets[other] ?? "";
      return side === "id"
        ? pair.run(credential, theirs)
        : pair.run(theirs, credential);
    },
  };
}

type Row = {
  binding: string;
  name: string;
  category: IntegrationCategory;
  unlocks: string;
  key: string;
  free: string;
  verified: string;
  docs?: string;
  minLength?: number;
  note?: string;
};

function def(row: Row, probe: IntegrationProbe): IntegrationDefinition {
  return {
    binding: row.binding,
    name: row.name,
    category: row.category,
    unlocks: row.unlocks,
    sourceIds: [],
    apiKeyUrl: row.key,
    documentationUrl: row.docs ?? row.key,
    freeTierNote: row.free,
    probe,
    minLength: row.minLength,
    verified: row.verified,
    probeNote: row.note,
  };
}

/** Dos filas (id y secreto) que comparten consola, categoría y verificación. */
function pairRows(
  pair: Pair,
  category: IntegrationCategory,
  service: string,
  unlocks: string,
  key: string,
  labels: [string, string],
  free: [string, string],
  verified: string,
): IntegrationDefinition[] {
  const common = { category, unlocks, key, verified };
  return [
    def(
      {
        ...common,
        binding: pair.id,
        name: `${service} · ${labels[0]}`,
        free: free[0],
        minLength: 3,
      },
      pairProbe(pair, "id"),
    ),
    def(
      {
        ...common,
        binding: pair.secret,
        name: `${service} · ${labels[1]}`,
        free: free[1],
      },
      pairProbe(pair, "secret"),
    ),
  ];
}

const param = (base: string, name: string): IntegrationProbe => ({
  url: (c) => `${base}${base.includes("?") ? "&" : "?"}${name}=${q(c)}`,
});

export const EXTRA_INTEGRATIONS: IntegrationDefinition[] = [
  // --- Modelos y hubs
  def(
    {
      binding: "REPLICATE_API_TOKEN",
      name: "Replicate",
      category: "models",
      unlocks: "Modelos alojados en Replicate.",
      key: "https://replicate.com/account/api-tokens",
      docs: "https://replicate.com/docs/reference/http",
      free: "Pago por uso.",
      verified: "401 sin clave",
    },
    { url: () => "https://api.replicate.com/v1/account", headers: bearer },
  ),
  def(
    {
      binding: "MODELSCOPE_API_TOKEN",
      name: "ModelScope",
      category: "models",
      unlocks: "Catálogo de modelos de ModelScope.",
      key: "https://modelscope.cn/my/myaccesstoken",
      free: "Gratuita con cuenta.",
      verified: "401 sin clave",
    },
    {
      url: () => "https://www.modelscope.cn/api/v1/users/info",
      headers: bearer,
    },
  ),
  ...pairRows(
    kaggle,
    "models",
    "Kaggle",
    "Datasets y modelos de Kaggle.",
    "https://www.kaggle.com/settings",
    ["usuario", "clave"],
    ["Tu nombre de usuario.", "Clave de «Create legacy API key»."],
    "401 sin clave",
  ),
  // --- Investigación
  def(
    {
      binding: "OPENALEX_API_KEY",
      name: "OpenAlex · clave",
      category: "research",
      unlocks: "Presupuesto propio en OpenAlex.",
      key: "https://openalex.org/settings/api",
      docs: "https://docs.openalex.org/",
      free: "Gratuita.",
      verified: "401 sin clave",
    },
    param("https://api.openalex.org/works?per-page=1", "api_key"),
  ),
  def(
    {
      binding: "OPENALEX_CONTACT_EMAIL",
      name: "OpenAlex · correo",
      category: "research",
      unlocks: "Cola de cortesía (polite pool).",
      key: "https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication",
      free: "Tu correo; no es secreto.",
      minLength: 5,
      verified: "200 sin clave",
    },
    param("https://api.openalex.org/works?per-page=1", "mailto"),
  ),
  def(
    {
      binding: "CROSSREF_CONTACT_EMAIL",
      name: "Crossref · correo",
      category: "research",
      unlocks: "Cola de cortesía de Crossref.",
      key: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/",
      free: "Tu correo; no es secreto.",
      minLength: 5,
      verified: "200 sin clave",
    },
    param("https://api.crossref.org/works?rows=1", "mailto"),
  ),
  def(
    {
      binding: "UNPAYWALL_EMAIL",
      name: "Unpaywall · correo",
      category: "research",
      unlocks: "Enlaces de acceso abierto por DOI.",
      key: "https://unpaywall.org/products/api",
      free: "Tu correo; no es secreto.",
      minLength: 5,
      verified: "200 sin clave",
    },
    param("https://api.unpaywall.org/v2/10.1038/nature12373", "email"),
  ),
  def(
    {
      binding: "NASA_ADS_API_TOKEN",
      name: "NASA ADS",
      category: "research",
      unlocks: "Astrofísica y ciencias físicas.",
      key: "https://ui.adsabs.harvard.edu/user/settings/token",
      docs: "https://ui.adsabs.harvard.edu/help/api/",
      free: "5 000 consultas al día.",
      verified: "401 sin clave",
    },
    {
      url: () => "https://api.adsabs.harvard.edu/v1/search/query?q=llm&rows=1",
      headers: bearer,
    },
  ),
  def(
    {
      binding: "SPRINGER_NATURE_API_KEY",
      name: "Springer Nature",
      category: "research",
      unlocks: "Metadatos de Springer y Nature.",
      key: "https://dev.springernature.com/",
      free: "Plan básico gratuito.",
      verified: "401 sin clave",
    },
    param("https://api.springernature.com/meta/v2/json?q=llm&p=1", "api_key"),
  ),
  def(
    {
      binding: "ELSEVIER_API_KEY",
      name: "Elsevier / Scopus",
      category: "research",
      unlocks: "Búsqueda en Scopus.",
      key: "https://dev.elsevier.com/apikey/manage",
      free: "Gratuita con cuenta institucional.",
      verified: "401 sin clave",
    },
    {
      url: () =>
        "https://api.elsevier.com/content/search/scopus?query=llm&count=1",
      headers: (c) => ({ "x-els-apikey": c }),
    },
  ),
  def(
    {
      binding: "IEEE_XPLORE_API_KEY",
      name: "IEEE Xplore",
      category: "research",
      unlocks: "Metadatos de IEEE Xplore.",
      key: "https://developer.ieee.org/",
      free: "200 consultas al día.",
      verified: "403 sin clave",
    },
    param(
      "https://ieeexploreapi.ieee.org/api/v1/search/articles?querytext=llm&max_records=1",
      "apikey",
    ),
  ),
  def(
    {
      binding: "ZENODO_TOKEN",
      name: "Zenodo",
      category: "research",
      unlocks: "Datasets y software en Zenodo.",
      key: "https://zenodo.org/account/settings/applications/",
      free: "Gratuito.",
      verified: "403 sin clave",
    },
    {
      url: () => "https://zenodo.org/api/deposit/depositions?size=1",
      headers: bearer,
    },
  ),
  // --- Noticias
  def(
    {
      binding: "GNEWS_API_KEY",
      name: "GNews",
      category: "news",
      unlocks: "Titulares de tecnología.",
      key: "https://gnews.io/dashboard",
      free: "100 consultas al día.",
      verified: "400 con clave mal formada",
    },
    param(
      "https://gnews.io/api/v4/top-headlines?category=technology&max=1",
      "apikey",
    ),
  ),
  def(
    {
      binding: "CURRENTS_API_KEY",
      name: "Currents",
      category: "news",
      unlocks: "Noticias recientes.",
      key: "https://currentsapi.services/en/profile",
      free: "600 consultas al día.",
      verified: "401 sin clave",
    },
    param("https://api.currentsapi.services/v1/latest-news", "apiKey"),
  ),
  def(
    {
      binding: "NYT_API_KEY",
      name: "New York Times",
      category: "news",
      unlocks: "Búsqueda de artículos del NYT.",
      key: "https://developer.nytimes.com/my-apps",
      free: "500 consultas al día.",
      verified: "401 sin clave",
    },
    param(
      "https://api.nytimes.com/svc/search/v2/articlesearch.json?q=ai",
      "api-key",
    ),
  ),
  def(
    {
      binding: "MEDIASTACK_API_KEY",
      name: "Mediastack",
      category: "news",
      unlocks: "Noticias globales.",
      key: "https://mediastack.com/dashboard",
      free: "El plan gratuito solo usa http.",
      verified: "401 sin clave (http)",
    },
    param("http://api.mediastack.com/v1/news?limit=1", "access_key"),
  ),
  def(
    {
      binding: "EVENT_REGISTRY_API_KEY",
      name: "Event Registry",
      category: "news",
      unlocks: "Artículos y eventos agrupados.",
      key: "https://newsapi.ai/dashboard",
      free: "2 000 tokens gratuitos.",
      verified: "401 sin clave",
    },
    param(
      "https://eventregistry.org/api/v1/minimalarticle/getArticles?keyword=ai",
      "apiKey",
    ),
  ),
  // --- Video
  def(
    {
      binding: "VIMEO_ACCESS_TOKEN",
      name: "Vimeo",
      category: "video",
      unlocks: "Búsqueda de videos de Vimeo.",
      key: "https://developer.vimeo.com/apps",
      free: "Token personal gratuito.",
      verified: "401 sin clave",
    },
    { url: () => "https://api.vimeo.com/me", headers: bearer },
  ),
  ...pairRows(
    dailymotion,
    "video",
    "Dailymotion",
    "Videos de Dailymotion.",
    "https://www.dailymotion.com/partner",
    ["clave", "secreto"],
    ["API key de tu app.", "API secret de tu app."],
    "200 con invalid_client sin clave",
  ),
  ...pairRows(
    twitch,
    "video",
    "Twitch",
    "Directos y videos de Twitch.",
    "https://dev.twitch.tv/console/apps",
    ["client id", "client secret"],
    ["Client ID de tu app.", "Client secret de tu app."],
    "400 sin clave",
  ),
  // --- Código
  def(
    {
      binding: "GITLAB_TOKEN",
      name: "GitLab",
      category: "code",
      unlocks: "Proyectos públicos de GitLab.",
      key: "https://gitlab.com/-/user_settings/personal_access_tokens",
      free: "Token con alcance read_api.",
      verified: "401 sin clave",
    },
    {
      url: () => "https://gitlab.com/api/v4/user",
      headers: (c) => ({ "private-token": c }),
    },
  ),
  ...pairRows(
    bitbucket,
    "code",
    "Bitbucket",
    "Repositorios de Bitbucket.",
    "https://bitbucket.org/account/settings/app-passwords/",
    ["usuario", "contraseña de app"],
    ["Tu nombre de usuario.", "Contraseña de aplicación con lectura."],
    "401 con Bearer inválido; Basic dio 503 desde esta red",
  ),
  // --- Mercado
  def(
    {
      binding: "MASSIVE_API_KEY",
      name: "Massive (antes Polygon)",
      category: "market",
      unlocks: "Series de precios de acciones.",
      key: "https://massive.com/dashboard/keys",
      free: "Plan básico gratuito.",
      verified: "401 sin clave",
    },
    param("https://api.massive.com/v2/aggs/ticker/NVDA/prev", "apiKey"),
  ),
  // --- Datos abiertos
  def(
    {
      binding: "DATA_GOV_API_KEY",
      name: "api.data.gov",
      category: "opendata",
      unlocks: "APIs abiertas de EE. UU.",
      key: "https://api.data.gov/signup/",
      free: "Gratuita. World Bank y OWID no la requieren.",
      verified: "403 sin clave",
    },
    param(
      "https://api.data.gov/ed/collegescorecard/v1/schools?per_page=1",
      "api_key",
    ),
  ),
  // --- Patentes
  def(
    {
      binding: "USPTO_API_KEY",
      name: "USPTO Open Data",
      category: "patents",
      unlocks: "Solicitudes de patente de EE. UU.",
      key: "https://data.uspto.gov/myodp",
      docs: "https://data.uspto.gov/apis/getting-started",
      free: "Gratuita. Reemplaza a PatentsView (su host ya no resuelve).",
      verified: "401 sin clave, 403 con clave falsa",
    },
    {
      url: () =>
        "https://api.uspto.gov/api/v1/patent/applications/search?q=llm&limit=1",
      headers: (c) => ({ "x-api-key": c }),
    },
  ),
  def(
    {
      binding: "LENS_API_TOKEN",
      name: "Lens.org",
      category: "patents",
      unlocks: "Patentes y literatura científica.",
      key: "https://www.lens.org/lens/user/subscriptions",
      free: "Requiere solicitar acceso.",
      verified: "401 sin clave",
    },
    {
      run: async (token) =>
        outcome(
          await call("https://api.lens.org/patent/search", {
            method: "POST",
            headers: { ...bearer(token), "content-type": "application/json" },
            body: JSON.stringify({ query: { match_all: {} }, size: 1 }),
          }),
        ),
    },
  ),
  ...pairRows(
    epo,
    "patents",
    "EPO OPS",
    "Patentes europeas (Espacenet).",
    "https://developers.epo.org/",
    ["consumer key", "consumer secret"],
    ["Consumer key de tu app.", "Consumer secret de tu app."],
    "401 sin clave",
  ),
  // --- Redes
  ...pairRows(
    reddit,
    "social",
    "Reddit",
    "Conversación pública en Reddit.",
    "https://www.reddit.com/prefs/apps",
    ["client id", "secret"],
    ["Id bajo el nombre de tu app.", "Secret de tu app tipo script."],
    "401 sin clave",
  ),
  ...pairRows(
    mastodon,
    "social",
    "Mastodon",
    "Publicaciones públicas de Mastodon.",
    "https://mastodon.social/settings/applications",
    ["instancia", "token"],
    ["Dominio, por ejemplo mastodon.social.", "Token de acceso de tu app."],
    "401 sin clave",
  ),
  ...pairRows(
    bluesky,
    "social",
    "Bluesky",
    "Publicaciones públicas de Bluesky.",
    "https://bsky.app/settings/app-passwords",
    ["usuario", "contraseña de app"],
    [
      "Handle, por ejemplo tu.bsky.social.",
      "Contraseña de aplicación, no la principal.",
    ],
    "401 sin clave",
  ),
];
