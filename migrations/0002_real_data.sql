PRAGMA foreign_keys = ON;

ALTER TABLE source_registry ADD COLUMN slug TEXT;
ALTER TABLE source_registry ADD COLUMN category TEXT;
ALTER TABLE source_registry ADD COLUMN endpoint TEXT;
ALTER TABLE source_registry ADD COLUMN source_format TEXT;
ALTER TABLE source_registry ADD COLUMN authentication_type TEXT NOT NULL DEFAULT 'none';
ALTER TABLE source_registry ADD COLUMN secret_binding_name TEXT;
ALTER TABLE source_registry ADD COLUMN is_official INTEGER NOT NULL DEFAULT 0 CHECK (is_official IN (0, 1));
ALTER TABLE source_registry ADD COLUMN is_enabled INTEGER NOT NULL DEFAULT 0 CHECK (is_enabled IN (0, 1));
ALTER TABLE source_registry ADD COLUMN trust_level TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE source_registry ADD COLUMN update_frequency_minutes INTEGER NOT NULL DEFAULT 720;
ALTER TABLE source_registry ADD COLUMN rate_limit_notes TEXT;
ALTER TABLE source_registry ADD COLUMN last_http_status INTEGER;
ALTER TABLE source_registry ADD COLUMN adapter_name TEXT;
ALTER TABLE source_registry ADD COLUMN record_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE source_registry ADD COLUMN daily_request_estimate INTEGER NOT NULL DEFAULT 0;
ALTER TABLE source_registry ADD COLUMN rate_limit_remaining INTEGER;
ALTER TABLE source_registry ADD COLUMN last_request_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_source_registry_slug ON source_registry(slug);
CREATE INDEX IF NOT EXISTS idx_source_registry_health ON source_registry(is_enabled, status, last_success_at);

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  categories_json TEXT NOT NULL DEFAULT '[]',
  api_available INTEGER NOT NULL DEFAULT 0 CHECK (api_available IN (0, 1)),
  free_tier_status TEXT,
  local_execution_available INTEGER NOT NULL DEFAULT 0 CHECK (local_execution_available IN (0, 1)),
  documentation_url TEXT,
  models_url TEXT,
  pricing_url TEXT,
  api_key_url TEXT,
  changelog_url TEXT,
  console_url TEXT,
  examples_url TEXT,
  source_id TEXT REFERENCES source_registry(id),
  last_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS observatory_records (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES source_registry(id),
  record_kind TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  original_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  published_at TEXT,
  detected_at TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  confidence_level TEXT NOT NULL,
  language TEXT,
  country_region TEXT,
  last_successful_sync_at TEXT NOT NULL,
  provider_id TEXT REFERENCES providers(id),
  data_json TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  is_stale INTEGER NOT NULL DEFAULT 0 CHECK (is_stale IN (0, 1)),
  UNIQUE(source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_records_kind_date ON observatory_records(record_kind, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_provider ON observatory_records(provider_id, record_kind);
CREATE INDEX IF NOT EXISTS idx_records_source ON observatory_records(source_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS synchronization_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES source_registry(id),
  scope TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','running','completed','partial','failed','rate_limited','not_configured')),
  requested_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  discovered_count INTEGER NOT NULL DEFAULT 0,
  stored_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  http_status INTEGER,
  rate_limit_remaining INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_recent ON synchronization_runs(requested_at DESC);

CREATE TABLE IF NOT EXISTS live_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  record_id TEXT REFERENCES observatory_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_at TEXT NOT NULL,
  source_name TEXT NOT NULL,
  target_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_events_recent ON live_events(event_at DESC);

CREATE TABLE IF NOT EXISTS repository_snapshots (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES observatory_records(id) ON DELETE CASCADE,
  snapshot_date TEXT NOT NULL,
  stars INTEGER NOT NULL,
  forks INTEGER NOT NULL,
  open_issues INTEGER NOT NULL,
  captured_at TEXT NOT NULL,
  UNIQUE(record_id, snapshot_date)
);

INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('schema_version', '2', CURRENT_TIMESTAMP);

UPDATE source_registry SET slug = 'local-library', category = 'local', endpoint = 'local-directory',
  source_format = 'filesystem', is_official = 1, is_enabled = 1, trust_level = 'high',
  update_frequency_minutes = frequency_minutes, adapter_name = 'local-library'
WHERE id = 'local-library';

INSERT OR IGNORE INTO source_registry
  (id, name, source_type, base_url, enabled, configured, frequency_minutes, status, personal_use_allowed,
   public_display_allowed, historical_storage_allowed, attribution_required, slug, category, endpoint,
   source_format, authentication_type, secret_binding_name, is_official, is_enabled, trust_level,
   update_frequency_minutes, rate_limit_notes, adapter_name, terms_url)
VALUES
  ('openrouter', 'OpenRouter', 'model_catalog', 'https://openrouter.ai', 1, 1, 360, 'ready', 1, 1, 1, 1, 'openrouter', 'models', 'https://openrouter.ai/api/v1/models', 'json', 'none', NULL, 1, 1, 'high', 360, 'Catálogo público; respetar cabeceras de límite', 'openrouter', 'https://openrouter.ai/terms'),
  ('hugging-face', 'Hugging Face Hub', 'model_catalog', 'https://huggingface.co', 1, 1, 360, 'ready', 1, 1, 1, 1, 'hugging-face', 'models', 'https://huggingface.co/api/models', 'json', 'optional_bearer', 'HUGGINGFACE_TOKEN', 1, 1, 'high', 360, 'Modo público limitado; token opcional', 'hugging-face', 'https://huggingface.co/terms-of-service'),
  ('arxiv', 'arXiv', 'research', 'https://arxiv.org', 1, 1, 360, 'ready', 1, 1, 1, 1, 'arxiv', 'research', 'https://export.arxiv.org/api/query', 'atom', 'none', NULL, 1, 1, 'high', 360, 'Solicitudes espaciadas según condiciones de arXiv', 'arxiv', 'https://info.arxiv.org/help/api/tou.html'),
  ('openalex', 'OpenAlex', 'research', 'https://openalex.org', 1, 1, 720, 'ready', 1, 1, 1, 1, 'openalex', 'research', 'https://api.openalex.org/works', 'json', 'none', NULL, 1, 1, 'high', 720, 'API pública; usar paginación y correo cuando se configure', 'openalex', 'https://openalex.org/terms'),
  ('crossref', 'Crossref', 'research_validation', 'https://www.crossref.org', 1, 1, 720, 'ready', 1, 1, 1, 1, 'crossref', 'research', 'https://api.crossref.org/works', 'json', 'none', NULL, 1, 1, 'high', 720, 'API pública con etiqueta de agente', 'crossref', 'https://www.crossref.org/terms/'),
  ('github', 'GitHub REST', 'repository', 'https://github.com', 1, 1, 360, 'ready', 1, 1, 1, 1, 'github', 'repositories', 'https://api.github.com/search/repositories', 'json', 'optional_bearer', 'GITHUB_TOKEN', 1, 1, 'high', 360, '60 solicitudes/hora sin token; límites mayores con token', 'github', 'https://docs.github.com/en/site-policy/github-terms/github-terms-of-service'),
  ('openai-news', 'OpenAI News', 'official_news', 'https://openai.com', 1, 1, 720, 'ready', 1, 1, 1, 1, 'openai-news', 'news', 'https://openai.com/news/rss.xml', 'rss', 'none', NULL, 1, 1, 'high', 720, 'Feed oficial', 'official-feed', 'https://openai.com/policies/terms-of-use/'),
  ('sec-edgar', 'SEC EDGAR', 'filing', 'https://www.sec.gov', 1, 1, 720, 'ready', 1, 1, 1, 1, 'sec-edgar', 'market', 'https://data.sec.gov/submissions/CIK0001045810.json', 'json', 'none', NULL, 1, 1, 'high', 720, 'Requiere User-Agent identificable; máximo 10 req/s', 'sec-edgar', 'https://www.sec.gov/privacy.htm'),
  ('bcrp', 'BCRPData', 'economic_series', 'https://estadisticas.bcrp.gob.pe', 1, 1, 720, 'ready', 1, 1, 1, 1, 'bcrp', 'market', 'https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04640PD/json', 'json', 'none', NULL, 1, 1, 'high', 720, 'API pública del BCRP', 'bcrp', 'https://www.bcrp.gob.pe/');

INSERT OR IGNORE INTO providers
  (id, name, country, categories_json, api_available, free_tier_status, local_execution_available,
   documentation_url, models_url, pricing_url, api_key_url, changelog_url, console_url, examples_url, source_id)
VALUES
  ('openrouter','OpenRouter','Estados Unidos','["API agregadora","Modelos"]',1,'Catálogo público',0,'https://openrouter.ai/docs','https://openrouter.ai/models','https://openrouter.ai/models','https://openrouter.ai/settings/keys','https://openrouter.ai/announcements','https://openrouter.ai/activity','https://openrouter.ai/docs/quickstart','openrouter'),
  ('hugging-face','Hugging Face','Estados Unidos','["Hub","Modelos abiertos","Datasets","Spaces"]',1,'API pública',1,'https://huggingface.co/docs','https://huggingface.co/models','https://huggingface.co/pricing','https://huggingface.co/settings/tokens','https://huggingface.co/blog','https://huggingface.co/settings/tokens','https://huggingface.co/docs/hub/index','hugging-face'),
  ('openai','OpenAI','Estados Unidos','["API","Modelos multimodales"]',1,'No informado por la fuente',0,'https://platform.openai.com/docs','https://platform.openai.com/docs/models','https://openai.com/api/pricing/','https://platform.openai.com/api-keys','https://platform.openai.com/docs/changelog','https://platform.openai.com/','https://platform.openai.com/docs/quickstart',NULL),
  ('anthropic','Anthropic','Estados Unidos','["API","Modelos de lenguaje"]',1,'No informado por la fuente',0,'https://docs.anthropic.com/','https://docs.anthropic.com/en/docs/about-claude/models','https://www.anthropic.com/pricing','https://console.anthropic.com/settings/keys','https://docs.anthropic.com/en/release-notes/overview','https://console.anthropic.com/','https://docs.anthropic.com/en/api/getting-started',NULL),
  ('google-gemini','Google Gemini','Estados Unidos','["API","Modelos multimodales"]',1,'Disponible con límites',0,'https://ai.google.dev/gemini-api/docs','https://ai.google.dev/gemini-api/docs/models','https://ai.google.dev/gemini-api/docs/pricing','https://aistudio.google.com/app/apikey','https://ai.google.dev/gemini-api/docs/changelog','https://aistudio.google.com/','https://ai.google.dev/gemini-api/docs/quickstart',NULL),
  ('groq','Groq','Estados Unidos','["API de inferencia"]',1,'Disponible con límites',0,'https://console.groq.com/docs','https://console.groq.com/docs/models','https://groq.com/pricing/','https://console.groq.com/keys','https://console.groq.com/docs/changelog','https://console.groq.com/','https://console.groq.com/docs/quickstart',NULL),
  ('mistral','Mistral AI','Francia','["API","Modelos abiertos"]',1,'No informado por la fuente',1,'https://docs.mistral.ai/','https://docs.mistral.ai/getting-started/models/models_overview/','https://mistral.ai/pricing','https://console.mistral.ai/api-keys','https://docs.mistral.ai/getting-started/changelog/','https://console.mistral.ai/','https://docs.mistral.ai/getting-started/quickstart/',NULL),
  ('nvidia','NVIDIA','Estados Unidos','["GPU","Modelos","API"]',1,'Catálogo público',1,'https://docs.nvidia.com/','https://build.nvidia.com/models','https://www.nvidia.com/en-us/data-center/products/ai-enterprise/pricing/','https://build.nvidia.com/','https://developer.nvidia.com/blog/','https://build.nvidia.com/','https://build.nvidia.com/explore/discover',NULL),
  ('cohere','Cohere','Canadá','["API","Embeddings","Reranking"]',1,'Disponible con límites',0,'https://docs.cohere.com/','https://docs.cohere.com/docs/models','https://cohere.com/pricing','https://dashboard.cohere.com/api-keys','https://docs.cohere.com/changelog','https://dashboard.cohere.com/','https://docs.cohere.com/docs/quickstart',NULL),
  ('together','Together AI','Estados Unidos','["API","Modelos abiertos"]',1,'No informado por la fuente',0,'https://docs.together.ai/','https://api.together.ai/models','https://www.together.ai/pricing','https://api.together.ai/settings/api-keys','https://docs.together.ai/docs/changelog','https://api.together.ai/','https://docs.together.ai/docs/quickstart',NULL),
  ('fireworks','Fireworks AI','Estados Unidos','["API de inferencia"]',1,'No informado por la fuente',0,'https://docs.fireworks.ai/','https://fireworks.ai/models','https://fireworks.ai/pricing','https://fireworks.ai/account/api-keys','https://docs.fireworks.ai/changelog','https://fireworks.ai/dashboard','https://docs.fireworks.ai/getting-started/introduction',NULL),
  ('cerebras','Cerebras','Estados Unidos','["API de inferencia","Hardware"]',1,'Disponible con límites',0,'https://inference-docs.cerebras.ai/','https://inference-docs.cerebras.ai/introduction','https://www.cerebras.ai/pricing','https://cloud.cerebras.ai/','https://inference-docs.cerebras.ai/support/changelog','https://cloud.cerebras.ai/','https://inference-docs.cerebras.ai/quickstart',NULL),
  ('deepinfra','DeepInfra','Estados Unidos','["API","Modelos abiertos"]',1,'No informado por la fuente',0,'https://deepinfra.com/docs','https://deepinfra.com/models','https://deepinfra.com/pricing','https://deepinfra.com/dash/api_keys','https://deepinfra.com/changelog','https://deepinfra.com/dash','https://deepinfra.com/docs/getting-started',NULL),
  ('deepseek','DeepSeek','China','["API","Modelos abiertos"]',1,'No informado por la fuente',1,'https://api-docs.deepseek.com/','https://api-docs.deepseek.com/quick_start/pricing','https://api-docs.deepseek.com/quick_start/pricing','https://platform.deepseek.com/api_keys','https://api-docs.deepseek.com/updates/','https://platform.deepseek.com/','https://api-docs.deepseek.com/',NULL),
  ('xai','xAI','Estados Unidos','["API","Modelos multimodales"]',1,'No informado por la fuente',0,'https://docs.x.ai/','https://docs.x.ai/docs/models','https://docs.x.ai/docs/models','https://console.x.ai/','https://docs.x.ai/docs/release-notes','https://console.x.ai/','https://docs.x.ai/docs/tutorial',NULL),
  ('replicate','Replicate','Estados Unidos','["API","Modelos comunitarios"]',1,'Crédito sujeto a cuenta',0,'https://replicate.com/docs','https://replicate.com/explore','https://replicate.com/pricing','https://replicate.com/account/api-tokens','https://replicate.com/changelog','https://replicate.com/account','https://replicate.com/docs/get-started/nodejs',NULL),
  ('cloudflare-workers-ai','Cloudflare Workers AI','Estados Unidos','["Inferencia edge","Modelos"]',1,'Asignación incluida según plan',0,'https://developers.cloudflare.com/workers-ai/','https://developers.cloudflare.com/workers-ai/models/','https://developers.cloudflare.com/workers-ai/platform/pricing/','https://dash.cloudflare.com/profile/api-tokens','https://developers.cloudflare.com/changelog/?product=workers-ai','https://dash.cloudflare.com/','https://developers.cloudflare.com/workers-ai/get-started/',NULL);

INSERT OR IGNORE INTO source_registry
  (id, name, source_type, base_url, enabled, configured, frequency_minutes, status, personal_use_allowed,
   public_display_allowed, historical_storage_allowed, attribution_required, slug, category, endpoint,
   source_format, authentication_type, secret_binding_name, is_official, is_enabled, trust_level,
   update_frequency_minutes, rate_limit_notes, adapter_name, terms_url)
VALUES
  ('openai-api','OpenAI Models API','https_api','https://api.openai.com',1,0,720,'not_configured',1,1,1,1,'openai-api','models','https://api.openai.com/v1/models','json','bearer','OPENAI_API_KEY',1,1,'high',720,'Límites dependen de la cuenta','openai-api','https://openai.com/policies/terms-of-use/'),
  ('gemini-api','Google Gemini Models API','https_api','https://generativelanguage.googleapis.com',1,0,720,'not_configured',1,1,1,1,'gemini-api','models','https://generativelanguage.googleapis.com/v1beta/models','json','api_key','GEMINI_API_KEY',1,1,'high',720,'Límites dependen del proyecto','gemini-api','https://ai.google.dev/gemini-api/terms'),
  ('groq-api','Groq Models API','https_api','https://api.groq.com',1,0,720,'not_configured',1,1,1,1,'groq-api','models','https://api.groq.com/openai/v1/models','json','bearer','GROQ_API_KEY',1,1,'high',720,'Límites dependen de la cuenta','groq-api','https://groq.com/terms-of-use/'),
  ('mistral-api','Mistral Models API','https_api','https://api.mistral.ai',1,0,720,'not_configured',1,1,1,1,'mistral-api','models','https://api.mistral.ai/v1/models','json','bearer','MISTRAL_API_KEY',1,1,'high',720,'Límites dependen de la cuenta','mistral-api','https://mistral.ai/terms/');

UPDATE providers SET source_id = 'openai-api' WHERE id = 'openai';
UPDATE providers SET source_id = 'gemini-api' WHERE id = 'google-gemini';
UPDATE providers SET source_id = 'groq-api' WHERE id = 'groq';
UPDATE providers SET source_id = 'mistral-api' WHERE id = 'mistral';
