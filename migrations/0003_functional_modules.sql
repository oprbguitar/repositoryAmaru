PRAGMA foreign_keys = ON;

-- Rankings reales de modelos (procedencia completa)
CREATE TABLE IF NOT EXISTS model_rankings (
  id TEXT PRIMARY KEY,
  model_external_id TEXT NOT NULL,
  model_title TEXT NOT NULL,
  ranking_type TEXT NOT NULL,
  ranking_position INTEGER NOT NULL,
  score REAL,
  score_unit TEXT,
  source_id TEXT NOT NULL REFERENCES source_registry(id),
  source_name TEXT NOT NULL,
  ranking_date TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  methodology TEXT NOT NULL,
  methodology_url TEXT,
  confidence TEXT NOT NULL DEFAULT 'high',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ranking_type, model_external_id, ranking_date)
);
CREATE INDEX IF NOT EXISTS idx_model_rankings_type ON model_rankings(ranking_type, ranking_date DESC, ranking_position ASC);

-- Ofertas del mismo modelo por proveedor (precios sin fusionar)
CREATE TABLE IF NOT EXISTS model_offerings (
  id TEXT PRIMARY KEY,
  model_external_id TEXT NOT NULL,
  model_title TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_model_identifier TEXT,
  input_price_per_million REAL,
  output_price_per_million REAL,
  cached_input_price_per_million REAL,
  request_price REAL,
  image_price REAL,
  original_pricing_json TEXT NOT NULL DEFAULT '{}',
  context_length INTEGER,
  max_completion_tokens INTEGER,
  quantization TEXT,
  status TEXT,
  supported_parameters_json TEXT NOT NULL DEFAULT '[]',
  pricing_source_id TEXT NOT NULL REFERENCES source_registry(id),
  pricing_source_name TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(model_external_id, provider_name)
);
CREATE INDEX IF NOT EXISTS idx_model_offerings_model ON model_offerings(model_external_id, input_price_per_million ASC);

-- Entidades geolocalizadas con coordenadas provistas por la fuente
CREATE TABLE IF NOT EXISTS map_locations (
  id TEXT PRIMARY KEY,
  entity_kind TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  country_code TEXT,
  country_name TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  works_count INTEGER,
  ai_works_count INTEGER,
  homepage_url TEXT,
  external_id TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES source_registry(id),
  source_name TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_map_locations_country ON map_locations(country_code, entity_kind);

-- Registro curado de fuentes de video
CREATE TABLE IF NOT EXISTS video_sources (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  channel_id TEXT,
  channel_title TEXT NOT NULL,
  category TEXT NOT NULL,
  is_official INTEGER NOT NULL DEFAULT 0 CHECK (is_official IN (0, 1)),
  language TEXT,
  region TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Videos indexados desde APIs oficiales
CREATE TABLE IF NOT EXISTS video_items (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channel_id TEXT,
  channel_title TEXT NOT NULL,
  is_official_channel INTEGER NOT NULL DEFAULT 0 CHECK (is_official_channel IN (0, 1)),
  published_at TEXT,
  thumbnail_url TEXT,
  watch_url TEXT NOT NULL,
  language TEXT,
  topic TEXT NOT NULL,
  query_group TEXT NOT NULL,
  duration_seconds INTEGER,
  view_count INTEGER,
  source_id TEXT NOT NULL REFERENCES source_registry(id),
  source_name TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, external_id)
);
CREATE INDEX IF NOT EXISTS idx_video_items_recent ON video_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_items_topic ON video_items(topic, published_at DESC);

-- Proyectos del laboratorio
CREATE TABLE IF NOT EXISTS laboratory_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  inputs_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS laboratory_alternatives (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES laboratory_projects(id) ON DELETE CASCADE,
  alternative_kind TEXT NOT NULL CHECK (alternative_kind IN ('economic','local','professional')),
  recommendation_json TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  calculated_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, alternative_kind)
);

-- Nuevas fuentes
INSERT OR IGNORE INTO source_registry
  (id, name, source_type, base_url, enabled, configured, frequency_minutes, status, personal_use_allowed,
   public_display_allowed, historical_storage_allowed, attribution_required, slug, category, endpoint,
   source_format, authentication_type, secret_binding_name, is_official, is_enabled, trust_level,
   update_frequency_minutes, rate_limit_notes, adapter_name, terms_url)
