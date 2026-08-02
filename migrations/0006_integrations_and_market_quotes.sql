PRAGMA foreign_keys = ON;

-- Credenciales de integración configuradas desde la interfaz. El valor se guarda
-- cifrado con AES-GCM usando DEVELOPER_LAB_ENCRYPTION_KEY; nunca en claro y
-- nunca se devuelve al navegador (solo los últimos cuatro caracteres).
CREATE TABLE IF NOT EXISTS integration_credentials (
  binding_name TEXT PRIMARY KEY,
  alias TEXT NOT NULL,
  last_four TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  last_tested_at TEXT,
  last_test_status TEXT,
  last_test_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cotizaciones bursátiles reales (Finnhub). Una fila por símbolo y marca de
-- tiempo devuelta por el proveedor: no se interpola ni se simula ningún precio.
CREATE TABLE IF NOT EXISTS market_quotes (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  company_name TEXT NOT NULL,
  provider_id TEXT,
  current_price REAL NOT NULL,
  change_absolute REAL,
  change_percent REAL,
  day_high REAL,
  day_low REAL,
  day_open REAL,
  previous_close REAL,
  quoted_at TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  UNIQUE(symbol, quoted_at)
);
CREATE INDEX IF NOT EXISTS idx_market_quotes_symbol ON market_quotes(symbol, quoted_at DESC);

-- Fuente de cotizaciones intradía. Queda 'not_configured' hasta que exista una
-- clave (variable de entorno o credencial cifrada guardada desde la interfaz).
INSERT OR IGNORE INTO source_registry
  (id, name, source_type, base_url, enabled, configured, frequency_minutes, status, personal_use_allowed,
   public_display_allowed, historical_storage_allowed, attribution_required, slug, category, endpoint,
   source_format, authentication_type, secret_binding_name, is_official, is_enabled, trust_level,
   update_frequency_minutes, rate_limit_notes, adapter_name, terms_url)
VALUES
  ('finnhub', 'Finnhub (cotizaciones)', 'market_quotes', 'https://finnhub.io', 1, 0, 15, 'not_configured', 1, 1, 1, 1, 'finnhub', 'market', 'https://finnhub.io/api/v1/quote', 'json', 'api_key', 'FINNHUB_API_KEY', 0, 1, 'medium', 15, 'Plan gratuito: 60 llamadas por minuto', 'finnhub', 'https://finnhub.io/terms-of-service'),
  ('facebook-videos', 'Meta Graph API (videos)', 'video', 'https://graph.facebook.com', 1, 0, 720, 'not_configured', 1, 1, 1, 1, 'facebook-videos', 'videos', 'https://graph.facebook.com/v21.0/me/videos', 'json', 'bearer', 'FACEBOOK_PAGE_ACCESS_TOKEN', 1, 1, 'high', 720, 'Token de página con permisos pages_read_engagement', 'facebook-videos', 'https://developers.facebook.com/terms/');

-- El identificador externo de los fundamentos XBRL pasa a incluir el fin de
-- periodo (antes solo empresa+etiqueta+formulario, una fila por formulario).
-- Se limpian las filas antiguas para que no convivan dos identificadores del
-- mismo hecho: la próxima sincronización los vuelve a traer desde la SEC.
DELETE FROM observatory_records WHERE source_id = 'sec-xbrl';
UPDATE source_registry SET last_success_at = NULL, record_count = 0 WHERE id = 'sec-xbrl';

INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('schema_version', '6', CURRENT_TIMESTAMP);