VALUES
  ('youtube', 'YouTube Data API', 'video', 'https://www.googleapis.com', 1, 0, 720, 'not_configured', 1, 1, 1, 1, 'youtube', 'videos', 'https://www.googleapis.com/youtube/v3/search', 'json', 'api_key', 'YOUTUBE_API_KEY', 1, 1, 'high', 720, 'Cuota diaria de 10000 unidades; search cuesta 100', 'youtube', 'https://developers.google.com/youtube/terms/api-services-terms-of-service'),
  ('openalex-institutions', 'OpenAlex Institutions', 'research', 'https://openalex.org', 1, 1, 1440, 'ready', 1, 1, 1, 1, 'openalex-institutions', 'map', 'https://api.openalex.org/institutions', 'json', 'none', NULL, 1, 1, 'high', 1440, 'API pública; coordenadas provistas por la fuente', 'openalex-institutions', 'https://openalex.org/terms'),
  ('meta-graph', 'Meta Graph API', 'video', 'https://graph.facebook.com', 0, 0, 1440, 'not_configured', 1, 0, 1, 1, 'meta-graph', 'videos', NULL, 'json', 'bearer', 'FACEBOOK_PAGE_ACCESS_TOKEN', 1, 0, 'high', 1440, 'Solo cuentas autorizadas; sin scraping', NULL, 'https://developers.facebook.com/terms/'),
  ('x-api', 'X API v2', 'social', 'https://api.x.com', 0, 0, 1440, 'not_configured', 1, 0, 1, 1, 'x-api', 'social', 'https://api.x.com/2/tweets/search/recent', 'json', 'bearer', 'X_BEARER_TOKEN', 1, 0, 'high', 1440, 'Solo búsqueda reciente de cuentas verificadas', NULL, 'https://developer.x.com/en/developer-terms'),
  ('scielo', 'SciELO', 'research', 'https://scielo.org', 0, 0, 10080, 'registered', 1, 1, 1, 1, 'scielo', 'research', NULL, 'oai-pmh', 'none', NULL, 1, 0, 'high', 10080, 'Fuente registrada — sincronización manual pendiente', NULL, 'https://scielo.org'),
  ('la-referencia', 'LA Referencia', 'research', 'https://www.lareferencia.info', 0, 0, 10080, 'registered', 1, 1, 1, 1, 'la-referencia', 'research', NULL, 'oai-pmh', 'none', NULL, 1, 0, 'high', 10080, 'Fuente registrada — sincronización manual pendiente', NULL, 'https://www.lareferencia.info'),
  ('alicia-concytec', 'ALICIA – CONCYTEC', 'research', 'https://alicia.concytec.gob.pe', 0, 0, 10080, 'registered', 1, 1, 1, 1, 'alicia-concytec', 'research', NULL, 'oai-pmh', 'none', NULL, 1, 0, 'high', 10080, 'Fuente registrada — sincronización manual pendiente', NULL, 'https://alicia.concytec.gob.pe'),
  ('renati', 'RENATI', 'research', 'https://renati.sunedu.gob.pe', 0, 0, 10080, 'registered', 1, 1, 1, 1, 'renati', 'research', NULL, 'html', 'none', NULL, 1, 0, 'high', 10080, 'Fuente registrada — sincronización manual pendiente', NULL, 'https://renati.sunedu.gob.pe');

-- Canales oficiales curados (IDs verificables antes de sincronizar; la sincronización
-- solo usa canales con channel_id no nulo)
INSERT OR IGNORE INTO video_sources (id, platform, channel_id, channel_title, category, is_official, language, region) VALUES
  ('yt-openai', 'youtube', NULL, 'OpenAI', 'provider', 1, 'en', 'US'),
  ('yt-anthropic', 'youtube', NULL, 'Anthropic', 'provider', 1, 'en', 'US'),
  ('yt-deepmind', 'youtube', NULL, 'Google DeepMind', 'provider', 1, 'en', 'GB'),
  ('yt-google-devs', 'youtube', NULL, 'Google for Developers', 'developer', 1, 'en', 'US'),
  ('yt-nvidia-dev', 'youtube', NULL, 'NVIDIA Developer', 'developer', 1, 'en', 'US'),
  ('yt-huggingface', 'youtube', NULL, 'Hugging Face', 'provider', 1, 'en', 'US'),
  ('yt-mistral', 'youtube', NULL, 'Mistral AI', 'provider', 1, 'en', 'FR'),
  ('yt-microsoft-dev', 'youtube', NULL, 'Microsoft Developer', 'developer', 1, 'en', 'US'),
  ('yt-aws-dev', 'youtube', NULL, 'AWS Developers', 'developer', 1, 'en', 'US'),
  ('yt-cloudflare-dev', 'youtube', NULL, 'Cloudflare Developers', 'developer', 1, 'en', 'US'),
  ('yt-github', 'youtube', NULL, 'GitHub', 'developer', 1, 'en', 'US'),
  ('yt-langchain', 'youtube', NULL, 'LangChain', 'project', 1, 'en', 'US'),
  ('yt-stanford-hai', 'youtube', NULL, 'Stanford HAI', 'university', 1, 'en', 'US'),
  ('yt-mit-csail', 'youtube', NULL, 'MIT CSAIL', 'university', 1, 'en', 'US');

INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('schema_version', '3', CURRENT_TIMESTAMP);
